from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PaymentResponse(BaseModel):
    id: str
    order_id: str
    provider_name: str
    provider_payment_id: str
    provider_session_token: str
    status: str
    amount: float
    currency: str
    failure_reason: str | None
    provider_payload: dict[str, object]
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


class MockWebhookRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    event_id: str = Field(min_length=8, max_length=120)
    provider_payment_id: str = Field(min_length=8, max_length=120)
    status: str = Field(pattern="^(succeeded|failed)$")
    failure_reason: str | None = Field(default=None, max_length=500)
