import { useState } from "react";
import toast from "react-hot-toast";
import { LuDownload } from "react-icons/lu";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SegmentedControl from "../../components/ui/SegmentedControl";
import { ErrorState, EmptyState } from "../../components/ui/States";
import { LoadingBlock } from "../../components/ui/Spinner";
import StatCard from "../../components/dashboard/StatCard";
import PeriodFilter from "../../components/dashboard/PeriodFilter";
import MonthlyChart, { ChartLegend } from "../../components/charts/MonthlyChart";
import CategoryBreakdown from "../../components/charts/CategoryBreakdown";
import { useApiData } from "../../hooks/useApiData";
import { downloadTransactionsCsv, getCategoryReport, getMonthlyReport } from "../../api/transactionsApi";
import { formatCurrency, formatMonth, getErrorMessage } from "../../utils/helper";
import { periodFromPreset } from "../../utils/periods";

const REPORT_PRESETS = ["last6Months", "last12Months", "thisYear", "lastYear", "thisMonth"];

function MonthlyTable({ months, totals }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <caption className="sr-only">Monthly income, expenses and net</caption>
        <thead className="border-b border-line text-xs text-ink-3">
          <tr>
            <th scope="col" className="py-2.5 pr-4 text-left font-medium">Month</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Income</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Expenses</th>
            <th scope="col" className="py-2.5 pl-4 text-right font-medium">Net</th>
          </tr>
        </thead>
        <tbody className="tabular divide-y divide-line">
          {months.map((m) => (
            <tr key={m.month}>
              <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">{formatMonth(m.month)}</th>
              <td className="px-4 py-2.5 text-right text-ink-2">{formatCurrency(m.income)}</td>
              <td className="px-4 py-2.5 text-right text-ink-2">{formatCurrency(m.expense)}</td>
              <td className={`py-2.5 pl-4 text-right font-medium ${m.net < 0 ? "text-expense-text" : "text-ink"}`}>{formatCurrency(m.net)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="tabular border-t-2 border-line">
          <tr>
            <th scope="row" className="py-2.5 pr-4 text-left font-semibold text-ink">Total</th>
            <td className="px-4 py-2.5 text-right font-semibold text-income-text">{formatCurrency(totals.income)}</td>
            <td className="px-4 py-2.5 text-right font-semibold text-expense-text">{formatCurrency(totals.expense)}</td>
            <td className={`py-2.5 pl-4 text-right font-semibold ${totals.net < 0 ? "text-expense-text" : "text-ink"}`}>{formatCurrency(totals.net)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

const Reports = () => {
  const [period, setPeriod] = useState(() => periodFromPreset("last6Months"));
  const [categoryType, setCategoryType] = useState("expense");
  const [monthlyView, setMonthlyView] = useState("chart");
  const [exporting, setExporting] = useState(false);
  const range = { from: period.from, to: period.to };

  const monthly = useApiData((signal) => getMonthlyReport(range, { signal }), [period.from, period.to]);
  const categories = useApiData(
    (signal) => getCategoryReport({ ...range, type: categoryType }, { signal }),
    [period.from, period.to, categoryType]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadTransactionsCsv(range);
      toast.success("CSV downloaded.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't export the CSV."));
    } finally {
      setExporting(false);
    }
  };

  const totals = monthly.data?.totals;

  return (
    <>
      <PageHeader
        title="Reports"
        description="Monthly trends and category breakdowns for any date range."
        actions={
          <div className="flex flex-wrap items-start gap-2">
            <PeriodFilter presets={REPORT_PRESETS} value={period} onChange={setPeriod} idPrefix="reports" />
            <Button variant="secondary" icon={LuDownload} onClick={handleExport} loading={exporting} disabled={!totals?.count}>
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total income" value={totals?.income} tone="income" loading={!monthly.data} caption="Selected period" />
          <StatCard label="Total expenses" value={totals?.expense} tone="expense" loading={!monthly.data} caption="Selected period" />
          <StatCard label="Net" value={totals?.net} tone="net" loading={!monthly.data} caption="Income minus expenses" />
          <div className="rounded-xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
            <p className="text-sm font-medium text-ink-2">Transactions</p>
            <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-ink">{totals ? totals.count : "–"}</p>
            <p className="mt-1 text-xs text-ink-3">Recorded in this period</p>
          </div>
        </div>

        <Card
          title="Monthly income and expenses"
          subtitle="Months with no transactions are shown as zero"
          action={
            <div className="flex items-center gap-4">
              {monthlyView === "chart" && <span className="hidden sm:block"><ChartLegend /></span>}
              <SegmentedControl
                label="Monthly view"
                value={monthlyView}
                onChange={setMonthlyView}
                options={[
                  { value: "chart", label: "Chart" },
                  { value: "table", label: "Table" },
                ]}
              />
            </div>
          }
        >
          {monthly.status === "error" ? (
            <ErrorState message={monthly.error} onRetry={monthly.reload} />
          ) : !monthly.data ? (
            <LoadingBlock />
          ) : monthly.data.totals.count === 0 ? (
            <EmptyState title="No transactions in this period" message="Choose a different period to see your report." />
          ) : monthlyView === "chart" ? (
            <MonthlyChart months={monthly.data.months} height={320} />
          ) : (
            <MonthlyTable months={monthly.data.months} totals={monthly.data.totals} />
          )}
        </Card>

        <Card
          title="Category breakdown"
          subtitle={categories.data ? `Total ${formatCurrency(categories.data.total)}` : " "}
          action={
            <SegmentedControl
              label="Category type"
              value={categoryType}
              onChange={setCategoryType}
              options={[
                { value: "expense", label: "Expenses" },
                { value: "income", label: "Income" },
              ]}
            />
          }
        >
          {categories.status === "error" ? (
            <ErrorState message={categories.error} onRetry={categories.reload} />
          ) : !categories.data ? (
            <LoadingBlock />
          ) : categories.data.categories.length === 0 ? (
            <EmptyState title={`No ${categoryType === "income" ? "income" : "expenses"} in this period`} />
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="min-w-0">
                <CategoryBreakdown categories={categories.data.categories} type={categoryType} />
              </div>
              <div className="min-w-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Totals by category</caption>
                  <thead className="border-b border-line text-xs text-ink-3">
                    <tr>
                      <th scope="col" className="py-2.5 pr-4 text-left font-medium">Category</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Entries</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Share</th>
                      <th scope="col" className="py-2.5 pl-4 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="tabular divide-y divide-line">
                    {categories.data.categories.map((row) => (
                      <tr key={row.category}>
                        <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">{row.category}</th>
                        <td className="px-4 py-2.5 text-right text-ink-2">{row.count}</td>
                        <td className="px-4 py-2.5 text-right text-ink-2">{row.percentage}%</td>
                        <td className="py-2.5 pl-4 text-right font-medium text-ink">{formatCurrency(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default Reports;
