// CRUD for income and expense transactions. `req.userId` comes from the
// requireAuth middleware, never from the request body, so a client cannot
// act on another user's behalf by sending a different user id.
import {
  parseId,
  parseTransactionFilters,
  validateTransaction,
} from "../utils/validation.js";
import { notFound } from "../utils/AppError.js";
import {
  listTransactions,
  findTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listTransactionsForExport,
} from "../services/transaction.service.js";
import { toCsv } from "../utils/csv.js";

// "Not found" is returned both when the row doesn't exist and when it belongs
// to someone else, so ids of other users' data are never confirmed.
const NOT_FOUND_MESSAGE = "Transaction not found.";

export async function list(req, res) {
  const filters = parseTransactionFilters(req.query);
  const result = await listTransactions(req.userId, filters);
  res.json({
    success: true,
    data: result.transactions,
    meta: { pagination: result.pagination, totalAmount: result.totalAmount },
  });
}

export async function getOne(req, res) {
  const transaction = await findTransaction(req.userId, parseId(req.params.id));
  if (!transaction) throw notFound(NOT_FOUND_MESSAGE);
  res.json({ success: true, data: transaction });
}

export async function create(req, res) {
  const data = validateTransaction(req.body);
  const transaction = await createTransaction(req.userId, data);
  res.status(201).json({ success: true, data: transaction });
}

export async function update(req, res) {
  const id = parseId(req.params.id);
  const data = validateTransaction(req.body);
  const transaction = await updateTransaction(req.userId, id, data);
  if (!transaction) throw notFound(NOT_FOUND_MESSAGE);
  res.json({ success: true, data: transaction });
}

export async function remove(req, res) {
  const id = parseId(req.params.id);
  const deleted = await deleteTransaction(req.userId, id);
  if (!deleted) throw notFound(NOT_FOUND_MESSAGE);
  res.json({ success: true, data: { id } });
}

export async function exportCsv(req, res) {
  // Same filters as the list, but without paging.
  const filters = parseTransactionFilters({ ...req.query, page: undefined, limit: undefined });
  const rows = await listTransactionsForExport(req.userId, filters);

  const csv = toCsv(
    ["Date", "Type", "Category", "Description", "Amount"],
    rows.map((t) => [t.transactionDate, t.type, t.category, t.description ?? "", t.amount.toFixed(2)])
  );

  const today = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="transactions-${today}.csv"`);
  // The BOM (﻿) makes Excel open the file as UTF-8 (so ₹ etc. display).
  res.send(`﻿${csv}`);
}
