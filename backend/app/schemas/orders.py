from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.ingestion import QualitySummary


class OrderListItem(BaseModel):
    source_record_id: str | None
    order_date: date
    product_name: str
    category: str
    region: str
    channel: str
    quantity: int
    unit_price: float
    total_amount: float


class OrdersResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[OrderListItem]


class CreateOrderRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    source_record_id: str | None = None
    order_date: date
    customer_id: str = Field(min_length=1, max_length=100)
    product_id: str = Field(min_length=1, max_length=100)
    product_name: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=100)
    region: str = Field(min_length=1, max_length=100)
    channel: str = Field(min_length=1, max_length=100)
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)
    total_amount: float | None = Field(default=None, ge=0)

    @field_validator("source_record_id", mode="before")
    @classmethod
    def normalize_source_record_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class CreateOrderResponse(BaseModel):
    source_record_id: str
    status: str
    ingestion_run_id: str
    transform_run_id: str | None
    message: str
    quality_summary: QualitySummary
    created_order: OrderListItem | None
