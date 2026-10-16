import { useState } from "react";
import { Link } from "react-router-dom";
import { LuArrowDownLeft, LuArrowUpRight, LuChartColumn, LuPlus, LuScale, LuWallet } from "react-icons/lu";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import { ErrorState, EmptyState } from "../../components/ui/States";
import { LoadingBlock } from "../../components/ui/Spinner";
import StatCard from "../../components/dashboard/StatCard";
import PeriodFilter from "../../components/dashboard/PeriodFilter";
import MonthlyChart, { ChartLegend } from "../../components/charts/MonthlyChart";
import CategoryBreakdown from "../../components/charts/CategoryBreakdown";
import { AmountText } from "../../components/transactions/TransactionTable";
import { useApiData } from "../../hooks/useApiData";
import { useAuth } from "../../hooks/useAuth";
import { getDashboardSummary } from "../../api/transactionsApi";
import { formatDate, formatMonth } from "../../utils/helper";
import { PERIOD_PRESETS, periodFromPreset } from "../../utils/periods";

const DASHBOARD_PRESETS = ["thisMonth", "lastMonth", "last3Months", "thisYear"];

function periodLabel(period) {
  if (period.preset !== "custom") return PERIOD_PRESETS[period.preset].label.toLowerCase();
  return `${formatDate(period.from)} – ${formatDate(period.to)}`;
}

const Home = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState(() => periodFromPreset("thisMonth"));

  // Every number on this page comes from one API call; the backend does the
  // maths in SQL, so the dashboard always matches the database.
  const { data, status, error, reload, isLoading } = useApiData(
    (signal) => getDashboardSummary({ from: period.from, to: period.to }, { signal }),
    [period.from, period.to]
  );

  const label = periodLabel(period);
  const totals = data?.totals;
  const hasAnyData = (data?.recentTransactions?.length ?? 0) > 0;

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Here's how your money is moving."
        actions={<PeriodFilter presets={DASHBOARD_PRESETS} value={period} onChange={setPeriod} idPrefix="dashboard" />}
      />

      {status === "error" && !data ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : (
        <div className={`space-y-6 ${isLoading && data ? "opacity-60 transition-opacity" : ""}`} aria-busy={isLoading}>
          {/* Period totals + all-time balance, clearly labelled */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Income" caption={`Total for ${label}`} value={totals?.income} tone="income" icon={LuArrowDownLeft} loading={!data} />
            <StatCard label="Expenses" caption={`Total for ${label}`} value={totals?.expense} tone="expense" icon={LuArrowUpRight} loading={!data} />
            <StatCard label="Net balance" caption={`Income minus expenses, ${label}`} value={totals?.net} tone="net" icon={LuScale} loading={!data} />
            <StatCard label="All-time balance" caption="All income minus all expenses, ever" value={data?.allTime.balance} tone="neutral" icon={LuWallet} loading={!data} />
          </div>

          {data && !hasAnyData ? (
            <Card>
              <EmptyState
                title="Welcome! Let's add your first transaction"
                message="Once you record income and expenses, your trends and category breakdown appear here."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link to="/income?new=1" className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy-900 px-4 text-sm font-medium text-white hover:bg-navy-800">
                      <LuPlus className="size-4" aria-hidden="true" /> Add income
                    </Link>
                    <Link to="/expense?new=1" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-navy-50">
                      <LuPlus className="size-4" aria-hidden="true" /> Add expense
                    </Link>
                  </div>
                }
              />
            </Card>
          ) : (
            <>
              <div className="grid gap-6 xl:grid-cols-5">
                <Card
                  className="xl:col-span-3"
                  title="Income vs expenses"
                  subtitle={
                    data
                      ? `${formatMonth(data.monthlyTrend.from.slice(0, 7))} – ${formatMonth(data.monthlyTrend.to.slice(0, 7))} (6 months ending with the selected period)`
                      : "Last 6 months"
                  }
                  action={<ChartLegend />}
                >
                  {data ? <MonthlyChart months={data.monthlyTrend.months} /> : <LoadingBlock />}
                </Card>

                <Card className="xl:col-span-2" title="Spending by category" subtitle={`Expenses, ${label}`}>
                  {!data ? (
                    <LoadingBlock />
                  ) : data.expenseByCategory.length === 0 ? (
                    <EmptyState title="No expenses in this period" message="Try a different period, or add an expense." className="py-10" />
                  ) : (
                    <CategoryBreakdown categories={data.expenseByCategory} limit={6} />
                  )}
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-5">
                <Card
                  className="xl:col-span-3"
                  title="Latest transactions"
                  subtitle="Your 5 most recent entries, across all dates"
                  bodyClassName="py-1 sm:py-1"
                >
                  {!data ? (
                    <LoadingBlock />
                  ) : (
                    <ul className="divide-y divide-line">
                      {data.recentTransactions.map((t) => (
                        <li key={t.id} className="flex items-center gap-3 py-3">
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                              t.type === "income" ? "bg-income-soft text-income-text" : "bg-expense-soft text-expense-text"
                            }`}
                          >
                            {t.type === "income" ? <LuArrowDownLeft className="size-4" aria-label="Income" /> : <LuArrowUpRight className="size-4" aria-label="Expense" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{t.description || t.category}</p>
                            <p className="truncate text-xs text-ink-3">
                              {t.category} · {formatDate(t.transactionDate)}
                            </p>
                          </div>
                          <AmountText amount={t.amount} type={t.type} className="text-sm" />
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="xl:col-span-2" title="Quick actions">
                  <div className="grid gap-2">
                    {[
                      { to: "/income?new=1", label: "Add income", icon: LuArrowDownLeft, tone: "bg-income-soft text-income-text" },
                      { to: "/expense?new=1", label: "Add expense", icon: LuArrowUpRight, tone: "bg-expense-soft text-expense-text" },
                      { to: "/reports", label: "View reports", icon: LuChartColumn, tone: "bg-accent-50 text-accent-700" },
                    ].map(({ to, label: text, icon: Icon, tone }) => (
                      <Link
                        key={to}
                        to={to}
                        className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-navy-100 hover:bg-navy-50"
                      >
                        <span className={`flex size-8 items-center justify-center rounded-lg ${tone}`}>
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        {text}
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Home;
