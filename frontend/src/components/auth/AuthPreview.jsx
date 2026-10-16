// Decorative preview for the login/sign-up screens, built from real UI styles
// instead of an image. The numbers are clearly labelled as sample data.
const SAMPLE_BARS = [
  { month: "May", income: 70, expense: 44 },
  { month: "Jun", income: 78, expense: 52 },
  { month: "Jul", income: 74, expense: 61 },
  { month: "Aug", income: 82, expense: 47 },
  { month: "Sep", income: 76, expense: 55 },
  { month: "Oct", income: 88, expense: 50 },
];

export default function AuthPreview() {
  return (
    <div aria-hidden="true" className="w-full max-w-sm select-none">
      <div className="rounded-2xl bg-white p-5 shadow-2xl shadow-navy-950/30">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-ink-3">This month</p>
          <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-ink-3">
            Sample data
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] text-ink-3">Income</p>
            <p className="tabular text-sm font-semibold text-income-text">₹82,400</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-3">Expenses</p>
            <p className="tabular text-sm font-semibold text-expense-text">₹49,150</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-3">Net</p>
            <p className="tabular text-sm font-semibold text-ink">₹33,250</p>
          </div>
        </div>
        <div className="mt-5 flex h-28 items-end justify-between gap-2 border-b border-line">
          {SAMPLE_BARS.map((bar) => (
            <div key={bar.month} className="flex h-full flex-1 items-end justify-center gap-0.5">
              <span className="w-2.5 rounded-t-[3px] bg-income" style={{ height: `${bar.income}%` }} />
              <span className="w-2.5 rounded-t-[3px] bg-expense" style={{ height: `${bar.expense}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between gap-2">
          {SAMPLE_BARS.map((bar) => (
            <span key={bar.month} className="flex-1 text-center text-[10px] text-ink-3">
              {bar.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
