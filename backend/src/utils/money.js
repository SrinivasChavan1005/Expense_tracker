// MySQL returns DECIMAL values as strings like "1250.50". We convert them to
// JavaScript numbers only at the edge, when building the JSON response.
// All adding and subtracting of money happens inside MySQL (exact DECIMAL
// arithmetic), so floating-point rounding errors never accumulate.
export function toMoney(value) {
  if (value === null || value === undefined) return 0;
  return Number(Number(value).toFixed(2));
}
