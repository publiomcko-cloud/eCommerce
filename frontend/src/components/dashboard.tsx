"use client";

import { useQuery } from "@tanstack/react-query";
import { startTransition, useDeferredValue, useState } from "react";
import type {
  Formatter,
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  DashboardFilters,
  fetchLatestIngestionRun,
  fetchCartAbandonment,
  fetchConversionFunnel,
  fetchInventoryRisk,
  fetchOrders,
  fetchPaymentHealth,
  fetchRevenueByChannel,
  fetchRevenueByCategory,
  fetchRevenueByRegion,
  fetchRevenueOverTime,
  fetchSummaryMetrics,
  fetchTopProducts,
  getApiDocsUrl,
} from "@/lib/api";
import {
  formatCompactNumber,
  formatCurrency,
  formatDateLabel,
  formatDateTime,
} from "@/lib/format";

const INITIAL_FILTERS = {
  startDate: "",
  endDate: "",
  category: "",
  region: "",
  channel: "",
};

const PIE_COLORS = ["#0f766e", "#d97706", "#0f4c5c", "#b4534f", "#2f855a"];
const AUTO_WEEK_THRESHOLD_DAYS = 31;
const TIME_GRANULARITY_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

type FilterState = typeof INITIAL_FILTERS;
type TimeGranularity = (typeof TIME_GRANULARITY_OPTIONS)[number]["value"];
type RevenueTrendChartPoint = {
  order_date: string;
  revenue: number;
  order_count: number;
};

type MetricCardProps = {
  label: string;
  value: string;
  accent: string;
  helpText: string;
};

type ChartCardProps = {
  title: string;
  description: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
};

type EmptyStateProps = {
  title: string;
  description: string;
};

type PanelMessageProps = {
  title: string;
  body: string;
};

function toDashboardFilters(filters: FilterState): DashboardFilters {
  return {
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    category: filters.category || undefined,
    region: filters.region || undefined,
    channel: filters.channel || undefined,
  };
}

function toNumericValue(value: ValueType | undefined) {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0);
  }

  return Number(value ?? 0);
}

const tooltipCurrency: Formatter<ValueType, NameType> = (value) => {
  return [formatCurrency(toNumericValue(value)), "Revenue"];
};

const tooltipMetricValue: Formatter<ValueType, NameType> = (value, name) => {
  if (name === "Revenue") {
    return [formatCurrency(toNumericValue(value)), name];
  }

  return [toNumericValue(value), name ?? "Value"];
};

