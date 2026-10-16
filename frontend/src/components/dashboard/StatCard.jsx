// One headline number (e.g. "Income this period").
import { formatCurrency } from "../../utils/helper";

const TONES = {
  income: { icon: "bg-income-soft text-income-text", value: "text-ink" },
  expense: { icon: "bg-expense-soft text-expense-text", value: "text-ink" },
  net: { icon: "bg-accent-50 text-accent-700", value: "text-ink" },
  neutral: { icon: "bg-navy-50 text-navy-700", value: "text-ink" },
};

export default function StatCard({ label, value, caption, icon: Icon, tone = "neutral", loading = false }) {
  const styles = TONES[tone];
  const negative = value < 0;
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-2">{label}</p>
        {Icon && (
          <span className={`flex size-8 items-center justify-center rounded-lg ${styles.icon}`}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-32 animate-pulse rounded bg-navy-50" aria-hidden="true" />
      ) : (
        <p className={`tabular mt-2 text-2xl font-semibold tracking-tight ${negative ? "text-expense-text" : styles.value}`}>
          {formatCurrency(value)}
        </p>
      )}
      {caption && <p className="mt-1 text-xs text-ink-3">{caption}</p>}
    </div>
  );
}
