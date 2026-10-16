import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Button from "../ui/Button";

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (total === 0) return null;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line pt-4">
      <p className="text-xs text-ink-3">
        Showing <span className="tabular font-medium text-ink-2">{first}–{last}</span> of{" "}
        <span className="tabular font-medium text-ink-2">{total}</span>
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" icon={LuChevronLeft} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
          <LuChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