function MetricCard({ label, value, accent, helpText }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(29,39,33,0.05)]">
      <div
        className="mb-5 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        {label}
      </div>
      <p
        className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight md:text-4xl"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
        {helpText}
      </p>
    </article>
  );
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00`);
}


function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


function startOfWeek(value: Date) {
  const next = new Date(value);
  const day = next.getDay();
  const mondayOffset = (day + 6) % 7;
  next.setDate(next.getDate() - mondayOffset);
  return next;
}


function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}


function startOfYear(value: Date) {
  return new Date(value.getFullYear(), 0, 1);
}


function getBucketKey(orderDate: string, granularity: TimeGranularity) {
  const dateValue = parseIsoDate(orderDate);

  if (granularity === "day") {
    return orderDate;
  }
  if (granularity === "week") {
    return toIsoDate(startOfWeek(dateValue));
  }
  if (granularity === "month") {
    return toIsoDate(startOfMonth(dateValue));
  }

  return toIsoDate(startOfYear(dateValue));
}


function aggregateRevenueTrend(
  data: RevenueTrendChartPoint[],
  granularity: TimeGranularity,
) {
  if (granularity === "day") {
    return data;
  }

  const buckets = new Map<string, RevenueTrendChartPoint>();

  for (const point of data) {
    const bucketKey = getBucketKey(point.order_date, granularity);
    const existing = buckets.get(bucketKey);

    if (existing) {
      existing.revenue += point.revenue;
      existing.order_count += point.order_count;
      continue;
    }

    buckets.set(bucketKey, {
      order_date: bucketKey,
      revenue: point.revenue,
      order_count: point.order_count,
    });
  }

  return [...buckets.values()].sort((left, right) => left.order_date.localeCompare(right.order_date));
}


function differenceInCalendarDays(startDate: string, endDate: string) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay);
}


function getVisibleRangeDays(
  data: RevenueTrendChartPoint[],
  startDate?: string,
  endDate?: string,
) {
  if (startDate && endDate) {
    return differenceInCalendarDays(startDate, endDate);
  }

  if (data.length < 2) {
    return 0;
  }

  return differenceInCalendarDays(data[0].order_date, data[data.length - 1].order_date);
}


function recommendGranularity(
  data: RevenueTrendChartPoint[],
  startDate?: string,
  endDate?: string,
): TimeGranularity {
  return getVisibleRangeDays(data, startDate, endDate) > AUTO_WEEK_THRESHOLD_DAYS ? "week" : "day";
}


function formatGranularityTickLabel(value: string, granularity: TimeGranularity) {
  const dateValue = parseIsoDate(value);

  if (granularity === "day") {
    return formatDateLabel(value);
  }
  if (granularity === "week") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(dateValue);
  }
  if (granularity === "month") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(dateValue);
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
  }).format(dateValue);
}


function formatGranularityTooltipLabel(value: string, granularity: TimeGranularity) {
  if (granularity === "week") {
    return `Week of ${formatGranularityTickLabel(value, granularity)}`;
  }

  return formatGranularityTickLabel(value, granularity);
}


function ChartCard({ title, description, headerAction, children }: ChartCardProps) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(29,39,33,0.05)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        </div>
        {headerAction}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--background)] px-6 text-center">
      <p className="font-[family-name:var(--font-heading)] text-lg font-semibold">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6" style={{ color: "var(--muted)" }}>
        {description}
      </p>
    </div>
  );
}

function PanelMessage({ title, body }: PanelMessageProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center rounded-lg border border-[var(--line)] bg-white px-6 py-20 text-center shadow-[var(--shadow)]">
      <div className="max-w-xl">
        <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
          {title}
        </p>
        <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
          {body}
        </p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [manualGranularity, setManualGranularity] = useState<TimeGranularity | null>(null);
  const deferredFilters = useDeferredValue(filters);
  const activeFilters = toDashboardFilters(deferredFilters);

  const summaryQuery = useQuery({
    queryKey: ["summary-metrics", activeFilters],
    queryFn: () => fetchSummaryMetrics(activeFilters),
  });
  const revenueOverTimeQuery = useQuery({
    queryKey: ["revenue-over-time", activeFilters],
    queryFn: () => fetchRevenueOverTime(activeFilters),
  });
  const topProductsQuery = useQuery({
    queryKey: ["top-products", activeFilters],
    queryFn: () => fetchTopProducts(activeFilters),
  });
  const revenueByRegionQuery = useQuery({
    queryKey: ["revenue-by-region", activeFilters],
    queryFn: () => fetchRevenueByRegion(activeFilters),
  });
  const revenueByChannelQuery = useQuery({
    queryKey: ["revenue-by-channel", activeFilters],
    queryFn: () => fetchRevenueByChannel(activeFilters),
  });
  const revenueByCategoryQuery = useQuery({
    queryKey: ["commerce-revenue-by-category"],
    queryFn: fetchRevenueByCategory,
  });
  const conversionFunnelQuery = useQuery({
    queryKey: ["commerce-conversion-funnel"],
    queryFn: fetchConversionFunnel,
  });
  const cartAbandonmentQuery = useQuery({
    queryKey: ["commerce-cart-abandonment"],
    queryFn: fetchCartAbandonment,
  });
  const paymentHealthQuery = useQuery({
    queryKey: ["commerce-payment-health"],
    queryFn: fetchPaymentHealth,
  });
  const inventoryRiskQuery = useQuery({
    queryKey: ["commerce-inventory-risk"],
    queryFn: fetchInventoryRisk,
  });
  const ordersQuery = useQuery({
    queryKey: ["orders", activeFilters, 8, 0],
    queryFn: () => fetchOrders({ ...activeFilters, limit: 8, offset: 0 }),
  });
  const latestRunQuery = useQuery({
    queryKey: ["latest-ingestion-run"],
    queryFn: fetchLatestIngestionRun,
  });
  const catalogQuery = useQuery({
    queryKey: ["orders-catalog"],
    queryFn: () => fetchOrders({ limit: 100, offset: 0 }),
  });

  const queries = [
    summaryQuery,
    revenueOverTimeQuery,
    topProductsQuery,
    revenueByRegionQuery,
    revenueByChannelQuery,
    revenueByCategoryQuery,
    conversionFunnelQuery,
    cartAbandonmentQuery,
    paymentHealthQuery,
    inventoryRiskQuery,
    ordersQuery,
    latestRunQuery,
  ];

  const isInitialLoading = queries.every((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error;

  const catalogItems = catalogQuery.data?.items ?? [];
  const categories = [...new Set(catalogItems.map((item) => item.category))].sort();
  const regions = [...new Set(catalogItems.map((item) => item.region))].sort();
  const channels = [...new Set(catalogItems.map((item) => item.channel))].sort();

  if (isInitialLoading) {
    return (
      <PanelMessage
        title="Loading the dashboard"
        body="The frontend is pulling metrics, operational status, and recent orders from the FastAPI backend."
      />
    );
  }

  if (error) {
    return (
      <PanelMessage
        title="The dashboard could not reach the API"
        body="Confirm that the backend is running on http://localhost:8000 and that the frontend has NEXT_PUBLIC_API_URL pointed at the correct base URL."
      />
    );
  }

  const summary = summaryQuery.data;
  const latestRun = latestRunQuery.data;
  const revenueTrend = revenueOverTimeQuery.data ?? [];
  const recommendedGranularity = recommendGranularity(
    revenueTrend,
    filters.startDate || undefined,
    filters.endDate || undefined,
  );
  const selectedGranularity = manualGranularity ?? recommendedGranularity;
  const topProducts = topProductsQuery.data ?? [];
  const revenueByRegion = revenueByRegionQuery.data ?? [];
  const revenueByChannel = revenueByChannelQuery.data ?? [];
  const revenueByCategory = revenueByCategoryQuery.data ?? [];
  const conversionFunnel = conversionFunnelQuery.data;
  const cartAbandonment = cartAbandonmentQuery.data;
  const paymentHealth = paymentHealthQuery.data;
  const inventoryRisk = inventoryRiskQuery.data ?? [];
  const recentOrders = ordersQuery.data?.items ?? [];
  const totalOrders = ordersQuery.data?.total ?? 0;
  const chartRevenueTrend = aggregateRevenueTrend(revenueTrend, selectedGranularity);

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                Commerce intelligence
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                Track the store from checkout to revenue.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
                Commerce metrics connect storefront behavior, cart movement, mock payments, inventory risk, and
                revenue into one business view.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={getApiDocsUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-[var(--teal)] bg-[var(--teal)] px-6 py-3 text-center text-sm font-semibold leading-tight text-white shadow-[0_10px_30px_rgba(0,121,107,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Open API docs
              </a>
              <div className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--background)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                  Data freshness
                </p>
                <p className="mt-2 break-words font-[family-name:var(--font-heading)] text-base font-semibold leading-6 sm:text-lg">
                  {latestRun?.job_name ?? "No runs yet"}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  {latestRun ? formatDateTime(latestRun.finished_at) : "Run the pipeline to populate status."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(29,39,33,0.05)]">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">
                Filter the business view
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                Every chart below uses the same filter state, while the ingestion status card stays tied to the latest backend run.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setManualGranularity(null);
                startTransition(() => {
                  setFilters(INITIAL_FILTERS);
                });
              }}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium transition-colors hover:bg-white/50"
            >
              Reset filters
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                Start date
              </span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) => {
                  setManualGranularity(null);
                  setFilters((current) => ({ ...current, startDate: event.target.value }));
                }}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                End date
              </span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) => {
                  setManualGranularity(null);
                  setFilters((current) => ({ ...current, endDate: event.target.value }));
                }}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              />
            </label>

            <FilterSelect
              label="Category"
              value={filters.category}
              options={categories}
              onChange={(value) => {
                setFilters((current) => ({ ...current, category: value }));
              }}
            />
            <FilterSelect
              label="Region"
              value={filters.region}
              options={regions}
              onChange={(value) => {
                setFilters((current) => ({ ...current, region: value }));
              }}
            />
            <FilterSelect
              label="Channel"
              value={filters.channel}
              options={channels}
              onChange={(value) => {
                setFilters((current) => ({ ...current, channel: value }));
              }}
            />
          </div>
        </section>

        <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Paid GMV"
            value={formatCurrency(paymentHealth?.gross_paid_amount ?? 0)}
            accent="#0f766e"
            helpText="Commerce payment volume captured by the mock provider."
          />
          <MetricCard
            label="Payment success"
            value={`${Math.round((paymentHealth?.success_rate ?? 0) * 100)}%`}
            accent="#0f4c5c"
            helpText={`${paymentHealth?.succeeded_payments ?? 0} succeeded of ${paymentHealth?.total_payments ?? 0} payments.`}
          />
          <MetricCard
            label="Cart abandonment"
            value={`${Math.round((cartAbandonment?.abandonment_rate ?? 0) * 100)}%`}
            accent="#b7791f"
            helpText={`${cartAbandonment?.abandoned_carts ?? 0} carts still active or abandoned.`}
          />
          <MetricCard
            label="Inventory risk"
            value={formatCompactNumber(inventoryRisk.length)}
            accent="#b4534f"
            helpText="Variants at or below their low-stock threshold."
          />
        </section>

        <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Revenue"
            value={formatCurrency(summary?.total_revenue ?? 0)}
            accent="#0f766e"
            helpText="Recognized order value for the active analytical slice."
          />
          <MetricCard
            label="Orders"
            value={formatCompactNumber(summary?.total_orders ?? 0)}
            accent="#b7791f"
            helpText="Completed records currently visible in analytics."
          />
          <MetricCard
            label="Average order"
            value={formatCurrency(summary?.average_order_value ?? 0)}
            accent="#0f4c5c"
            helpText="Average revenue per order in the selected range."
          />
          <MetricCard
            label="Top product"
            value={summary?.top_product ?? "No matching product"}
            accent="#b4534f"
            helpText="Highest-revenue product after filters are applied."
          />
        </section>

        <section className="dashboard-grid xl:grid-cols-[1.55fr_0.95fr]">
          <ChartCard
            title="Revenue over time"
            description="Trend view for revenue and order count with adjustable time buckets, useful for zooming out when the selected period gets crowded."
            headerAction={
              <label className="flex min-w-[160px] flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Group by
                </span>
                <select
                  value={selectedGranularity}
                  onChange={(event) => {
                    setManualGranularity(event.target.value as TimeGranularity);
                  }}
                  className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--teal)]"
                >
                  {TIME_GRANULARITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            }
          >
            {chartRevenueTrend.length === 0 ? (
              <EmptyState
                title="No revenue trend for this slice"
                description="Try widening the date range or clearing one of the categorical filters."
              />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartRevenueTrend}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="order_date"
                      tickFormatter={(value: string) =>
                        formatGranularityTickLabel(value, selectedGranularity)
                      }
                      tick={{ fill: "#58717c", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value: number) => formatCompactNumber(value)}
                      tick={{ fill: "#58717c", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "#58717c", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={tooltipMetricValue}
                      labelFormatter={(value) =>
                        formatGranularityTooltipLabel(String(value), selectedGranularity)
                      }
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#0f766e"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="order_count"
                      name="Orders"
                      stroke="#b7791f"
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Pipeline status"
            description="The dashboard keeps one operational panel visible so reviewers can connect business output to ingestion and transformation activity."
          >
            <div className="flex flex-col gap-5">
              <div className="rounded-lg bg-[var(--background)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                      Job status
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold">
                      {latestRun?.status ?? "unknown"}
                    </p>
                  </div>
                  <div className="max-w-full break-words rounded-full bg-[var(--teal-soft)] px-4 py-2 text-center text-sm font-semibold text-[var(--teal)]">
                    {latestRun?.job_name ?? "No run"}
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <StatusStat label="Read" value={String(latestRun?.records_read ?? 0)} />
                  <StatusStat label="Inserted" value={String(latestRun?.records_inserted ?? 0)} />
                  <StatusStat label="Rejected" value={String(latestRun?.records_rejected ?? 0)} />
                </div>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Quality summary
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Last finished at {latestRun ? formatDateTime(latestRun.finished_at) : "unknown"}.
                </p>
                {latestRun && latestRun.quality_summary.issue_types.length > 0 ? (
                  <ul className="mt-4 flex flex-col gap-3">
                    {latestRun.quality_summary.issue_types.map((issue) => (
                      <li
                        key={issue.issue_type}
                        className="flex items-center justify-between rounded-lg border border-[var(--line)] px-4 py-3 text-sm"
                      >
                        <span>{issue.issue_type.replaceAll("_", " ")}</span>
                        <span className="font-semibold">{issue.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-[var(--line)] bg-[var(--background)] px-4 py-5 text-sm" style={{ color: "var(--muted)" }}>
                    No recent quality issues were recorded for the latest run.
                  </div>
                )}
              </div>
            </div>
          </ChartCard>
        </section>

        <section className="dashboard-grid xl:grid-cols-3">
          <ChartCard
            title="Top products"
            description="Revenue concentration by product. This makes it easy to see whether demand is broad or driven by a few items."
          >
            {topProducts.length === 0 ? (
              <EmptyState
                title="No product data"
                description="The active filters returned no products, so the ranking is empty."
              />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(value: number) => formatCompactNumber(value)}
                      tick={{ fill: "#58717c", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="product_name"
                      width={120}
                      tick={{ fill: "#17313f", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={tooltipCurrency} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0, 12, 12, 0]} fill="#0f766e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Revenue by region"
            description="Regional revenue is grouped to show geographic spread and order density in the same visual."
          >
            {revenueByRegion.length === 0 ? (
              <EmptyState
                title="No regional data"
                description="No regions matched the active filter set."
              />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByRegion}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="region"
                      tick={{ fill: "#17313f", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value: number) => formatCompactNumber(value)}
                      tick={{ fill: "#58717c", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={tooltipCurrency} />
                    <Bar dataKey="revenue" radius={[12, 12, 0, 0]} fill="#b7791f" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Revenue by channel"
            description="Channel mix helps compare how the sample business is distributed across direct, digital, and partner acquisition paths."
          >
            {revenueByChannel.length === 0 ? (
              <EmptyState
                title="No channel data"
                description="No channels matched the current selection."
              />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByChannel}
                      dataKey="revenue"
                      nameKey="channel"
                      innerRadius={74}
                      outerRadius={110}
                      paddingAngle={3}
                    >
                      {revenueByChannel.map((entry, index) => (
                        <Cell key={entry.channel} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipCurrency} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </section>

        <section className="dashboard-grid xl:grid-cols-[1fr_1fr]">
          <ChartCard
            title="Commerce funnel"
            description="Event counts from product browsing through cart, checkout, order creation, and successful mock payment."
          >
            <div className="grid gap-3 sm:grid-cols-5">
              {[
                ["Views", conversionFunnel?.product_views ?? 0],
                ["Cart adds", conversionFunnel?.cart_adds ?? 0],
                ["Checkouts", conversionFunnel?.checkouts_started ?? 0],
                ["Orders", conversionFunnel?.orders_created ?? 0],
                ["Paid", conversionFunnel?.payments_succeeded ?? 0],
              ].map(([label, value]) => (
                <StatusStat key={String(label)} label={String(label)} value={formatCompactNumber(Number(value))} />
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatusStat label="View to cart" value={`${Math.round((conversionFunnel?.visit_to_cart_rate ?? 0) * 100)}%`} />
              <StatusStat label="Checkout to order" value={`${Math.round((conversionFunnel?.checkout_to_order_rate ?? 0) * 100)}%`} />
              <StatusStat label="Order to paid" value={`${Math.round((conversionFunnel?.order_to_paid_rate ?? 0) * 100)}%`} />
            </div>
          </ChartCard>

          <ChartCard
            title="Revenue by category"
            description="Paid commerce revenue grouped by catalog category, independent of the legacy CSV analytics filters."
          >
            {revenueByCategory.length === 0 ? (
              <EmptyState
                title="No paid commerce revenue"
                description="Complete a mock payment to populate category revenue."
              />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByCategory}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: "#17313f", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value: number) => formatCompactNumber(value)}
                      tick={{ fill: "#58717c", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={tooltipCurrency} />
                    <Bar dataKey="revenue" name="Revenue" radius={[12, 12, 0, 0]} fill="#0f766e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </section>

        <ChartCard
          title="Recent orders"
          description={`Showing ${recentOrders.length} of ${totalOrders} orders from the filtered analytical dataset.`}
        >
          {recentOrders.length === 0 ? (
            <EmptyState
              title="No orders for this slice"
              description="Broaden the filters to restore recent order visibility."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                    <th className="px-4">Order</th>
                    <th className="px-4">Product</th>
                    <th className="px-4">Category</th>
                    <th className="px-4">Region</th>
                    <th className="px-4">Channel</th>
                    <th className="px-4">Quantity</th>
                    <th className="px-4">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={`${order.source_record_id}-${order.order_date}`} className="rounded-lg bg-[var(--background)]">
                      <td className="rounded-l-lg px-4 py-4">
                        <div className="font-medium">{order.source_record_id ?? "unknown"}</div>
                        <div className="text-sm" style={{ color: "var(--muted)" }}>
                          {formatDateLabel(order.order_date)}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium">{order.product_name}</td>
                      <td className="px-4 py-4">{order.category}</td>
                      <td className="px-4 py-4">{order.region}</td>
                      <td className="px-4 py-4">{order.channel}</td>
                      <td className="px-4 py-4">{order.quantity}</td>
                      <td className="rounded-r-lg px-4 py-4 font-semibold">
                        {formatCurrency(order.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </main>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
      >
        <option value="">All {label.toLowerCase()}s</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type StatusStatProps = {
  label: string;
  value: string;
};

function StatusStat({ label, value }: StatusStatProps) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-heading)] text-xl font-semibold">{value}</p>
    </div>
  );
}
