// Entry point: checks the database connection, then starts listening.
import { env } from "./config/env.js";
import { checkDatabaseConnection, pool } from "./config/db.js";
import { createApp } from "./app.js";

async function start() {
  try {
    await checkDatabaseConnection();
    console.log(`✔ Connected to MySQL database "${env.db.database}"`);
  } catch (error) {
    console.error("✖ Could not connect to MySQL:", error.message);
    console.error("  Check that MySQL is running and the DB_* values in backend/.env are correct.");
    console.error("  If the database doesn't exist yet, run: npm run db:init");
    process.exit(1);
  }

  const server = createApp().listen(env.port, () => {
    console.log(`✔ API listening on http://localhost:${env.port}/api`);
  });

  // Close connections cleanly on Ctrl+C.
  const shutdown = () => {
    server.close(() => pool.end().finally(() => process.exit(0)));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
