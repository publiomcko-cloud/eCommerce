from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Callable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.data_quality_issue import DataQualityIssue
from app.models.ingestion_run import IngestionRun
from app.models.raw_order import RawOrder
from app.models.staging_order import StagingOrder
from app.schemas.ingestion import QualitySummary
from app.schemas.orders import CreateOrderRequest, CreateOrderResponse, OrderListItem
from app.services.ingestion_service import build_row_hash, normalize_raw_value
from app.services.ingestion_status_service import build_quality_summary
from app.services.transformation_service import transform_raw_orders

SessionFactory = Callable[[], Session]
MONEY_QUANTIZER = Decimal("0.01")


@dataclass(slots=True)
class ManualOrderEntryResult:
    source_record_id: str
    status: str
    ingestion_run_id: str
    transform_run_id: str | None
    message: str
    quality_summary: QualitySummary
    created_order: OrderListItem | None


def current_utc_timestamp() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def generate_source_record_id() -> str:
    return f"manual-order-{uuid.uuid4().hex[:12]}"


def format_decimal(value: float | Decimal) -> str:
    decimal_value = Decimal(str(value)).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)
    return format(decimal_value, ".2f")


def create_order_list_item(staging_order: StagingOrder) -> OrderListItem:
    return OrderListItem(
        source_record_id=staging_order.source_record_id,
        order_date=staging_order.order_date,
        product_name=staging_order.product_name,
        category=staging_order.category,
        region=staging_order.region,
        channel=staging_order.channel,
        quantity=staging_order.quantity,
        unit_price=float(staging_order.unit_price),
        total_amount=float(staging_order.total_amount),
    )


def submit_manual_order(
    payload: CreateOrderRequest,
    *,
    session_factory: SessionFactory = SessionLocal,
) -> ManualOrderEntryResult:
    source_record_id = normalize_raw_value(payload.source_record_id) or generate_source_record_id()
    source_name = "manual_order_form"

    raw_fields = {
        "source_record_id": source_record_id,
        "order_date_raw": payload.order_date.isoformat(),
        "customer_id_raw": payload.customer_id,
        "product_id_raw": payload.product_id,
        "product_name_raw": payload.product_name,
        "category_raw": payload.category,
        "region_raw": payload.region,
        "channel_raw": payload.channel,
        "quantity_raw": str(payload.quantity),
        "unit_price_raw": format_decimal(payload.unit_price),
        "total_amount_raw": (
            format_decimal(payload.total_amount) if payload.total_amount is not None else None
        ),
    }

    with session_factory() as session:
        ingestion_run = IngestionRun(
            job_name="manual_order_entry",
            source_name=source_name,
            status="running",
            started_at=current_utc_timestamp(),
            records_read=0,
            records_inserted=0,
            records_rejected=0,
        )
        session.add(ingestion_run)
        session.commit()
        session.refresh(ingestion_run)
        ingestion_run_id = ingestion_run.id

    row_hash = build_row_hash(raw_fields)

    with session_factory() as session:
        ingestion_run = session.get(IngestionRun, ingestion_run_id)
        if ingestion_run is None:
            raise RuntimeError("Manual order ingestion run was not found after creation.")

        duplicate_exists = session.scalar(select(RawOrder.id).where(RawOrder.row_hash == row_hash))
        if duplicate_exists is not None:
            session.add(
                DataQualityIssue(
                    ingestion_run_id=ingestion_run_id,
                    source_record_id=source_record_id,
                    issue_type="duplicate_record",
                    field_name="row_hash",
                    original_value=row_hash,
                    message="Duplicate raw row detected during manual order entry.",
                )
            )
            ingestion_run.records_read = 1
            ingestion_run.records_inserted = 0
            ingestion_run.records_rejected = 1
            ingestion_run.finished_at = current_utc_timestamp()
            ingestion_run.status = "partial"
            session.commit()
            quality_summary = build_quality_summary(session, str(ingestion_run_id))

            return ManualOrderEntryResult(
                source_record_id=source_record_id,
                status="partial",
                ingestion_run_id=str(ingestion_run_id),
                transform_run_id=None,
                message="The order was rejected because it duplicates an existing raw row.",
                quality_summary=quality_summary,
                created_order=None,
            )

        raw_order = RawOrder(
            source_record_id=source_record_id,
            source_name=source_name,
            order_date_raw=raw_fields["order_date_raw"],
            customer_id_raw=raw_fields["customer_id_raw"],
            product_id_raw=raw_fields["product_id_raw"],
            product_name_raw=raw_fields["product_name_raw"],
            category_raw=raw_fields["category_raw"],
            region_raw=raw_fields["region_raw"],
            channel_raw=raw_fields["channel_raw"],
            quantity_raw=raw_fields["quantity_raw"],
            unit_price_raw=raw_fields["unit_price_raw"],
            total_amount_raw=raw_fields["total_amount_raw"],
            ingestion_run_id=ingestion_run_id,
            row_hash=row_hash,
        )
        session.add(raw_order)
        session.flush()

        ingestion_run.records_read = 1
        ingestion_run.records_inserted = 1
        ingestion_run.records_rejected = 0
        ingestion_run.finished_at = current_utc_timestamp()
        ingestion_run.status = "success"
        session.commit()

    transformation_result = transform_raw_orders(source_run_id=str(ingestion_run_id))

    with session_factory() as session:
        quality_summary = build_quality_summary(session, transformation_result.transform_run_id)
        created_order = session.scalar(
            select(StagingOrder)
            .where(StagingOrder.ingestion_run_id == transformation_result.transform_run_id)
            .where(StagingOrder.source_record_id == source_record_id)
        )

    return ManualOrderEntryResult(
        source_record_id=source_record_id,
        status=transformation_result.status,
        ingestion_run_id=str(ingestion_run_id),
        transform_run_id=transformation_result.transform_run_id,
        message=(
            "Order submitted and transformed successfully."
            if created_order is not None
            else "Order was ingested but rejected during transformation."
        ),
        quality_summary=quality_summary,
        created_order=create_order_list_item(created_order) if created_order is not None else None,
    )


def serialize_manual_order_result(result: ManualOrderEntryResult) -> CreateOrderResponse:
    return CreateOrderResponse(
        source_record_id=result.source_record_id,
        status=result.status,
        ingestion_run_id=result.ingestion_run_id,
        transform_run_id=result.transform_run_id,
        message=result.message,
        quality_summary=result.quality_summary,
        created_order=result.created_order,
    )
