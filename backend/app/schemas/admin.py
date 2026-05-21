from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.checkout import CheckoutAddressResponse, OrderItemResponse, OrderPaymentSummaryResponse


class AdminOverviewResponse(BaseModel):
    total_products: int
    active_products: int
    total_orders: int
    pending_payment_orders: int
    paid_orders: int
    fulfilled_orders: int
    cancelled_orders: int
    low_stock_variants: int
    shipments_in_progress: int


class AdminShipmentResponse(BaseModel):
    id: str
    order_id: str
    carrier: str | None
    service_level: str | None
    tracking_number: str | None
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime


class AdminOrderStatusHistoryResponse(BaseModel):
    id: str
    from_status: str | None
    to_status: str
    reason: str | None
    created_at: datetime


class AdminOrderListItemResponse(BaseModel):
    id: str
    order_number: str
    status: str
    customer_email: str
    payment_status: str | None
    shipment_status: str | None
    total_amount: float
    currency: str
    item_count: int
    created_at: datetime


class AdminOrderListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[AdminOrderListItemResponse]


class AdminOrderDetailResponse(BaseModel):
    id: str
    checkout_session_id: str
    cart_id: str
    customer_id: str
    order_number: str
    status: str
    email: str
    currency: str
    subtotal_amount: float
    total_amount: float
    shipping_address: CheckoutAddressResponse
    billing_address: CheckoutAddressResponse
    items: list[OrderItemResponse]
    payment: OrderPaymentSummaryResponse | None
    shipment: AdminShipmentResponse | None
    status_history: list[AdminOrderStatusHistoryResponse]
    created_at: datetime
    updated_at: datetime


class AdminOrderStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    status: str = Field(pattern="^(pending_payment|paid|cancelled|fulfilled)$")
    reason: str | None = Field(default=None, max_length=500)


class AdminShipmentUpsertRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    carrier: str | None = Field(default=None, max_length=120)
    service_level: str | None = Field(default=None, max_length=120)
    tracking_number: str | None = Field(default=None, max_length=120)
    status: str = Field(pattern="^(pending|packed|shipped|delivered)$")
    notes: str | None = Field(default=None, max_length=1000)


class AdminInventoryListItemResponse(BaseModel):
    variant_id: str
    product_id: str
    product_name: str
    product_slug: str
    category_name: str
    variant_name: str
    sku: str
    variant_status: str
    price: float
    stock_on_hand: int
    stock_reserved: int
    available_stock: int
    low_stock_threshold: int
    allow_backorder: bool


class AdminInventoryListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[AdminInventoryListItemResponse]
