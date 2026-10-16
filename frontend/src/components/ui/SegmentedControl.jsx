// A small two-or-three option toggle (e.g. Expenses / Income).
export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-line bg-navy-50 p-0.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              selected ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
