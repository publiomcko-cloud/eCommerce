from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.metrics import (
    RevenueByChannelPoint,
    RevenueByRegionPoint,
    RevenueOverTimePoint,
    SummaryMetricResponse,
    TopProductPoint,
)
from app.schemas.orders import CreateOrderRequest, CreateOrderResponse, OrdersResponse
from app.services.metrics_service import (
    get_orders,
    get_revenue_by_channel,
    get_revenue_by_region,
    get_revenue_over_time,
    get_summary_metrics,
    get_top_products,
)
from app.services.manual_order_service import serialize_manual_order_result, submit_manual_order

router = APIRouter(tags=["metrics"])


@router.get("/metrics/summary", response_model=SummaryMetricResponse)
def metrics_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    db: Session = Depends(get_db),
) -> SummaryMetricResponse:
    return get_summary_metrics(
        db,
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
    )


@router.get("/metrics/revenue-over-time", response_model=list[RevenueOverTimePoint])
def revenue_over_time(
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    db: Session = Depends(get_db),
) -> list[RevenueOverTimePoint]:
    return get_revenue_over_time(
        db,
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
    )


@router.get("/metrics/top-products", response_model=list[TopProductPoint])
def top_products(
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    limit: int = Query(default=5, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[TopProductPoint]:
    return get_top_products(
        db,
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
        limit=limit,
    )


@router.get("/metrics/revenue-by-region", response_model=list[RevenueByRegionPoint])
def revenue_by_region(
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    db: Session = Depends(get_db),
) -> list[RevenueByRegionPoint]:
    return get_revenue_by_region(
        db,
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
    )


@router.get("/metrics/revenue-by-channel", response_model=list[RevenueByChannelPoint])
def revenue_by_channel(
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    db: Session = Depends(get_db),
) -> list[RevenueByChannelPoint]:
    return get_revenue_by_channel(
        db,
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
    )


@router.get("/orders", response_model=OrdersResponse)
def orders(
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> OrdersResponse:
    return get_orders(
        db,
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
        limit=limit,
        offset=offset,
    )


@router.post("/orders", response_model=CreateOrderResponse, status_code=201)
def create_order(payload: CreateOrderRequest) -> CreateOrderResponse:
    result = submit_manual_order(payload)
    return serialize_manual_order_result(result)
