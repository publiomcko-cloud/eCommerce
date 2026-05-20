from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CheckoutAddressInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    recipient_name: str = Field(min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=40)
    line1: str = Field(min_length=1, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=120)
    region: str = Field(min_length=1, max_length=120)
    postal_code: str = Field(min_length=1, max_length=40)
    country: str = Field(default="BR", min_length=2, max_length=2)

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.upper()


class CreateCheckoutSessionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    shipping_address: CheckoutAddressInput
    billing_address: CheckoutAddressInput
    email: str = Field(min_length=3, max_length=255)


class CheckoutAddressResponse(BaseModel):
    recipient_name: str
    phone: str | None
    line1: str
    line2: str | None
    city: str
    region: str
    postal_code: str
    country: str


class CheckoutTotalsResponse(BaseModel):
    item_count: int
    unique_item_count: int
    subtotal: float
    total: float
    currency: str


class CheckoutSessionResponse(BaseModel):
    id: str
    cart_id: str
    customer_id: str
    email: str
    status: str
    shipping_address: CheckoutAddressResponse
    billing_address: CheckoutAddressResponse
    totals: CheckoutTotalsResponse
    created_at: datetime
    updated_at: datetime


class PlaceOrderRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    checkout_session_id: str
    idempotency_key: str = Field(min_length=8, max_length=120)


class OrderItemResponse(BaseModel):
    id: str
    variant_id: str
    product_name: str
    product_slug: str
    variant_name: str
    sku: str
    quantity: int
    unit_price: float
    line_total: float
    attributes_snapshot: dict[str, Any]


class OrderPaymentSummaryResponse(BaseModel):
    id: str
    provider_name: str
    provider_payment_id: str
    provider_session_token: str
    status: str
    amount: float
    currency: str
    failure_reason: str | None
    completed_at: datetime | None


class OrderResponse(BaseModel):
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
    totals: CheckoutTotalsResponse
    items: list[OrderItemResponse]
    payment: OrderPaymentSummaryResponse | None
    created_at: datetime
    updated_at: datetime
