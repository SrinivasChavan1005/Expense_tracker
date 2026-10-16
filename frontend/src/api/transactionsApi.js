// Transaction, dashboard and report API calls.
import api from "./client";
import { API_PATHS } from "../utils/apiPaths";

// Drop empty filter values so the URL stays clean (?type=expense, not &search=).
const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null)
  );

export async function getTransactions(params, { signal } = {}) {
  const { data } = await api.get(API_PATHS.TRANSACTIONS.LIST, { params: cleanParams(params), signal });
  return { items: data.data, ...data.meta };
}

export async function createTransaction(payload) {
  const { data } = await api.post(API_PATHS.TRANSACTIONS.CREATE, payload);
  return data.data;
}

export async function updateTransaction(id, payload) {
  const { data } = await api.put(API_PATHS.TRANSACTIONS.BY_ID(id), payload);
  return data.data;
}

export async function deleteTransaction(id) {
  await api.delete(API_PATHS.TRANSACTIONS.BY_ID(id));
}

// Downloads a CSV and saves it through a temporary link.
export async function downloadTransactionsCsv(params) {
  const response = await api.get(API_PATHS.TRANSACTIONS.EXPORT, {
    params: cleanParams(params),
    responseType: "blob",
  });
  const match = /filename="([^"]+)"/.exec(response.headers["content-disposition"] ?? "");
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = match?.[1] ?? "transactions.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function getDashboardSummary(params, { signal } = {}) {
  const { data } = await api.get(API_PATHS.DASHBOARD.SUMMARY, { params: cleanParams(params), signal });
  return data.data;
}

export async function getMonthlyReport(params, { signal } = {}) {
  const { data } = await api.get(API_PATHS.REPORTS.MONTHLY, { params: cleanParams(params), signal });
  return data.data;
}

export async function getCategoryReport(params, { signal } = {}) {
  const { data } = await api.get(API_PATHS.REPORTS.CATEGORIES, { params: cleanParams(params), signal });
  return data.data;
}
