from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AddCartItemRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    variant_id: str
    quantity: int = Field(default=1, ge=1)


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(ge=1)


class CartItemResponse(BaseModel):
    id: str
    variant_id: str
    product_id: str
    product_name: str
    product_slug: str
    variant_name: str
    sku: str
    quantity: int
    unit_price: float
    line_total: float
    currency: str
    primary_image_url: str | None
    available_stock: int
    allow_backorder: bool
    is_in_stock: bool
    created_at: datetime
    updated_at: datetime


class CartResponse(BaseModel):
    id: str
    cart_token: str | None
    customer_id: str | None
    item_count: int
    unique_item_count: int
    subtotal: float
    currency: str
    items: list[CartItemResponse]
