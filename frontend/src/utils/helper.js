// Formatting and small utility functions shared across the UI.

export const CURRENCY = "INR";
export const LOCALE = "en-IN";

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});


// 125000.5 -> "₹1,25,000.50"
export const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

// Short labels for chart axes, using Indian units:
// 950 -> "₹950", 80000 -> "₹80K", 125000 -> "₹1.3L", 25000000 -> "₹2.5Cr"
export function formatCompactCurrency(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const trim = (x) => String(Number(x.toFixed(1)));
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7)}Cr`;
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5)}L`;
  if (abs >= 1e3) return `${sign}₹${trim(abs / 1e3)}K`;
  return `${sign}₹${trim(abs)}`;
}

// Signed amount for a transaction row: "+₹500.00" / "−₹500.00"
export const formatSignedAmount = (amount, type) =>
  `${type === "income" ? "+" : "−"}${formatCurrency(amount)}`;

const pad = (n) => String(n).padStart(2, "0");

// Date -> "YYYY-MM-DD" in the user's local time zone (not UTC).
export const toDateInputValue = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// "2026-03-15" -> "15 Mar 2026". Parsed as a local date to avoid UTC shifts.
export function formatDate(dateString, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!dateString) return "";
  const [y, m, d] = dateString.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE, options);
}

// "2026-03" -> "Mar 2026" (or "Mar" with { short: true })
export function formatMonth(monthKey, { short = false } = {}) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(LOCALE, short ? { month: "short" } : { month: "short", year: "numeric" });
}

export function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Pull a human-readable message out of an Axios error.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error?.response?.data?.error?.message) return error.response.data.error.message;
  if (error?.code === "ERR_NETWORK" || error?.response?.status === 502 || error?.response?.status === 504) {
    return "Can't reach the server. Make sure the backend is running.";
  }
  return fallback;
}

// Field-level validation errors returned by the API ({ email: "..." }).
export const getFieldErrors = (error) => error?.response?.data?.error?.details ?? {};

export const isAbortError = (error) => error?.name === "CanceledError" || error?.code === "ERR_CANCELED";
