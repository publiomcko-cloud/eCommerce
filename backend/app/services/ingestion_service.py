from __future__ import annotations

import csv
import hashlib
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Callable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.data_quality_issue import DataQualityIssue
from app.models.ingestion_run import IngestionRun
from app.models.raw_order import RawOrder

SessionFactory = Callable[[], Session]

CSV_TO_RAW_FIELD_MAP = {
    "source_record_id": "source_record_id",
    "order_date": "order_date_raw",
    "customer_id": "customer_id_raw",
    "product_id": "product_id_raw",
    "product_name": "product_name_raw",
    "category": "category_raw",
    "region": "region_raw",
    "channel": "channel_raw",
    "quantity": "quantity_raw",
    "unit_price": "unit_price_raw",
    "total_amount": "total_amount_raw",
}

REQUIRED_COLUMNS = tuple(CSV_TO_RAW_FIELD_MAP.keys())
HASH_FIELD_ORDER = tuple(CSV_TO_RAW_FIELD_MAP.values())


@dataclass(slots=True)
class IngestionResult:
    run_id: str
    status: str
    source_name: str
    records_read: int
    records_inserted: int
    records_rejected: int
    csv_path: str


def current_utc_timestamp() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def normalize_raw_value(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    return normalized or None


def map_csv_row_to_raw_fields(row: dict[str, str | None]) -> dict[str, str | None]:
    return {
        raw_field: normalize_raw_value(row.get(csv_field))
        for csv_field, raw_field in CSV_TO_RAW_FIELD_MAP.items()
    }


def build_row_hash(raw_fields: dict[str, str | None]) -> str:
    canonical_payload = {field_name: raw_fields.get(field_name) for field_name in HASH_FIELD_ORDER}
    encoded_payload = json.dumps(
        canonical_payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
    ).encode("utf-8")
    return hashlib.sha256(encoded_payload).hexdigest()


def ingest_csv_file(
    csv_path: str | Path,
    *,
    source_name: str | None = None,
    job_name: str = "ingest_orders",
    session_factory: SessionFactory = SessionLocal,
) -> IngestionResult:
    resolved_path = Path(csv_path).resolve()
    if not resolved_path.exists():
        raise FileNotFoundError(f"CSV file not found: {resolved_path}")

    source_label = source_name or resolved_path.name

    with session_factory() as session:
        ingestion_run = IngestionRun(
            job_name=job_name,
            source_name=source_label,
            status="running",
            started_at=current_utc_timestamp(),
            records_read=0,
            records_inserted=0,
            records_rejected=0,
        )
        session.add(ingestion_run)
        session.commit()
        session.refresh(ingestion_run)
        run_id = ingestion_run.id

    records_read = 0
    records_inserted = 0
    records_rejected = 0

    try:
        with session_factory() as session:
            ingestion_run = session.get(IngestionRun, run_id)
            if ingestion_run is None:
                raise RuntimeError("Ingestion run record was not found after creation.")

            with resolved_path.open("r", encoding="utf-8", newline="") as csv_file:
                reader = csv.DictReader(csv_file)
                fieldnames = reader.fieldnames or []
                missing_columns = [column for column in REQUIRED_COLUMNS if column not in fieldnames]
                if missing_columns:
                    raise ValueError(
                        "CSV file is missing required columns: "
                        + ", ".join(sorted(missing_columns))
                    )

                for row in reader:
                    records_read += 1
                    raw_fields = map_csv_row_to_raw_fields(row)
                    row_hash = build_row_hash(raw_fields)

                    duplicate_exists = session.scalar(
                        select(RawOrder.id).where(RawOrder.row_hash == row_hash)
                    )
                    if duplicate_exists is not None:
                        session.add(
                            DataQualityIssue(
                                ingestion_run_id=run_id,
                                source_record_id=raw_fields.get("source_record_id"),
                                issue_type="duplicate_record",
                                field_name="row_hash",
                                original_value=row_hash,
                                message="Duplicate raw row detected during ingestion.",
                            )
                        )
                        records_rejected += 1
                        continue

                    raw_order = RawOrder(
                        source_record_id=raw_fields.get("source_record_id"),
                        source_name=source_label,
                        order_date_raw=raw_fields.get("order_date_raw"),
                        customer_id_raw=raw_fields.get("customer_id_raw"),
                        product_id_raw=raw_fields.get("product_id_raw"),
                        product_name_raw=raw_fields.get("product_name_raw"),
                        category_raw=raw_fields.get("category_raw"),
                        region_raw=raw_fields.get("region_raw"),
                        channel_raw=raw_fields.get("channel_raw"),
                        quantity_raw=raw_fields.get("quantity_raw"),
                        unit_price_raw=raw_fields.get("unit_price_raw"),
                        total_amount_raw=raw_fields.get("total_amount_raw"),
                        ingestion_run_id=run_id,
                        row_hash=row_hash,
                    )
                    session.add(raw_order)
                    session.flush()
                    records_inserted += 1

            ingestion_run.records_read = records_read
            ingestion_run.records_inserted = records_inserted
            ingestion_run.records_rejected = records_rejected
            ingestion_run.finished_at = current_utc_timestamp()
            ingestion_run.status = "partial" if records_rejected else "success"
            session.commit()

        return IngestionResult(
            run_id=str(run_id),
            status="partial" if records_rejected else "success",
            source_name=source_label,
            records_read=records_read,
            records_inserted=records_inserted,
            records_rejected=records_rejected,
            csv_path=str(resolved_path),
        )

    except Exception as exc:
        with session_factory() as session:
            ingestion_run = session.get(IngestionRun, run_id)
            if ingestion_run is not None:
                ingestion_run.records_read = records_read
                ingestion_run.records_inserted = records_inserted
                ingestion_run.records_rejected = records_rejected
                ingestion_run.finished_at = current_utc_timestamp()
                ingestion_run.status = "failed"
                ingestion_run.error_message = str(exc)
                session.commit()
        raise
