// Dashboard and report endpoints. They only parse the query and call the
// shared functions in summary.service.js, which do the actual maths in SQL.
import { parseDateRange } from "../utils/validation.js";
import { badRequest } from "../utils/AppError.js";
import { currentMonthRange, lastNMonthsRange, monthsBetween, toDateString } from "../utils/dates.js";
import {
  getTotals,
  getMonthlyTotals,
  getCategoryBreakdown,
  getRecentTransactions,
} from "../services/summary.service.js";

const MAX_REPORT_MONTHS = 120;

// Fill in whichever end of the range the client left out.
function resolveRange(query, defaultRange) {
  const { from, to } = parseDateRange(query);
  const range = { from: from ?? defaultRange.from, to: to ?? defaultRange.to };
  if (range.from > range.to) {
    throw badRequest("Please correct the highlighted fields.", {
      to: "End date must be on or after the start date.",
    });
  }
  return range;
}

// GET /api/dashboard/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Defaults to the current calendar month.
export async function dashboardSummary(req, res) {
  const period = resolveRange(req.query, currentMonthRange());
  // The trend chart always shows the 6 months ending with the selected period.
  const trendRange = lastNMonthsRange(6, period.to.slice(0, 7));

  // These queries are independent, so run them in parallel.
  const [totals, allTime, expenseBreakdown, monthlyTrend, recentTransactions] = await Promise.all([
    getTotals(req.userId, period),
    getTotals(req.userId),
    getCategoryBreakdown(req.userId, { ...period, type: "expense" }),
    getMonthlyTotals(req.userId, trendRange),
    getRecentTransactions(req.userId, 5),
  ]);

  res.json({
    success: true,
    data: {
      period,
      totals, // income / expense / net for the selected period only
      allTime: { income: allTime.income, expense: allTime.expense, balance: allTime.net },
      expenseByCategory: expenseBreakdown.categories,
      monthlyTrend: { ...trendRange, months: monthlyTrend },
      recentTransactions, // latest 5 overall, regardless of period
    },
  });
}

function defaultReportRange() {
  const today = new Date();
  const monthKey = toDateString(today).slice(0, 7);
  return lastNMonthsRange(12, monthKey);
}

// GET /api/reports/monthly?from&to  (defaults to the last 12 months)
export async function monthlyReport(req, res) {
  const period = resolveRange(req.query, defaultReportRange());
  if (monthsBetween(period.from, period.to).length > MAX_REPORT_MONTHS) {
    throw badRequest("Please choose a range of 10 years or less.", {
      from: "Range is too long.",
    });
  }

  const [months, totals] = await Promise.all([
    getMonthlyTotals(req.userId, period),
    getTotals(req.userId, period),
  ]);
  res.json({ success: true, data: { period, months, totals } });
}

// GET /api/reports/categories?from&to&type=expense|income
export async function categoryReport(req, res) {
  const period = resolveRange(req.query, defaultReportRange());
  const type = req.query.type || "expense";
  if (type !== "income" && type !== "expense") {
    throw badRequest("Please correct the highlighted fields.", {
      type: "Type must be income or expense.",
    });
  }
  const breakdown = await getCategoryBreakdown(req.userId, { ...period, type });
  res.json({ success: true, data: { period, type, ...breakdown } });
}
