// Shows transactions as a sortable table on wider screens and as a stacked
// list on phones, so nothing needs horizontal scrolling.
import { LuArrowDown, LuArrowUp, LuArrowUpDown, LuPencil, LuTrash2 } from "react-icons/lu";
import { formatDate, formatSignedAmount } from "../../utils/helper";

const SORTABLE = [
  { key: "date", label: "Date" },
  { key: "category", label: "Category" },
];

function SortHeader({ column, label, sort, onSort, align = "left" }) {
  const active = sort.sort === column;
  const Icon = !active ? LuArrowUpDown : sort.order === "asc" ? LuArrowUp : LuArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.order === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 rounded hover:text-ink ${active ? "text-ink" : ""}`}
      >
        {label}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    </th>
  );
}

function RowActions({ transaction, onEdit, onDelete }) {
  const name = `${transaction.category} on ${formatDate(transaction.transactionDate)}`;
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(transaction)}
        className="rounded-lg p-2 text-ink-3 hover:bg-navy-50 hover:text-ink"
        aria-label={`Edit ${name}`}
      >
        <LuPencil className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(transaction)}
        className="rounded-lg p-2 text-ink-3 hover:bg-expense-soft hover:text-expense-text"
        aria-label={`Delete ${name}`}
      >
        <LuTrash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function AmountText({ amount, type, className = "" }) {
  return (
    <span className={`tabular font-semibold ${type === "income" ? "text-income-text" : "text-expense-text"} ${className}`}>
      {formatSignedAmount(amount, type)}
    </span>
  );
}

export default function TransactionTable({ transactions, sort, onSort, onEdit, onDelete, caption }) {
  return (
    <>
      {/* Tablet and desktop */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line text-xs text-ink-3">
            <tr>
              {SORTABLE.map(({ key, label }) => (
                <SortHeader key={key} column={key} label={label} sort={sort} onSort={onSort} />
              ))}
              <th scope="col" className="px-4 py-3 text-left font-medium">Description</th>
              <SortHeader column="amount" label="Amount" sort={sort} onSort={onSort} align="right" />
              <th scope="col" className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-navy-50/50">
                <td className="whitespace-nowrap px-4 py-3 text-ink-2">{formatDate(t.transactionDate)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-800">{t.category}</span>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-ink-2" title={t.description ?? ""}>
                  {t.description || <span className="text-ink-3">—</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <AmountText amount={t.amount} type={t.type} />
                </td>
                <td className="px-2 py-1.5">
                  <RowActions transaction={t} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones */}
      <ul className="divide-y divide-line md:hidden" aria-label={caption}>
        {transactions.map((t) => (
          <li key={t.id} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-medium text-ink">{t.category}</p>
                <AmountText amount={t.amount} type={t.type} className="text-sm" />
              </div>
              <p className="mt-0.5 truncate text-xs text-ink-3">
                {formatDate(t.transactionDate)}
                {t.description ? ` · ${t.description}` : ""}
              </p>
            </div>
            <RowActions transaction={t} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </>
  );
}
