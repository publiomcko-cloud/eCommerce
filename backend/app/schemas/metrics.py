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
