// Loads and validates environment variables in ONE place.
// Every other file imports `env` from here instead of reading process.env
// directly, so a missing or weak setting fails fast at startup with a clear
// message instead of causing confusing errors later.
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");

// Tests use `.env.test` so they never touch your real development database.
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.join(backendRoot, envFile), quiet: true });

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy backend/.env.example to backend/${envFile} and fill it in.`
    );
  }
  return value;
}

function positiveNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return value;
}

const nodeEnv =process.env.NODE_ENV || "development";

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long.");
}

// Hosted MySQL providers (Aiven and others) give one connection URL instead of
// separate values, e.g. mysql://user:pass@host:12345/defaultdb?ssl-mode=REQUIRED
// If DATABASE_URL is set it is used; any DB_* variable still overrides a part of it.
function parseDatabaseUrl(raw) {
  if (!raw) return {};
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL (expected mysql://user:password@host:port/database).");
  }
  const sslMode = (url.searchParams.get("ssl-mode") ?? url.searchParams.get("ssl") ?? "").toLowerCase();
  return {
    host: url.hostname,
    port: url.port,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    sslRequired: ["required", "verify_ca", "verify_identity", "true"].includes(sslMode),
  };
}

const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);
const pick = (name, urlValue) => process.env[name] || urlValue || undefined;

function requiredDb(name, urlValue) {
  const value = pick(name, urlValue);
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name} (or set DATABASE_URL). ` +
        `Copy backend/.env.example to backend/${envFile} and fill it in.`
    );
  }
  return value;
}

// TLS for cloud databases. DB_SSL_CA (the provider's CA certificate, PEM text)
// lets us verify the server's identity. Without it, DB_SSL=true or
// ?ssl-mode=REQUIRED still encrypts the connection but can't verify the server.
function sslOptions() {
  const ca = process.env.DB_SSL_CA?.replace(/\\n/g, "\n").trim();
  if (ca) return { ca, rejectUnauthorized: true };
  if (process.env.DB_SSL === "true" || fromUrl.sslRequired) {
    if (nodeEnv !== "test") {
      console.warn("⚠ DB SSL is on but DB_SSL_CA is not set: the connection is encrypted but the server certificate is not verified.");
    }
    return { rejectUnauthorized: false };
  }
  return undefined;
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  port: Number(process.env.PORT) || 5000,

  db: {
    host: pick("DB_HOST", fromUrl.host) || "localhost",
    port: Number(pick("DB_PORT", fromUrl.port)) || 3306,
    user: requiredDb("DB_USER", fromUrl.user),
    password: process.env.DB_PASSWORD ?? fromUrl.password ?? "",
    database: requiredDb("DB_NAME", fromUrl.database),
    ssl: sslOptions(),
    // Serverless functions run many small copies of the app, so each one keeps
    // only a few connections open to stay under the database's limit.
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || (process.env.VERCEL ? 3 : 10),
  },

  jwtSecret,
  // How long a login lasts. The JWT and the cookie both expire after this.
  sessionHours: positiveNumber("SESSION_HOURS", 24),

  // Comma-separated list of browser origins allowed to call the API.
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
