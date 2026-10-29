// Creates the database (if missing) and its tables from database/schema.sql.
// Usage: npm run db:init        (uses backend/.env)
//        npm run db:init:test   (uses backend/.env.test)
// Non-destructive: existing tables and data are left untouched.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

// `--test` targets the test database from .env.test (works on Windows too,
// where `NODE_ENV=test npm run ...` syntax isn't available).
if (process.argv.includes("--test")) process.env.NODE_ENV = "test";
const { env } = await import("../src/config/env.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, "../database/schema.sql");

async function main() {
  // Connect WITHOUT selecting a database, because it may not exist yet.
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    ssl: env.db.ssl,
    multipleStatements: true, // only here, for running the trusted schema file
  });

  try {
    // Identifiers can't be `?` parameters, so the name is checked strictly.
    if (!/^[A-Za-z0-9_]+$/.test(env.db.database)) {
      throw new Error("DB_NAME may only contain letters, numbers and underscores.");
    }
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
    );
    await connection.query(`USE \`${env.db.database}\``);

    const schema = await fs.readFile(schemaPath, "utf8");
    await connection.query(schema);
    console.log(`✔ Database "${env.db.database}" is ready (tables: users, transactions).`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("✖ Database initialisation failed:", error.message);
  process.exit(1);
});
