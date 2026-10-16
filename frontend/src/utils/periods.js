// Date-range presets for the dashboard and reports ("This month", etc.).
// Ranges are computed in the user's local time and sent as YYYY-MM-DD.
import { toDateInputValue } from "./helper";

const startOfMonth = (year, monthIndex) => new Date(year, monthIndex, 1);
const endOfMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0);

function range(start, end) {
  return { from: toDateInputValue(start), to: toDateInputValue(end) };
}

export const PERIOD_PRESETS = {
  thisMonth: {
    label: "This month",
    get: (now) => range(startOfMonth(now.getFullYear(), now.getMonth()), endOfMonth(now.getFullYear(), now.getMonth())),
  },
  lastMonth: {
    label: "Last month",
    get: (now) => range(startOfMonth(now.getFullYear(), now.getMonth() - 1), endOfMonth(now.getFullYear(), now.getMonth() - 1)),
  },
  last3Months: {
    label: "Last 3 months",
    get: (now) => range(startOfMonth(now.getFullYear(), now.getMonth() - 2), endOfMonth(now.getFullYear(), now.getMonth())),
  },
  last6Months: {
    label: "Last 6 months",
    get: (now) => range(startOfMonth(now.getFullYear(), now.getMonth() - 5), endOfMonth(now.getFullYear(), now.getMonth())),
  },
  last12Months: {
    label: "Last 12 months",
    get: (now) => range(startOfMonth(now.getFullYear(), now.getMonth() - 11), endOfMonth(now.getFullYear(), now.getMonth())),
  },
  thisYear: {
    label: "This year",
    get: (now) => range(new Date(now.getFullYear(), 0, 1), new Date(now.getFullYear(), 11, 31)),
  },
  lastYear: {
    label: "Last year",
    get: (now) => range(new Date(now.getFullYear() - 1, 0, 1), new Date(now.getFullYear() - 1, 11, 31)),
  },
};

export function periodFromPreset(key, now = new Date()) {
  return { preset: key, ...PERIOD_PRESETS[key].get(now) };
}
