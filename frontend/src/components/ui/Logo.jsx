export default function Logo({ inverted = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={inverted ? "#ffffff" : "#10213f"} />
        <rect x="8" y="17" width="4" height="7" rx="1.5" fill="#0d9488" />
        <rect x="14" y="12" width="4" height="12" rx="1.5" fill={inverted ? "#10213f" : "#ffffff"} />
        <rect x="20" y="8" width="4" height="16" rx="1.5" fill="#0d9488" />
      </svg>
      <span className={`text-[15px] font-semibold tracking-tight ${inverted ? "text-white" : "text-ink"}`}>
        Expense Tracker
      </span>
    </span>
  );
}
