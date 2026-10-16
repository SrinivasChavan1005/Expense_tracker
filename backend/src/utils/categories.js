// The single source of truth for which categories are valid per type.
// The frontend keeps a matching list in frontend/src/utils/data.js for its
// dropdowns, but the server always re-checks, because clients can be bypassed.
export const TRANSACTION_TYPES = ["income", "expense"];

export const CATEGORIES = {
  income: ["Salary", "Freelance", "Business", "Investments", "Gifts", "Other income"],
  expense: [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Rent",
    "Education",
    "Healthcare",
    "Entertainment",
    "Other expense",
  ],
};

export function isValidCategory(type, category) {
  return Boolean(CATEGORIES[type]?.includes(category));
}
