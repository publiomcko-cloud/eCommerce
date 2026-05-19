from decimal import Decimal
from pathlib import Path

from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models.data_quality_issue import DataQualityIssue
from app.models.dim_channel import DimChannel
from app.models.dim_customer import DimCustomer
from app.models.dim_product import DimProduct
from app.models.dim_region import DimRegion
from app.models.fact_order import FactOrder
from app.models.ingestion_run import IngestionRun
from app.models.staging_order import StagingOrder
from app.services.ingestion_service import ingest_csv_file
from app.services.transformation_service import (
    calculate_total_amount,
    normalize_dimension_value,
    parse_non_negative_decimal,
    parse_order_date,
    parse_positive_int,
    transform_raw_orders,
)


def test_transformation_helpers_parse_and_normalize_values() -> None:
    assert normalize_dimension_value(" South East ") == "south_east"
    assert parse_order_date("2026-03-25").isoformat() == "2026-03-25"
    assert parse_positive_int("7", "quantity_raw") == 7
    assert parse_non_negative_decimal("18.5", "unit_price_raw") == Decimal("18.50")
    assert calculate_total_amount(3, Decimal("20.00"), None) == Decimal("60.00")


def test_transform_raw_orders_populates_staging_dimensions_and_facts(tmp_path: Path) -> None:
    csv_path = tmp_path / "orders.csv"
    csv_path.write_text(
        "\n".join(
            [
                "source_record_id,order_date,customer_id,product_id,product_name,category,region,channel,quantity,unit_price,total_amount",
                "order-100,2026-04-01,cust-100,prod-100,Standing Desk,home,southeast,online,1,1200.00,1200.00",
                "order-101,2026-04-02,cust-101,prod-101,Noise Cancelling Headphones,electronics,south,marketplace,2,350.00,700.00",
                "order-102,2026-04-03,cust-102,prod-102,Nut Mix,food,midwest,physical_store,4,22.50,90.00",
            ]
        ),
        encoding="utf-8",
    )

    ingestion_result = ingest_csv_file(csv_path, source_name="transformable_orders.csv")
    result = transform_raw_orders(source_run_id=ingestion_result.run_id)

    assert result.status == "success"
    assert result.records_read == 3
    assert result.records_inserted == 3
    assert result.records_rejected == 0

    with SessionLocal() as session:
        stg_count = session.scalar(select(func.count()).select_from(StagingOrder))
        fact_count = session.scalar(select(func.count()).select_from(FactOrder))
        product_count = session.scalar(select(func.count()).select_from(DimProduct))
        customer_count = session.scalar(select(func.count()).select_from(DimCustomer))
        region_count = session.scalar(select(func.count()).select_from(DimRegion))
        channel_count = session.scalar(select(func.count()).select_from(DimChannel))
        quality_issues_count = session.scalar(select(func.count()).select_from(DataQualityIssue))
        transform_run = session.scalar(
            select(IngestionRun).where(IngestionRun.id == result.transform_run_id)
        )
        first_stg = session.scalar(select(StagingOrder).where(StagingOrder.source_record_id == "order-100"))

    assert stg_count == 3
    assert fact_count == 3
    assert product_count == 3
    assert customer_count == 3
    assert region_count == 3
    assert channel_count == 3
    assert quality_issues_count == 0
    assert transform_run is not None
    assert transform_run.job_name == "transform_orders"
    assert transform_run.status == "success"
    assert first_stg is not None
    assert first_stg.category == "home"
    assert first_stg.region == "southeast"
    assert first_stg.channel == "online"


def test_transform_raw_orders_rejects_invalid_rows_and_logs_quality_issues(tmp_path: Path) -> None:
    csv_path = tmp_path / "invalid_orders.csv"
    csv_path.write_text(
        "\n".join(
            [
                "source_record_id,order_date,customer_id,product_id,product_name,category,region,channel,quantity,unit_price,total_amount",
                "order-200,2026-05-01,cust-200,prod-200,Monitor,electronics,southeast,online,1,899.90,899.90",
                "order-201,2026-14-01,cust-201,prod-201,Lamp,home,south,online,1,50.00,50.00",
                "order-202,2026-05-03,cust-202,prod-202,Snack Box,food,midwest,marketplace,-2,30.00,60.00",
                "order-203,2026-05-04,cust-203,prod-203,Consulting,,north,partner,1,400.00,400.00",
            ]
        ),
        encoding="utf-8",
    )

    ingestion_result = ingest_csv_file(csv_path, source_name="invalid_orders.csv")
    result = transform_raw_orders(source_run_id=ingestion_result.run_id)

    assert result.status == "partial"
    assert result.records_read == 4
    assert result.records_inserted == 1
    assert result.records_rejected == 3

    with SessionLocal() as session:
        stg_count = session.scalar(select(func.count()).select_from(StagingOrder))
        fact_count = session.scalar(select(func.count()).select_from(FactOrder))
        issues = session.scalars(
            select(DataQualityIssue)
            .where(DataQualityIssue.ingestion_run_id == result.transform_run_id)
            .order_by(DataQualityIssue.issue_type.asc(), DataQualityIssue.field_name.asc())
        ).all()

    assert stg_count == 1
    assert fact_count == 1
    assert len(issues) == 3
    assert {issue.issue_type for issue in issues} == {
        "invalid_date",
        "negative_value",
        "missing_field",
    }
