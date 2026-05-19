const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type DashboardFilters = {
  startDate?: string;
  endDate?: string;
  category?: string;
  region?: string;
  channel?: string;
};

export type SummaryMetricResponse = {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  top_product: string | null;
};

export type RevenueOverTimePoint = {
  order_date: string;
  revenue: number;
  order_count: number;
};

export type TopProductPoint = {
  product_name: string;
  revenue: number;
  quantity_sold: number;
};

export type RevenueByRegionPoint = {
  region: string;
  revenue: number;
  order_count: number;
};

export type RevenueByChannelPoint = {
  channel: string;
  revenue: number;
  order_count: number;
};

export type OrderListItem = {
  source_record_id: string | null;
  order_date: string;
  product_name: string;
  category: string;
  region: string;
  channel: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
};

export type OrdersResponse = {
  total: number;
  limit: number;
  offset: number;
  items: OrderListItem[];
};

export type CreateOrderInput = {
  source_record_id?: string;
  order_date: string;
  customer_id: string;
  product_id: string;
  product_name: string;
  category: string;
  region: string;
  channel: string;
  quantity: number;
  unit_price: number;
  total_amount?: number;
};

export type IssueTypeCount = {
  issue_type: string;
  count: number;
};

export type QualitySummary = {
  total_issues: number;
  issue_types: IssueTypeCount[];
};

export type LatestIngestionRunResponse = {
  id: string;
  job_name: string;
  source_name: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  records_read: number;
  records_inserted: number;
  records_rejected: number;
  error_message: string | null;
  created_at: string;
  quality_summary: QualitySummary;
};

export type CreateOrderResponse = {
  source_record_id: string;
  status: string;
  ingestion_run_id: string;
  transform_run_id: string | null;
  message: string;
  quality_summary: QualitySummary;
  created_order: OrderListItem | null;
};

type OrdersParams = DashboardFilters & {
  limit?: number;
  offset?: number;
};

type ApiQueryParams = Record<string, string | number | undefined>;

function toApiFilterParams(filters: DashboardFilters): ApiQueryParams {
  return {
    start_date: filters.startDate,
    end_date: filters.endDate,
    category: filters.category,
    region: filters.region,
    channel: filters.channel,
  };
}

function toApiOrdersParams(params: OrdersParams): ApiQueryParams {
  return {
    ...toApiFilterParams(params),
    limit: params.limit,
    offset: params.offset,
  };
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }
    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function fetchJson<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const response = await fetch(`${API_URL}${path}${buildQuery(params ?? {})}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function postJson<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getApiDocsUrl() {
  return `${API_URL}/docs`;
}

export async function fetchSummaryMetrics(filters: DashboardFilters) {
  return fetchJson<SummaryMetricResponse>("/metrics/summary", toApiFilterParams(filters));
}

export async function fetchRevenueOverTime(filters: DashboardFilters) {
  return fetchJson<RevenueOverTimePoint[]>("/metrics/revenue-over-time", toApiFilterParams(filters));
}

export async function fetchTopProducts(filters: DashboardFilters) {
  return fetchJson<TopProductPoint[]>("/metrics/top-products", toApiFilterParams(filters));
}

export async function fetchRevenueByRegion(filters: DashboardFilters) {
  return fetchJson<RevenueByRegionPoint[]>("/metrics/revenue-by-region", toApiFilterParams(filters));
}

export async function fetchRevenueByChannel(filters: DashboardFilters) {
  return fetchJson<RevenueByChannelPoint[]>("/metrics/revenue-by-channel", toApiFilterParams(filters));
}

export async function fetchOrders(params: OrdersParams) {
  return fetchJson<OrdersResponse>("/orders", toApiOrdersParams(params));
}

export async function fetchLatestIngestionRun() {
  try {
    return await fetchJson<LatestIngestionRunResponse>("/ingestion/runs/latest");
  } catch (error) {
    if (error instanceof Error && error.message.includes("No ingestion runs found.")) {
      return null;
    }
    throw error;
  }
}

export async function createOrder(payload: CreateOrderInput) {
  return postJson<CreateOrderResponse>("/orders", payload);
}
