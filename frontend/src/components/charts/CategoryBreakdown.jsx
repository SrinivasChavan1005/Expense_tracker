// Category breakdown as labelled horizontal bars, largest first.
// Plain HTML bars (instead of a pie chart) keep long category names readable
// and make amounts easy to compare, on any screen width.
import { formatCurrency } from "../../utils/helper";
import { CHART_COLORS } from "./chartTheme";

export default function CategoryBreakdown({ categories, type = "expense", limit }) {
  const rows = limit ? categories.slice(0, limit) : categories;
  const max = Math.max(...rows.map((row) => row.total), 0);
  const color = type === "income" ? CHART_COLORS.income : CHART_COLORS.expense;

  return (
    <ul className="space-y-3.5">
      {rows.map((row) => (
        <li key={row.category}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-ink">{row.category}</span>
            <span className="tabular shrink-0 text-ink-2">
              {formatCurrency(row.total)} <span className="text-xs text-ink-3">· {row.percentage}%</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-navy-50" aria-hidden="true">
            <div
              className="h-full rounded-full"
              style={{ width: `${max > 0 ? Math.max((row.total / max) * 100, 2) : 0}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
