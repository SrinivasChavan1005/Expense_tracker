// The complete Income / Expenses screen: filters, totals, list, add/edit
// modal and delete confirmation. Income.jsx and Expense.jsx both render this
// with a different `type`, so the two pages can't drift apart.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { LuDownload, LuPlus } from "react-icons/lu";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import { LoadingBlock } from "../ui/Spinner";
import { EmptyState, ErrorState } from "../ui/States";
import TransactionFilters from "./TransactionFilters";
import TransactionTable from "./TransactionTable";
import TransactionForm from "./TransactionForm";
import Pagination from "./Pagination";
import { useApiData } from "../../hooks/useApiData";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  createTransaction,
  deleteTransaction,
  downloadTransactionsCsv,
  getTransactions,
  updateTransaction,
} from "../../api/transactionsApi";
import { EMPTY_FILTERS, TYPE_LABELS } from "../../utils/data";
import { formatCurrency, formatDate, getErrorMessage } from "../../utils/helper";

const PAGE_SIZE = 10;
const NUMBER = /^\d+(\.\d+)?$/;

const MOBILE_SORTS = [
  { value: "date:desc", label: "Newest first" },
  { value: "date:asc", label: "Oldest first" },
  { value: "amount:desc", label: "Highest amount" },
  { value: "amount:asc", label: "Lowest amount" },
];

export default function TransactionsView({ type }) {
  const labels = TYPE_LABELS[type];
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState({ sort: "date", order: "desc" });
  const [page, setPage] = useState(1);

  // Modal state: what's being added/edited/deleted right now.
  // Dashboard shortcuts link to /income?new=1 to open the add form directly.
  const [formState, setFormState] = useState(() => (searchParams.get("new") === "1" ? {} : null)); // null | { transaction?: {...} }
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Remove ?new=1 from the address bar once it has been used.
  useEffect(() => {
    if (searchParams.has("new")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const debouncedSearch = useDebouncedValue(filters.search);

  // The exact query sent to the API. Half-typed amounts are skipped rather
  // than sent, so typing "1." doesn't trigger an error.
  const query = useMemo(
    () => ({
      type,
      search: debouncedSearch.trim(),
      category: filters.category,
      from: filters.from,
      to: filters.to && (!filters.from || filters.to >= filters.from) ? filters.to : "",
      minAmount: NUMBER.test(filters.minAmount) ? filters.minAmount : "",
      maxAmount: NUMBER.test(filters.maxAmount) ? filters.maxAmount : "",
      sort: sort.sort,
      order: sort.order,
      page,
      limit: PAGE_SIZE,
    }),
    [type, debouncedSearch, filters, sort, page]
  );

  const { data, status, error, reload, isLoading } = useApiData(
    (signal) => getTransactions(query, { signal }),
    [JSON.stringify(query)]
  );

  const hasFilters = Object.values(filters).some((value) => value !== "");

  const changeFilters = (next) => {
    setFilters(next);
    setPage(1); // new filters -> back to the first page
  };

  const handleSort = (column) => {
    setSort((current) => ({
      sort: column,
      order: current.sort === column && current.order === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  };

  const handleSave = async (payload) => {
    const editing = formState?.transaction;
    if (editing) {
      await updateTransaction(editing.id, payload);
      toast.success(`${labels.singular} updated.`);
    } else {
      await createTransaction(payload);
      toast.success(`${labels.singular} added.`);
    }
    setFormState(null);
    reload(); // fetch fresh data from the database
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTransaction(toDelete.id);
      toast.success(`${labels.singular} deleted.`);
      setToDelete(null);
      // If we just deleted the last row on this page, step back a page.
      if (data?.items.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      toast.error(getErrorMessage(err, `Couldn't delete this ${labels.noun}.`));
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { page: _page, limit: _limit, ...exportQuery } = query;
      await downloadTransactionsCsv(exportQuery);
      toast.success("CSV downloaded.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't export the CSV."));
    } finally {
      setExporting(false);
    }
  };

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const firstLoad = isLoading && !data;

  return (
    <>
      <PageHeader
        title={labels.plural}
        description={`Add, edit and review your ${labels.noun} transactions.`}
        actions={
          <>
            <Button variant="secondary" icon={LuDownload} onClick={handleExport} loading={exporting} disabled={!pagination?.total}>
              Export CSV
            </Button>
            <Button icon={LuPlus} onClick={() => setFormState({})}>
              Add {labels.noun}
            </Button>
          </>
        }
      />

      <Card bodyClassName="space-y-4">
        <TransactionFilters
          type={type}
          filters={filters}
          onChange={changeFilters}
          onReset={() => changeFilters(EMPTY_FILTERS)}
        />

        {pagination && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-navy-50 px-4 py-3">
            <p className="text-sm text-ink-2">
              {hasFilters ? "Matching" : "All"} {labels.plural.toLowerCase()}:{" "}
              <span className={`tabular font-semibold ${type === "income" ? "text-income-text" : "text-expense-text"}`}>
                {formatCurrency(data.totalAmount)}
              </span>{" "}
              <span className="text-ink-3">
                ({pagination.total} {pagination.total === 1 ? "transaction" : "transactions"})
              </span>
            </p>
            <label className="flex items-center gap-2 text-xs text-ink-2 md:hidden">
              Sort
              <select
                value={`${sort.sort}:${sort.order}`}
                onChange={(event) => {
                  const [column, order] = event.target.value.split(":");
                  setSort({ sort: column, order });
                  setPage(1);
                }}
                className="h-8 rounded-md border border-line bg-white px-2 text-xs"
              >
                {MOBILE_SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div aria-live="polite" aria-busy={isLoading} className={`relative ${isLoading && data ? "opacity-60 transition-opacity" : ""}`}>
          {firstLoad ? (
            <LoadingBlock label={`Loading ${labels.noun}…`} />
          ) : status === "error" ? (
            <ErrorState message={error} onRetry={reload} />
          ) : items.length === 0 ? (
            hasFilters ? (
              <EmptyState
                title="No matching transactions"
                message="Try a different search, or clear the filters."
                action={<Button variant="secondary" size="sm" onClick={() => changeFilters(EMPTY_FILTERS)}>Clear filters</Button>}
              />
            ) : (
              <EmptyState
                title={`No ${labels.noun} recorded yet`}
                message={`Add your first ${labels.noun} to start tracking.`}
                action={<Button size="sm" icon={LuPlus} onClick={() => setFormState({})}>Add {labels.noun}</Button>}
              />
            )
          ) : (
            <TransactionTable
              transactions={items}
              sort={sort}
              onSort={handleSort}
              onEdit={(transaction) => setFormState({ transaction })}
              onDelete={setToDelete}
              caption={`${labels.plural} transactions`}
            />
          )}
        </div>

        {pagination && items.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        )}
      </Card>

      <Modal
        open={Boolean(formState)}
        onClose={() => setFormState(null)}
        title={formState?.transaction ? `Edit ${labels.noun}` : `Add ${labels.noun}`}
      >
        {formState && (
          <TransactionForm
            key={formState.transaction?.id ?? "new"}
            type={type}
            transaction={formState.transaction}
            onSubmit={handleSave}
            onCancel={() => setFormState(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete this ${labels.noun}?`}
        message={
          toDelete
            ? `${toDelete.category} · ${formatCurrency(toDelete.amount)} on ${formatDate(toDelete.transactionDate)}. This can't be undone.`
            : ""
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
