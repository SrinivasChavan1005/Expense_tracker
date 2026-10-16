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

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  port: Number(process.env.PORT) || 5000,

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: required("DB_USER"),
    password: process.env.DB_PASSWORD ?? "",
    database: required("DB_NAME"),
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
