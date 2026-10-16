// A single MySQL connection pool shared by the whole app.
// A pool keeps a few connections open and lends them out per query, which is
// much faster than opening a new connection for every request.
import mysql from "mysql2/promise";
import { env } from "./env.js";

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  // Return DATE columns as plain "YYYY-MM-DD" strings. Without this, mysql2
  // converts them to JS Date objects in the server's time zone, which can
  // shift a transaction to the previous day.
  dateStrings: true,
  // DECIMAL columns come back as strings (e.g. "1250.50") so no precision is
  // lost inside the driver. We convert them deliberately in the services.
  decimalNumbers: false,
});

// Run a parameterized query and return only the rows.
// The `?` placeholders are filled in by the driver, which escapes the values
// safely; user input is never concatenated into the SQL string.
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function checkDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}
