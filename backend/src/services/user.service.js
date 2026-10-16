// Database access for the `users` table.
import { query } from "../config/db.js";

// Only these columns ever leave the server. password_hash is deliberately
// left out so it can never end up in an API response by accident.
const PUBLIC_COLUMNS = "id, name, email, created_at AS createdAt";

export async function createUser({ name, email, passwordHash }) {
  const result = await query(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, passwordHash]
  );
  return findUserById(result.insertId);
}

export async function findUserById(id) {
  const rows = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0] ?? null;
}

// The ONLY function that reads password_hash; used by login alone.
export async function findUserWithPasswordByEmail(email) {
  const rows = await query(
    "SELECT id, name, email, password_hash AS passwordHash, created_at AS createdAt FROM users WHERE email = ?",
    [email]
  );
  return rows[0] ?? null;
}
