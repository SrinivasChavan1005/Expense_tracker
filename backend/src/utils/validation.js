// Server-side validation. Every request body and query string is checked here
// before it reaches the database. Each validator either returns clean,
// normalized values or throws a 400 error listing the problems per field, so
// the frontend can show the message next to the right input.
import { badRequest } from "./AppError.js";
import { TRANSACTION_TYPES, CATEGORIES, isValidCategory } from "./categories.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Up to 10 digits before the decimal point and 2 after: fits DECIMAL(12,2).
const AMOUNT_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export const PASSWORD_RULES =
  "Password must be 8–72 characters and include at least one letter and one number.";

function fail(errors) {
  if (Object.keys(errors).length > 0) {
    throw badRequest("Please correct the highlighted fields.", errors);
  }
}

const asTrimmedString = (value) => (typeof value === "string" ? value.trim() : "");

export function isValidDateString(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || year > 2100) return false;
  // Build the date in UTC and check it round-trips; this rejects 2026-02-30.
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateRegistration(body = {}) {
  const errors = {};
  const name = asTrimmedString(body.name);
  const email = asTrimmedString(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) errors.name = "Name is required.";
  else if (name.length > 100) errors.name = "Name must be 100 characters or fewer.";

  if (!email) errors.email = "Email is required.";
  else if (email.length > 254 || !EMAIL_PATTERN.test(email))
    errors.email = "Enter a valid email address.";

  // bcrypt only uses the first 72 BYTES of a password, so longer ones are
  // rejected instead of being silently truncated.
  if (!password) errors.password = "Password is required.";
  else if (
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  )
    errors.password = PASSWORD_RULES;

  fail(errors);
  return { name, email, password };
}

export function validateLogin(body = {}) {
  const errors = {};
  const email = asTrimmedString(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";

  fail(errors);
  return { email, password };
}

export function validateTransaction(body = {}) {
  const errors = {};
  const type = body.type;
  const category = asTrimmedString(body.category);
  const description = asTrimmedString(body.description);
  const transactionDate = asTrimmedString(body.transactionDate);
  // Accept 1250, 1250.5 or "1250.50". Keep it as a string so no
  // floating-point rounding happens before MySQL stores it as DECIMAL.
  const rawAmount =
    typeof body.amount === "number" || typeof body.amount === "string"
      ? String(body.amount).trim()
      : "";

  if (!TRANSACTION_TYPES.includes(type)) {
    errors.type = "Type must be either income or expense.";
  }

  if (!rawAmount) errors.amount = "Amount is required.";
  else if (!AMOUNT_PATTERN.test(rawAmount))
    errors.amount = "Amount must be a positive number with at most 2 decimal places.";
  else if (Number(rawAmount) <= 0) errors.amount = "Amount must be greater than zero.";

  if (!category) errors.category = "Category is required.";
  else if (TRANSACTION_TYPES.includes(type) && !isValidCategory(type, category))
    errors.category = `Choose one of: ${CATEGORIES[type].join(", ")}.`;

  if (!transactionDate) errors.transactionDate = "Date is required.";
  else if (!isValidDateString(transactionDate))
    errors.transactionDate = "Enter a valid date (YYYY-MM-DD).";

  if (description.length > 255)
    errors.description = "Description must be 255 characters or fewer.";

  fail(errors);
  return {
    type,
    amount: Number(rawAmount).toFixed(2),
    category,
    description: description || null,
    transactionDate,
  };
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest("Invalid id.");
  return id;
}

// Shared by the transaction list, dashboard and report endpoints.
export function parseDateRange(query = {}, { required = false } = {}) {
  const errors = {};
  const from = query.from || undefined;
  const to = query.to || undefined;

  if (required && !from) errors.from = "Start date is required.";
  if (required && !to) errors.to = "End date is required.";
  if (from && !isValidDateString(from)) errors.from = "Enter a valid start date (YYYY-MM-DD).";
  if (to && !isValidDateString(to)) errors.to = "Enter a valid end date (YYYY-MM-DD).";
  if (!errors.from && !errors.to && from && to && from > to)
    errors.to = "End date must be on or after the start date.";

  fail(errors);
  return { from, to };
}

// Columns a client may sort by. Column names cannot be sent as `?`
// parameters, so we map the client's choice onto a fixed whitelist instead of
// ever putting their text into the SQL.
export const SORT_COLUMNS = {
  date: "transaction_date",
  amount: "amount",
  category: "category",
  created: "created_at",
};

export function parseTransactionFilters(query = {}) {
  const errors = {};
  const { from, to } = parseDateRange(query);
  const filters = { from, to };

  if (query.type !== undefined && query.type !== "") {
    if (!TRANSACTION_TYPES.includes(query.type)) errors.type = "Type must be income or expense.";
    else filters.type = query.type;
  }

  if (query.category) filters.category = String(query.category).trim();

  for (const key of ["minAmount", "maxAmount"]) {
    if (query[key] !== undefined && query[key] !== "") {
      const n = Number(query[key]);
      if (!Number.isFinite(n) || n < 0) errors[key] = "Must be a non-negative number.";
      else filters[key] = n;
    }
  }
  if (
    filters.minAmount !== undefined &&
    filters.maxAmount !== undefined &&
    filters.minAmount > filters.maxAmount
  ) {
    errors.maxAmount = "Maximum must be greater than or equal to minimum.";
  }

  const search = asTrimmedString(query.search);
  if (search.length > 100) errors.search = "Search must be 100 characters or fewer.";
  else if (search) filters.search = search;

  const sort = query.sort || "date";
  if (!SORT_COLUMNS[sort]) errors.sort = `Sort must be one of: ${Object.keys(SORT_COLUMNS).join(", ")}.`;
  filters.sort = sort;

  const order = String(query.order || "desc").toLowerCase();
  if (order !== "asc" && order !== "desc") errors.order = "Order must be asc or desc.";
  filters.order = order;

  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) errors.page = "Page must be a positive whole number.";
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    errors.limit = "Limit must be between 1 and 100.";
  filters.page = page;
  filters.limit = limit;

  fail(errors);
  return filters;
}
