// Grouped bar chart: income vs expenses for each month.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK, CHART_COLORS } from "./chartTheme";
import { formatCompactCurrency, formatCurrency, formatMonth } from "../../utils/helper";

function MonthlyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-ink">{formatMonth(label)}</p>
      <dl className="tabular space-y-1">
        <div className="flex items-center justify-between gap-6">
          <dt className="flex items-center gap-1.5 text-ink-2">
            <span className="size-2.5 rounded-sm" style={{ background: CHART_COLORS.income }} /> Income
          </dt>
          <dd className="font-medium text-ink">{formatCurrency(row.income)}</dd>
        </div>
        <div className="flex items-center justify-between gap-6">
          <dt className="flex items-center gap-1.5 text-ink-2">
            <span className="size-2.5 rounded-sm" style={{ background: CHART_COLORS.expense }} /> Expenses
          </dt>
          <dd className="font-medium text-ink">{formatCurrency(row.expense)}</dd>
        </div>
        <div className="flex items-center justify-between gap-6 border-t border-line pt-1">
          <dt className="text-ink-2">Net</dt>
          <dd className={`font-semibold ${row.net < 0 ? "text-expense-text" : "text-ink"}`}>{formatCurrency(row.net)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-ink-2" aria-hidden="true">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm" style={{ background: CHART_COLORS.income }} /> Income
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm" style={{ background: CHART_COLORS.expense }} /> Expenses
      </span>
    </div>
  );
}

export default function MonthlyChart({ months, height = 280 }) {
  const many = months.length > 8;
  const summary = months
    .map((m) => `${formatMonth(m.month)}: income ${formatCurrency(m.income)}, expenses ${formatCurrency(m.expense)}`)
    .join("; ");

  return (
    <div role="img" aria-label={`Monthly income and expenses. ${summary}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={months} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barGap={2} barCategoryGap={many ? "18%" : "28%"}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="month"
            tickFormatter={(key) => formatMonth(key, { short: true })}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            interval={many ? "preserveStartEnd" : 0}
          />
          <YAxis
            tickFormatter={formatCompactCurrency}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip content={<MonthlyTooltip />} cursor={{ fill: CHART_COLORS.cursor }} />
          <Bar dataKey="income" name="Income" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={24} />
          <Bar dataKey="expense" name="Expenses" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
