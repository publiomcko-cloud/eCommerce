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

export type CatalogCategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  product_count: number;
};

export type CatalogVariantResponse = {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, unknown>;
  price: number | null;
  effective_price: number;
  weight_grams: number | null;
  status: "active" | "inactive" | "archived";
  available_stock: number;
  allow_backorder: boolean;
  is_in_stock: boolean;
};

export type ProductImageResponse = {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type ProductCardResponse = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  category_name: string;
  category_slug: string;
  brand: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  primary_image_url: string | null;
  is_in_stock: boolean;
  available_stock: number;
  variant_count: number;
};

export type ProductListResponse = {
  total: number;
  limit: number;
  offset: number;
  items: ProductCardResponse[];
};

export type ProductDetailResponse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  brand: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  category: CatalogCategoryResponse;
  images: ProductImageResponse[];
  variants: CatalogVariantResponse[];
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

export type CustomerAddressResponse = {
  id: string;
  type: string;
  recipient_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

export type CustomerProfileResponse = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
  addresses: CustomerAddressResponse[];
};

export type AuthUserResponse = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  customer: CustomerProfileResponse | null;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUserResponse;
};

export type AdminInventoryStateResponse = {
  stock_on_hand: number;
  stock_reserved: number;
  available_stock: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
};

export type AdminProductVariantResponse = {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, unknown>;
  price: number | null;
  effective_price: number;
  weight_grams: number | null;
  status: "active" | "inactive" | "archived";
  inventory: AdminInventoryStateResponse;
};

export type AdminProductResponse = {
  id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  status: "draft" | "active" | "archived";
  brand: string | null;
  base_price: number;
  compare_at_price: number | null;
  currency: string;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  images: ProductImageResponse[];
  variants: AdminProductVariantResponse[];
};

export type AdminProductListItemResponse = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "archived";
  category_name: string;
  variant_count: number;
  total_available_stock: number;
  updated_at: string;
};

export type AdminProductListResponse = {
  total: number;
  limit: number;
  offset: number;
  items: AdminProductListItemResponse[];
};

export type AdminProductImageInput = {
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
};

export type AdminProductVariantInput = {
  id?: string;
  sku: string;
  name: string;
  attributes: Record<string, unknown>;
  price?: number | null;
  weight_grams?: number | null;
  status: "active" | "inactive" | "archived";
  stock_on_hand: number;
  stock_reserved: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
};

export type AdminProductUpsertInput = {
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  status: "draft" | "active" | "archived";
  brand?: string;
  base_price: number;
  compare_at_price?: number | null;
  currency: string;
  seo_title?: string;
  seo_description?: string;
  images: AdminProductImageInput[];
  variants: AdminProductVariantInput[];
};

export type InventoryAdjustmentInput = {
  variant_id: string;
  quantity_delta: number;
  reason?: string;
};

export type InventoryAdjustmentResponse = {
  movement_id: string;
  variant_id: string;
  movement_type: "adjustment";
  quantity_delta: number;
  reason: string | null;
  stock_on_hand: number;
  stock_reserved: number;
  available_stock: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
  created_at: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  marketing_opt_in?: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
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

async function fetchJsonWithToken<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchJsonWithTokenParams<T>(
  path: string,
  token: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}${buildQuery(params ?? {})}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function sendJsonWithToken<T>(
  path: string,
  token: string,
  method: "POST" | "PUT",
  body?: object,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
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

export async function register(payload: RegisterInput) {
  return postJson<AuthTokenResponse>("/auth/register", payload);
}

export async function login(payload: LoginInput) {
  return postJson<AuthTokenResponse>("/auth/login", payload);
}

export async function fetchCurrentUser(token: string) {
  return fetchJsonWithToken<AuthUserResponse>("/auth/me", token);
}

export async function logout(token: string) {
  return sendJsonWithToken<void>("/auth/logout", token, "POST");
}

export async function fetchCatalogCategories() {
  return fetchJson<CatalogCategoryResponse[]>("/catalog/categories");
}

export async function fetchCatalogProducts(params: {
  q?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  return fetchJson<ProductListResponse>("/catalog/products", params);
}

export async function fetchCatalogProduct(slug: string) {
  return fetchJson<ProductDetailResponse>(`/catalog/products/${slug}`);
}

export async function fetchAdminProducts(
  token: string,
  params?: { status?: string; category_id?: string; limit?: number; offset?: number },
) {
  return fetchJsonWithTokenParams<AdminProductListResponse>("/admin/products", token, params);
}

export async function fetchAdminProduct(token: string, productId: string) {
  return fetchJsonWithToken<AdminProductResponse>(`/admin/products/${productId}`, token);
}

export async function createAdminProduct(token: string, payload: AdminProductUpsertInput) {
  return sendJsonWithToken<AdminProductResponse>("/admin/products", token, "POST", payload);
}

export async function updateAdminProduct(token: string, productId: string, payload: AdminProductUpsertInput) {
  return sendJsonWithToken<AdminProductResponse>(`/admin/products/${productId}`, token, "PUT", payload);
}

export async function adjustAdminInventory(token: string, payload: InventoryAdjustmentInput) {
  return sendJsonWithToken<InventoryAdjustmentResponse>("/admin/inventory/adjustments", token, "POST", payload);
}
