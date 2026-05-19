from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Select, desc, func, select
from sqlalchemy.orm import Session

from app.models.dim_channel import DimChannel
from app.models.dim_product import DimProduct
from app.models.dim_region import DimRegion
from app.models.fact_order import FactOrder
from app.schemas.metrics import (
    RevenueByChannelPoint,
    RevenueByRegionPoint,
    RevenueOverTimePoint,
    SummaryMetricResponse,
    TopProductPoint,
)
from app.schemas.orders import OrderListItem, OrdersResponse
from app.services.transformation_service import normalize_dimension_value


def to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def build_fact_filters(
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
) -> list:
    filters = []
    if start_date is not None:
        filters.append(FactOrder.order_date >= start_date)
    if end_date is not None:
        filters.append(FactOrder.order_date <= end_date)
    if category:
        filters.append(DimProduct.category == normalize_dimension_value(category))
    if region:
        filters.append(DimRegion.region_name == normalize_dimension_value(region))
    if channel:
        filters.append(DimChannel.channel_name == normalize_dimension_value(channel))
    return filters


def build_fact_joined_select() -> Select:
    return (
        select(FactOrder, DimProduct, DimRegion, DimChannel)
        .join(DimProduct, FactOrder.product_id == DimProduct.id)
        .join(DimRegion, FactOrder.region_id == DimRegion.id)
        .join(DimChannel, FactOrder.channel_id == DimChannel.id)
    )


def get_summary_metrics(
    session: Session,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
) -> SummaryMetricResponse:
    filters = build_fact_filters(
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
    )

    summary_row = session.execute(
        select(
            func.coalesce(func.sum(FactOrder.total_amount), 0),
            func.count(FactOrder.id),
            func.coalesce(func.avg(FactOrder.total_amount), 0),
        )
        .select_from(FactOrder)
        .join(DimProduct, FactOrder.product_id == DimProduct.id)
        .join(DimRegion, FactOrder.region_id == DimRegion.id)
        .join(DimChannel, FactOrder.channel_id == DimChannel.id)
        .where(*filters)
    ).one()

    top_product = session.execute(
        select(
            DimProduct.product_name,
            func.coalesce(func.sum(FactOrder.total_amount), 0).label("revenue"),
        )
        .select_from(FactOrder)
        .join(DimProduct, FactOrder.product_id == DimProduct.id)
        .join(DimRegion, FactOrder.region_id == DimRegion.id)
        .join(DimChannel, FactOrder.channel_id == DimChannel.id)
        .where(*filters)
        .group_by(DimProduct.product_name)
        .order_by(desc("revenue"), DimProduct.product_name.asc())
        .limit(1)
    ).first()

    return SummaryMetricResponse(
        total_revenue=to_float(summary_row[0]),
        total_orders=int(summary_row[1] or 0),
        average_order_value=to_float(summary_row[2]),
        top_product=top_product[0] if top_product else None,
    )


def get_revenue_over_time(
    session: Session,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
) -> list[RevenueOverTimePoint]:
    filters = build_fact_filters(
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
    )

    rows = session.execute(
        select(
            FactOrder.order_date,
            func.coalesce(func.sum(FactOrder.total_amount), 0).label("revenue"),
            func.count(FactOrder.id).label("order_count"),
        )
        .select_from(FactOrder)
        .join(DimProduct, FactOrder.product_id == DimProduct.id)
        .join(DimRegion, FactOrder.region_id == DimRegion.id)
        .join(DimChannel, FactOrder.channel_id == DimChannel.id)
        .where(*filters)
        .group_by(FactOrder.order_date)
        .order_by(FactOrder.order_date.asc())
    ).all()

    return [
        RevenueOverTimePoint(order_date=order_date, revenue=to_float(revenue), order_count=int(order_count))
        for order_date, revenue, order_count in rows
    ]


