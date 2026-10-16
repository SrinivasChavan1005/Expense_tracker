// Period picker: a preset dropdown plus "Custom range" with two date inputs.
// Custom dates only apply once both are valid, so half-entered ranges never
// reach the API.
import { useState } from "react";
import { PERIOD_PRESETS, periodFromPreset } from "../../utils/periods";

export default function PeriodFilter({ presets, value, onChange, idPrefix = "period" }) {
  const [draft, setDraft] = useState({ from: value.from, to: value.to });
  const [error, setError] = useState("");

  const handlePresetChange = (event) => {
    const key = event.target.value;
    setError("");
    if (key === "custom") {
      setDraft({ from: value.from, to: value.to });
      onChange({ ...value, preset: "custom" });
    } else {
      onChange(periodFromPreset(key));
    }
  };

  const handleDateChange = (event) => {
    const next = { ...draft, [event.target.name]: event.target.value };
    setDraft(next);
    if (!next.from || !next.to) return setError("Choose both dates.");
    if (next.from > next.to) return setError("End date must be after the start date.");
    setError("");
    onChange({ preset: "custom", ...next });
  };

  const inputClass =
    "h-9 rounded-lg border border-line bg-white px-2.5 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20";

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${idPrefix}-preset`} className="text-sm text-ink-2">
          Period
        </label>
        <select id={`${idPrefix}-preset`} value={value.preset} onChange={handlePresetChange} className={inputClass}>
          {presets.map((key) => (
            <option key={key} value={key}>
              {PERIOD_PRESETS[key].label}
            </option>
          ))}
          <option value="custom">Custom range</option>
        </select>
        {value.preset === "custom" && (
          <>
            <label className="sr-only" htmlFor={`${idPrefix}-from`}>Start date</label>
            <input id={`${idPrefix}-from`} type="date" name="from" value={draft.from} onChange={handleDateChange} className={inputClass} aria-invalid={Boolean(error) || undefined} />
            <span className="text-sm text-ink-3" aria-hidden="true">to</span>
            <label className="sr-only" htmlFor={`${idPrefix}-to`}>End date</label>
            <input id={`${idPrefix}-to`} type="date" name="to" value={draft.to} onChange={handleDateChange} className={inputClass} aria-invalid={Boolean(error) || undefined} />
          </>
        )}
      </div>
      {error && <p className="text-xs text-expense-text" role="alert">{error}</p>}
    </div>
  );
}
