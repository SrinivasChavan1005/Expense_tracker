// Builds CSV text safely.
// 1. Every cell is quoted and inner quotes are doubled, so commas and line
//    breaks in descriptions don't break the columns.
// 2. "CSV injection": spreadsheet apps execute cells starting with = + - @ as
//    formulas. A description like "=HYPERLINK(...)" could run when the file is
//    opened, so such text cells get a leading apostrophe to be treated as text.
const FORMULA_START = /^[=+\-@\t\r]/;

function escapeCell(value) {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}
