// Small date helpers that work on "YYYY-MM-DD" / "YYYY-MM" strings, which is
// how dates travel between MySQL, the API and the frontend. Using strings
// avoids time-zone surprises from JavaScript Date objects.

const pad = (n) => String(n).padStart(2, "0");

export function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function lastDayOfMonth(year, month1to12) {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

export function monthRange(year, month1to12) {
  return {
    from: `${year}-${pad(month1to12)}-01`,
    to: `${year}-${pad(month1to12)}-${pad(lastDayOfMonth(year, month1to12))}`,
  };
}

// The calendar month containing `today` (server local time).
export function currentMonthRange(today = new Date()) {
  return monthRange(today.getFullYear(), today.getMonth() + 1);
}

// Shift a "YYYY-MM" key by n months (n may be negative).
export function addMonths(monthKey, n) {
  const [year, month] = monthKey.split("-").map(Number);
  const index = year * 12 + (month - 1) + n;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

// Every "YYYY-MM" from the month of `from` to the month of `to`, inclusive.
export function monthsBetween(from, to) {
  const months = [];
  let key = from.slice(0, 7);
  const last = to.slice(0, 7);
  while (key <= last) {
    months.push(key);
    key = addMonths(key, 1);
  }
  return months;
}

export function lastNMonthsRange(n, endMonthKey) {
  const startKey = addMonths(endMonthKey, -(n - 1));
  const [endYear, endMonth] = endMonthKey.split("-").map(Number);
  return {
    from: `${startKey}-01`,
    to: monthRange(endYear, endMonth).to,
  };
}
