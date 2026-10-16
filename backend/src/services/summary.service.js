// All financial calculations live here, as SQL aggregate queries.
// The dashboard and the reports both call these same functions, so a total
// can never be calculated two different ways in two places.
import { query } from "../config/db.js";
import { toMoney } from "../utils/money.js";
import { monthsBetween } from "../utils/dates.js";
import { mapTransaction } from "./transaction.service.js";

// Income, expense, net and count for a date range (or all time if no range).
export async function getTotals(userId, { from, to } = {}) {
  const conditions = ["user_id = ?"];
  const params = [userId];
  if (from) {
    conditions.push("transaction_date >= ?");
    params.push(from);
  }
  if (to) {
    conditions.push("transaction_date <= ?");
    params.push(to);
  }

  const [row] = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE -amount END), 0) AS net,
       COUNT(*) AS count
     FROM transactions
     WHERE ${conditions.join(" AND ")}`,
    params
  );

  return {
    income: toMoney(row.income),
    expense: toMoney(row.expense),
    net: toMoney(row.net),
    count: Number(row.count),
  };
}

// One entry per calendar month in the range. Months with no transactions
// are filled in with zeros so charts don't skip them.
export async function getMonthlyTotals(userId, { from, to }) {
  const rows = await query(
    `SELECT
       DATE_FORMAT(transaction_date, '%Y-%m') AS month,
       SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense,
       SUM(CASE WHEN type = 'income'  THEN amount ELSE -amount END) AS net
     FROM transactions
     WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
     GROUP BY month
     ORDER BY month`,
    [userId, from, to]
  );

  const byMonth = new Map(rows.map((row) => [row.month, row]));
  return monthsBetween(from, to).map((month) => {
    const row = byMonth.get(month);
    return {
      month,
      income: toMoney(row?.income),
      expense: toMoney(row?.expense),
      net: toMoney(row?.net),
    };
  });
}

// Totals per category for one type, largest first, with each category's
// share of the total as a percentage.
export async function getCategoryBreakdown(userId, { from, to, type = "expense" }) {
  const rows = await query(
    `SELECT category, SUM(amount) AS total, COUNT(*) AS count
       FROM transactions
      WHERE user_id = ? AND type = ? AND transaction_date BETWEEN ? AND ?
      GROUP BY category
      ORDER BY total DESC, category ASC`,
    [userId, type, from, to]
  );

  const [sumRow] = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
      WHERE user_id = ? AND type = ? AND transaction_date BETWEEN ? AND ?`,
    [userId, type, from, to]
  );
  const grandTotal = toMoney(sumRow.total);

  return {
    total: grandTotal,
    categories: rows.map((row) => {
      const total = toMoney(row.total);
      return {
        category: row.category,
        total,
        count: Number(row.count),
        percentage: grandTotal > 0 ? Number(((total / grandTotal) * 100).toFixed(1)) : 0,
      };
    }),
  };
}

export async function getRecentTransactions(userId, limit = 5) {
  const rows = await query(
    `SELECT id, type, amount, category, description,
            transaction_date AS transactionDate,
            created_at AS createdAt, updated_at AS updatedAt
       FROM transactions
      WHERE user_id = ?
      ORDER BY transaction_date DESC, id DESC
      LIMIT ?`,
    [userId, String(limit)]
  );
  return rows.map(mapTransaction);
}
