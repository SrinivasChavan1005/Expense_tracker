// Search, category, date and amount filters for the transaction list.
// On phones the extra filters fold away behind a "Filters" button.
import { useState } from "react";
import { LuSearch, LuSlidersHorizontal } from "react-icons/lu";
import { SelectField, TextField } from "../ui/FormField";
import Button from "../ui/Button";
import { CATEGORIES } from "../../utils/data";

export default function TransactionFilters({ type, filters, onChange, onReset }) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== "search" && value !== "").length;

  const handleChange = (event) => onChange({ ...filters, [event.target.name]: event.target.value });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
          <label htmlFor={`search-${type}`} className="sr-only">
            Search descriptions and categories
          </label>
          <input
            id={`search-${type}`}
            name="search"
            type="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search descriptions…"
            className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm placeholder:text-ink-3 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
          />
        </div>
        <Button
          variant="secondary"
          icon={LuSlidersHorizontal}
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={`filters-${type}`}
          className="md:hidden"
        >
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </div>

      <div
        id={`filters-${type}`}
        className={`${expanded ? "grid" : "hidden"} grid-cols-2 gap-3 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] md:items-end`}
      >
        <SelectField
          label="Category"
          name="category"
          value={filters.category}
          onChange={handleChange}
          options={CATEGORIES[type]}
          placeholder="All categories"
          className="col-span-2 md:col-span-1"
        />
        <TextField label="From" name="from" type="date" value={filters.from} onChange={handleChange} max={filters.to || undefined} />
        <TextField label="To" name="to" type="date" value={filters.to} onChange={handleChange} min={filters.from || undefined} />
        <TextField label="Min ₹" name="minAmount" inputMode="decimal" placeholder="0" value={filters.minAmount} onChange={handleChange} />
        <TextField label="Max ₹" name="maxAmount" inputMode="decimal" placeholder="Any" value={filters.maxAmount} onChange={handleChange} />
        <Button variant="ghost" onClick={onReset} className="col-span-2 md:col-span-1" disabled={activeCount === 0 && !filters.search}>
          Clear
        </Button>
      </div>
    </div>
  );
}