def get_top_products(
    session: Session,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    limit: int = 5,
) -> list[TopProductPoint]:
    filters = build_fact_filters(
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
    )

    rows = session.execute(
        select(
            DimProduct.product_name,
            func.coalesce(func.sum(FactOrder.total_amount), 0).label("revenue"),
            func.coalesce(func.sum(FactOrder.quantity), 0).label("quantity_sold"),
        )
        .select_from(FactOrder)
        .join(DimProduct, FactOrder.product_id == DimProduct.id)
        .join(DimRegion, FactOrder.region_id == DimRegion.id)
        .join(DimChannel, FactOrder.channel_id == DimChannel.id)
        .where(*filters)
        .group_by(DimProduct.product_name)
        .order_by(desc("revenue"), DimProduct.product_name.asc())
        .limit(limit)
    ).all()

    return [
        TopProductPoint(
            product_name=product_name,
            revenue=to_float(revenue),
            quantity_sold=int(quantity_sold or 0),
        )
        for product_name, revenue, quantity_sold in rows
    ]


def get_revenue_by_region(
    session: Session,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
) -> list[RevenueByRegionPoint]:
    filters = build_fact_filters(
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
    )

    rows = session.execute(
        select(
            DimRegion.region_name,
            func.coalesce(func.sum(FactOrder.total_amount), 0).label("revenue"),
            func.count(FactOrder.id).label("order_count"),
        )
        .select_from(FactOrder)
        .join(DimProduct, FactOrder.product_id == DimProduct.id)
        .join(DimRegion, FactOrder.region_id == DimRegion.id)
        .join(DimChannel, FactOrder.channel_id == DimChannel.id)
        .where(*filters)
        .group_by(DimRegion.region_name)
        .order_by(desc("revenue"), DimRegion.region_name.asc())
    ).all()

    return [
        RevenueByRegionPoint(region=region_name, revenue=to_float(revenue), order_count=int(order_count))
        for region_name, revenue, order_count in rows
    ]


def get_revenue_by_channel(
    session: Session,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
) -> list[RevenueByChannelPoint]:
    filters = build_fact_filters(
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
    )

    rows = session.execute(
        select(
            DimChannel.channel_name,
            func.coalesce(func.sum(FactOrder.total_amount), 0).label("revenue"),
            func.count(FactOrder.id).label("order_count"),
        )
        .select_from(FactOrder)
        .join(DimProduct, FactOrder.product_id == DimProduct.id)
        .join(DimRegion, FactOrder.region_id == DimRegion.id)
        .join(DimChannel, FactOrder.channel_id == DimChannel.id)
        .where(*filters)
        .group_by(DimChannel.channel_name)
        .order_by(desc("revenue"), DimChannel.channel_name.asc())
    ).all()

    return [
        RevenueByChannelPoint(channel=channel_name, revenue=to_float(revenue), order_count=int(order_count))
        for channel_name, revenue, order_count in rows
    ]


def get_orders(
    session: Session,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> OrdersResponse:
    filters = build_fact_filters(
        start_date=start_date,
        end_date=end_date,
        category=category,
        region=region,
        channel=channel,
    )

    total = session.scalar(
        select(func.count(FactOrder.id))
        .select_from(FactOrder)
        .join(DimProduct, FactOrder.product_id == DimProduct.id)
        .join(DimRegion, FactOrder.region_id == DimRegion.id)
        .join(DimChannel, FactOrder.channel_id == DimChannel.id)
        .where(*filters)
    ) or 0

    rows = session.execute(
        select(
            FactOrder.source_record_id,
            FactOrder.order_date,
            DimProduct.product_name,
            DimProduct.category,
            DimRegion.region_name,
            DimChannel.channel_name,
            FactOrder.quantity,
            FactOrder.unit_price,
            FactOrder.total_amount,
        )
        .select_from(FactOrder)
        .join(DimProduct, FactOrder.product_id == DimProduct.id)
        .join(DimRegion, FactOrder.region_id == DimRegion.id)
        .join(DimChannel, FactOrder.channel_id == DimChannel.id)
        .where(*filters)
        .order_by(FactOrder.order_date.desc(), FactOrder.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return OrdersResponse(
        total=int(total),
        limit=limit,
        offset=offset,
        items=[
            OrderListItem(
                source_record_id=source_record_id,
                order_date=order_date,
                product_name=product_name,
                category=category_name,
                region=region_name,
                channel=channel_name,
                quantity=int(quantity),
                unit_price=to_float(unit_price),
                total_amount=to_float(total_amount),
            )
            for (
                source_record_id,
                order_date,
                product_name,
                category_name,
                region_name,
                channel_name,
                quantity,
                unit_price,
                total_amount,
            ) in rows
        ],
    )
