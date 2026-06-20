from datetime import date

from pydantic import BaseModel


class SummaryMetricResponse(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    top_product: str | None


class RevenueOverTimePoint(BaseModel):
    order_date: date
    revenue: float
    order_count: int


class TopProductPoint(BaseModel):
    product_name: str
    revenue: float
    quantity_sold: int


class RevenueByRegionPoint(BaseModel):
    region: str
    revenue: float
    order_count: int


class RevenueByChannelPoint(BaseModel):
    channel: str
    revenue: float
    order_count: int


class RevenueByCategoryPoint(BaseModel):
    category: str
    revenue: float
    order_count: int
    quantity_sold: int


class ConversionFunnelResponse(BaseModel):
    product_views: int
    cart_adds: int
    checkouts_started: int
    orders_created: int
    payments_succeeded: int
    visit_to_cart_rate: float
    checkout_to_order_rate: float
    order_to_paid_rate: float


class CartAbandonmentResponse(BaseModel):
    active_carts: int
    converted_carts: int
    abandoned_carts: int
    abandonment_rate: float


class PaymentHealthResponse(BaseModel):
    total_payments: int
    pending_payments: int
    succeeded_payments: int
    failed_payments: int
    success_rate: float
    gross_paid_amount: float
    refunded_amount: float
    net_paid_amount: float


class InventoryRiskPoint(BaseModel):
    variant_id: str
    product_name: str
    category_name: str
    sku: str
    stock_on_hand: int
    stock_reserved: int
    available_stock: int
    low_stock_threshold: int
    allow_backorder: bool
