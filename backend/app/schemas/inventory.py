from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class InventoryAdjustmentRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    variant_id: str
    quantity_delta: int
    reason: str | None = None

    @field_validator("quantity_delta")
    @classmethod
    def ensure_non_zero_delta(cls, value: int) -> int:
        if value == 0:
            raise ValueError("Inventory adjustment quantity cannot be zero.")
        return value


class InventoryAdjustmentResponse(BaseModel):
    movement_id: str
    variant_id: str
    movement_type: Literal["adjustment"]
    quantity_delta: int
    reason: str | None
    stock_on_hand: int
    stock_reserved: int
    available_stock: int
    low_stock_threshold: int
    allow_backorder: bool
    created_at: datetime
