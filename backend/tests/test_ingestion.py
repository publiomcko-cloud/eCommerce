from pathlib import Path

from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models.data_quality_issue import DataQualityIssue
from app.models.ingestion_run import IngestionRun
from app.models.raw_order import RawOrder
from app.services.ingestion_service import (
    build_row_hash,
    ingest_csv_file,
    map_csv_row_to_raw_fields,
)


def test_row_hash_is_stable_after_trimming_values() -> None:
    row_a = {
        "source_record_id": " order-001 ",
        "order_date": "2026-01-05 ",
        "customer_id": " cust-1",
        "product_id": "prod-1 ",
        "product_name": " Wireless Mouse ",
        "category": " electronics ",
        "region": " southeast ",
        "channel": "online ",
        "quantity": " 2 ",
        "unit_price": " 120.00",
        "total_amount": "240.00 ",
    }
    row_b = {
        "source_record_id": "order-001",
        "order_date": "2026-01-05",
        "customer_id": "cust-1",
        "product_id": "prod-1",
        "product_name": "Wireless Mouse",
        "category": "electronics",
        "region": "southeast",
        "channel": "online",
        "quantity": "2",
        "unit_price": "120.00",
        "total_amount": "240.00",
    }

    assert build_row_hash(map_csv_row_to_raw_fields(row_a)) == build_row_hash(
        map_csv_row_to_raw_fields(row_b)
    )


def test_ingest_csv_inserts_raw_rows_and_records_run(tmp_path: Path) -> None:
    csv_path = tmp_path / "orders.csv"
    csv_path.write_text(
        "\n".join(
            [
                "source_record_id,order_date,customer_id,product_id,product_name,category,region,channel,quantity,unit_price,total_amount",
                "order-001,2026-01-05,cust-001,prod-001,Wireless Mouse,electronics,southeast,online,2,120.00,240.00",
                "order-002,2026-01-06,cust-002,prod-002,Desk Lamp,home,south,marketplace,1,85.50,85.50",
            ]
        ),
        encoding="utf-8",
    )

    result = ingest_csv_file(csv_path, source_name="test_orders.csv")

    assert result.status == "success"
    assert result.records_read == 2
    assert result.records_inserted == 2
    assert result.records_rejected == 0

    with SessionLocal() as session:
        run = session.scalar(select(IngestionRun).where(IngestionRun.id == result.run_id))
        raw_count = session.scalar(select(func.count()).select_from(RawOrder))

    assert run is not None
    assert run.source_name == "test_orders.csv"
    assert run.status == "success"
    assert run.records_read == 2
    assert run.records_inserted == 2
    assert run.records_rejected == 0
    assert raw_count == 2


def test_ingest_csv_rejects_duplicate_rows_and_creates_quality_issue(tmp_path: Path) -> None:
    csv_path = tmp_path / "orders_with_duplicate.csv"
    csv_path.write_text(
        "\n".join(
            [
                "source_record_id,order_date,customer_id,product_id,product_name,category,region,channel,quantity,unit_price,total_amount",
                "order-010,2026-02-10,cust-010,prod-010,Coffee Maker,home,southeast,online,1,310.00,310.00",
                "order-010,2026-02-10,cust-010,prod-010,Coffee Maker,home,southeast,online,1,310.00,310.00",
            ]
        ),
        encoding="utf-8",
    )

    result = ingest_csv_file(csv_path)

    assert result.status == "partial"
    assert result.records_read == 2
    assert result.records_inserted == 1
    assert result.records_rejected == 1

    with SessionLocal() as session:
        run = session.scalar(select(IngestionRun).where(IngestionRun.id == result.run_id))
        raw_count = session.scalar(select(func.count()).select_from(RawOrder))
        issue = session.scalar(select(DataQualityIssue))

    assert run is not None
    assert run.status == "partial"
    assert run.records_inserted == 1
    assert run.records_rejected == 1
    assert raw_count == 1
    assert issue is not None
    assert issue.issue_type == "duplicate_record"
