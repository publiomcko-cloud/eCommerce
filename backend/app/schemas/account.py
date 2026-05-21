from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CustomerAccountProfileResponse(BaseModel):
    user_id: str
    customer_id: str
    email: str
    role: str
    first_name: str | None
    last_name: str | None
    phone: str | None
    marketing_opt_in: bool
    address_count: int
    order_count: int
    created_at: datetime
    last_login_at: datetime | None


class CustomerAddressInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    type: str = Field(default="shipping")
    recipient_name: str = Field(min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=40)
    line1: str = Field(min_length=1, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=120)
    region: str = Field(min_length=1, max_length=120)
    postal_code: str = Field(min_length=1, max_length=40)
    country: str = Field(default="BR", min_length=2, max_length=2)
    is_default: bool = False

    @field_validator("type")
    @classmethod
    def normalize_type(cls, value: str) -> str:
        normalized = value.lower()
        if normalized not in {"shipping", "billing", "both"}:
            raise ValueError("Address type must be shipping, billing, or both.")
        return normalized

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.upper()


class CustomerAddressResponse(BaseModel):
    id: str
    type: str
    recipient_name: str
    phone: str | None
    line1: str
    line2: str | None
    city: str
    region: str
    postal_code: str
    country: str
    is_default: bool
    created_at: datetime
    updated_at: datetime


class CustomerOrderListItemResponse(BaseModel):
    id: str
    order_number: str
    status: str
    payment_status: str | None
    total_amount: float
    currency: str
    item_count: int
    created_at: datetime


class CustomerOrderListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[CustomerOrderListItemResponse]
