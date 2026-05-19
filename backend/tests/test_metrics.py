from datetime import date

from app.db.session import SessionLocal
from app.services.metrics_service import (
    get_orders,
    get_revenue_by_channel,
    get_revenue_by_region,
    get_revenue_over_time,
    get_summary_metrics,
    get_top_products,
)


def test_metrics_service_returns_expected_sample_breakdowns(sample_pipeline_loaded) -> None:
    with SessionLocal() as session:
        summary = get_summary_metrics(session)
        top_products = get_top_products(session)
        revenue_by_region = get_revenue_by_region(session)
        revenue_by_channel = get_revenue_by_channel(session)

    assert summary.model_dump() == {
        "total_revenue": 8518.5,
        "total_orders": 12,
        "average_order_value": 709.88,
        "top_product": "Notebook 14",
    }
    assert [product.model_dump() for product in top_products] == [
        {"product_name": "Notebook 14", "revenue": 3200.0, "quantity_sold": 1},
        {"product_name": "Consulting Session", "revenue": 1350.0, "quantity_sold": 3},
        {"product_name": "Marketing Audit", "revenue": 980.0, "quantity_sold": 1},
        {"product_name": "Office Chair", "revenue": 760.0, "quantity_sold": 1},
        {"product_name": "Smart Speaker", "revenue": 680.0, "quantity_sold": 2},
    ]
    assert [point.model_dump() for point in revenue_by_region] == [
        {"region": "southeast", "revenue": 4430.0, "order_count": 4},
        {"region": "south", "revenue": 1825.5, "order_count": 3},
        {"region": "north", "revenue": 1350.0, "order_count": 1},
        {"region": "northeast", "revenue": 700.0, "order_count": 2},
        {"region": "midwest", "revenue": 213.0, "order_count": 2},
    ]
    assert [point.model_dump() for point in revenue_by_channel] == [
        {"channel": "online", "revenue": 4430.0, "order_count": 4},
        {"channel": "partner", "revenue": 1740.0, "order_count": 2},
        {"channel": "phone_sales", "revenue": 1350.0, "order_count": 1},
        {"channel": "physical_store", "revenue": 700.0, "order_count": 2},
        {"channel": "marketplace", "revenue": 298.5, "order_count": 3},
    ]


def test_metrics_service_applies_filters_to_summary_timeline_and_orders(sample_pipeline_loaded) -> None:
    with SessionLocal() as session:
        electronics_online_summary = get_summary_metrics(
            session,
            category="electronics",
            region="southeast",
            channel="online",
        )
        march_timeline = get_revenue_over_time(
            session,
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 31),
        )
        southeast_orders = get_orders(session, region="southeast", limit=10, offset=0)

    assert electronics_online_summary.model_dump() == {
        "total_revenue": 4120.0,
        "total_orders": 3,
        "average_order_value": 1373.33,
        "top_product": "Notebook 14",
    }
    assert [point.model_dump() for point in march_timeline] == [
        {"order_date": date(2026, 3, 5), "revenue": 490.0, "order_count": 1},
        {"order_date": date(2026, 3, 11), "revenue": 310.0, "order_count": 1},
        {"order_date": date(2026, 3, 19), "revenue": 102.0, "order_count": 1},
        {"order_date": date(2026, 3, 25), "revenue": 980.0, "order_count": 1},
    ]
    assert southeast_orders.total == 4
    assert southeast_orders.limit == 10
    assert southeast_orders.offset == 0
    assert [order.source_record_id for order in southeast_orders.items] == [
        "order-010",
        "order-008",
        "order-004",
        "order-001",
    ]
