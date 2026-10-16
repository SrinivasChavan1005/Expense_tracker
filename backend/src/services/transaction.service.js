// Database access for the `transactions` table.
//
// OWNERSHIP RULE: every query here includes `user_id = ?` with the logged-in
// user's id from the JWT. A user can therefore never read, change or delete a
// row that belongs to someone else, even by guessing its id.
import { query } from "../config/db.js";
import { SORT_COLUMNS } from "../utils/validation.js";
import { toMoney } from "../utils/money.js";

const SELECT_COLUMNS = `
  id, type, amount, category, description,
  transaction_date AS transactionDate,
  created_at AS createdAt, updated_at AS updatedAt`;

export function mapTransaction(row) {
  return { ...row, amount: toMoney(row.amount) };
}

// Escape LIKE wildcards so a search for "50%" matches the literal text.
const escapeLike = (text) => text.replace(/[\\%_]/g, (ch) => `\\${ch}`);

// Builds a WHERE clause + parameter list from validated filters.
// Values always go into `params`; only fixed SQL fragments go into the string.
export function buildWhere(userId, filters = {}) {
  const conditions = ["user_id = ?"];
  const params = [userId];

  if (filters.type) {
    conditions.push("type = ?");
    params.push(filters.type);
  }
  if (filters.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }
  if (filters.from) {
    conditions.push("transaction_date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push("transaction_date <= ?");
    params.push(filters.to);
  }
  if (filters.minAmount !== undefined) {
    conditions.push("amount >= ?");
    params.push(filters.minAmount);
  }
  if (filters.maxAmount !== undefined) {
    conditions.push("amount <= ?");
    params.push(filters.maxAmount);
  }
  if (filters.search) {
    const pattern = `%${escapeLike(filters.search)}%`;
    conditions.push("(description LIKE ? OR category LIKE ?)");
    params.push(pattern, pattern);
  }

  return { where: `WHERE ${conditions.join(" AND ")}`, params };
}

function orderBy(filters) {
  const column = SORT_COLUMNS[filters.sort] ?? SORT_COLUMNS.date;
  const direction = filters.order === "asc" ? "ASC" : "DESC";
  // `id` as a tie-breaker keeps the order stable between pages.
  return `ORDER BY ${column} ${direction}, id ${direction}`;
}

export async function listTransactions(userId, filters) {
  const { where, params } = buildWhere(userId, filters);
  const offset = (filters.page - 1) * filters.limit;

  // LIMIT/OFFSET are passed as strings: MySQL 8's prepared statements reject
  // JS numbers there. They were already validated as small positive integers.
  const rows = await query(
    `SELECT ${SELECT_COLUMNS} FROM transactions ${where} ${orderBy(filters)} LIMIT ? OFFSET ?`,
    [...params, String(filters.limit), String(offset)]
  );

  // Totals for ALL matching rows (not just this page), computed by MySQL.
  const [summary] = await query(
    `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS totalAmount FROM transactions ${where}`,
    params
  );

  const total = Number(summary.count);
  return {
    transactions: rows.map(mapTransaction),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
    totalAmount: toMoney(summary.totalAmount),
  };
}

export async function findTransaction(userId, id) {
  const rows = await query(
    `SELECT ${SELECT_COLUMNS} FROM transactions WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return rows[0] ? mapTransaction(rows[0]) : null;
}

export async function createTransaction(userId, data) {
  const result = await query(
    `INSERT INTO transactions (user_id, type, amount, category, description, transaction_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, data.type, data.amount, data.category, data.description, data.transactionDate]
  );
  return findTransaction(userId, result.insertId);
}

// Returns the updated row, or null if it doesn't exist / isn't this user's.
export async function updateTransaction(userId, id, data) {
  const result = await query(
    `UPDATE transactions
        SET type = ?, amount = ?, category = ?, description = ?, transaction_date = ?
      WHERE id = ? AND user_id = ?`,
    [data.type, data.amount, data.category, data.description, data.transactionDate, id, userId]
  );
  // affectedRows counts rows matched by WHERE, so 0 means "not found for you".
  if (result.affectedRows === 0) return null;
  return findTransaction(userId, id);
}

export async function deleteTransaction(userId, id) {
  const result = await query("DELETE FROM transactions WHERE id = ? AND user_id = ?", [id, userId]);
  return result.affectedRows > 0;
}

export const EXPORT_ROW_LIMIT = 10000;

export async function listTransactionsForExport(userId, filters) {
  const { where, params } = buildWhere(userId, filters);
  const rows = await query(
    `SELECT ${SELECT_COLUMNS} FROM transactions ${where} ${orderBy(filters)} LIMIT ?`,
    [...params, String(EXPORT_ROW_LIMIT)]
  );
  return rows.map(mapTransaction);
}
