// Static app data: categories and navigation.
import { LuLayoutDashboard, LuArrowDownLeft, LuArrowUpRight, LuChartColumn } from "react-icons/lu";

// Must match backend/src/utils/categories.js (the server re-validates).
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

export const TYPE_LABELS = {
  income: { singular: "Income", plural: "Income", noun: "income" },
  expense: { singular: "Expense", plural: "Expenses", noun: "expense" },
};

// Starting values for the transaction list filters.
export const EMPTY_FILTERS = {
  search: "",
  category: "",
  from: "",
  to: "",
  minAmount: "",
  maxAmount: "",
};

export const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LuLayoutDashboard },
  { label: "Income", path: "/income", icon: LuArrowDownLeft },
  { label: "Expenses", path: "/expense", icon: LuArrowUpRight },
  { label: "Reports", path: "/reports", icon: LuChartColumn },
];
