// Every backend endpoint the frontend uses, in one place.
// Paths are relative to the API base URL configured in api/client.js.
export const API_PATHS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  TRANSACTIONS: {
    LIST: "/transactions",
    CREATE: "/transactions",
    EXPORT: "/transactions/export",
    BY_ID: (id) => `/transactions/${id}`,
  },
  DASHBOARD: {
    SUMMARY: "/dashboard/summary",
  },
  REPORTS: {
    MONTHLY: "/reports/monthly",
    CATEGORIES: "/reports/categories",
  },
};
