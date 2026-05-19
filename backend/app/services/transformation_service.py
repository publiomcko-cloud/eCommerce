from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from typing import Callable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.data_quality_issue import DataQualityIssue
from app.models.dim_channel import DimChannel
from app.models.dim_customer import DimCustomer
from app.models.dim_product import DimProduct
from app.models.dim_region import DimRegion
from app.models.fact_order import FactOrder
from app.models.ingestion_run import IngestionRun
from app.models.raw_order import RawOrder
from app.models.staging_order import StagingOrder

SessionFactory = Callable[[], Session]
MONEY_QUANTIZER = Decimal("0.01")
REQUIRED_RAW_FIELDS = (
    "source_record_id",
    "order_date_raw",
    "customer_id_raw",
    "product_id_raw",
    "product_name_raw",
    "category_raw",
    "region_raw",
    "channel_raw",
    "quantity_raw",
    "unit_price_raw",
)


class TransformationValidationError(ValueError):
    def __init__(
        self,
        issue_type: str,
        field_name: str,
        message: str,
        original_value: str | None = None,
    ) -> None:
        super().__init__(message)
        self.issue_type = issue_type
        self.field_name = field_name
        self.message = message
        self.original_value = original_value


@dataclass(slots=True)
class TransformationResult:
    transform_run_id: str
    source_run_id: str
    status: str
    source_name: str
    records_read: int
    records_inserted: int
    records_rejected: int


def current_utc_timestamp() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def normalize_dimension_value(value: str) -> str:
    normalized = "_".join(value.strip().lower().split())
    if not normalized:
        raise TransformationValidationError(
            issue_type="missing_field",
            field_name="normalized_value",
            message="Normalized dimension value cannot be empty.",
            original_value=value,
        )
    return normalized


def normalize_product_name(value: str) -> str:
    normalized = " ".join(value.strip().split())
    if not normalized:
        raise TransformationValidationError(
            issue_type="missing_field",
            field_name="product_name_raw",
            message="Product name cannot be empty after normalization.",
            original_value=value,
        )
    return normalized


def parse_order_date(value: str) -> date:
    try:
        return date.fromisoformat(value.strip())
    except ValueError as exc:
        raise TransformationValidationError(
            issue_type="invalid_date",
            field_name="order_date_raw",
            message="Order date must be in ISO format YYYY-MM-DD.",
            original_value=value,
        ) from exc


def parse_positive_int(value: str, field_name: str) -> int:
    try:
        parsed = int(value.strip())
    except ValueError as exc:
        raise TransformationValidationError(
            issue_type="invalid_number",
            field_name=field_name,
            message=f"{field_name} must be a valid integer.",
            original_value=value,
        ) from exc

    if parsed <= 0:
        raise TransformationValidationError(
            issue_type="negative_value",
            field_name=field_name,
            message=f"{field_name} must be greater than zero.",
            original_value=value,
        )
    return parsed


def parse_non_negative_decimal(value: str, field_name: str) -> Decimal:
    try:
        parsed = Decimal(value.strip()).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError) as exc:
        raise TransformationValidationError(
            issue_type="invalid_number",
            field_name=field_name,
            message=f"{field_name} must be a valid decimal number.",
            original_value=value,
        ) from exc

    if parsed < 0:
        raise TransformationValidationError(
            issue_type="negative_value",
            field_name=field_name,
            message=f"{field_name} must be non-negative.",
            original_value=value,
        )
    return parsed


def calculate_total_amount(
    quantity: int,
    unit_price: Decimal,
    total_amount_raw: str | None,
) -> Decimal:
    if total_amount_raw is None:
        return (Decimal(quantity) * unit_price).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)
    return parse_non_negative_decimal(total_amount_raw, "total_amount_raw")


def validate_required_raw_fields(raw_order: RawOrder) -> None:
    for field_name in REQUIRED_RAW_FIELDS:
        if getattr(raw_order, field_name) is None:
            raise TransformationValidationError(
                issue_type="missing_field",
                field_name=field_name,
                message=f"{field_name} is required for transformation.",
                original_value=None,
            )


def resolve_source_run(session: Session, source_run_id: str | None) -> IngestionRun:
    if source_run_id is not None:
        source_run = session.get(IngestionRun, source_run_id)
        if source_run is None:
            raise ValueError(f"Source ingestion run not found: {source_run_id}")
        return source_run

    source_run = session.scalar(
        select(IngestionRun)
        .where(IngestionRun.job_name == "ingest_orders")
        .where(
            IngestionRun.id.in_(
                select(RawOrder.ingestion_run_id)
                .group_by(RawOrder.ingestion_run_id)
                .having(func.count(RawOrder.id) > 0)
            )
        )
        .order_by(IngestionRun.started_at.desc(), IngestionRun.created_at.desc())
    )
    if source_run is None:
        raise ValueError("No ingestion run with raw records is available for transformation.")
    return source_run


def get_or_create_product(
    session: Session,
    cache: dict[str, DimProduct],
    product_external_id: str,
    product_name: str,
    category: str,
) -> DimProduct:
    product = cache.get(product_external_id)
    if product is None:
        product = session.scalar(
            select(DimProduct).where(DimProduct.product_external_id == product_external_id)
        )
    if product is None:
        product = DimProduct(
            product_external_id=product_external_id,
            product_name=product_name,
            category=category,
        )
        session.add(product)
        session.flush()
    else:
        product.product_name = product_name
        product.category = category
        session.flush()

    cache[product_external_id] = product
    return product


def get_or_create_customer(
    session: Session,
    cache: dict[str, DimCustomer],
    customer_external_id: str,
    region: str,
) -> DimCustomer:
    customer = cache.get(customer_external_id)
    if customer is None:
        customer = session.scalar(
            select(DimCustomer).where(DimCustomer.customer_external_id == customer_external_id)
        )
    if customer is None:
        customer = DimCustomer(
            customer_external_id=customer_external_id,
            region=region,
        )
        session.add(customer)
        session.flush()
    else:
        customer.region = region
        session.flush()

    cache[customer_external_id] = customer
    return customer


def get_or_create_region(
    session: Session,
    cache: dict[str, DimRegion],
    region_name: str,
) -> DimRegion:
    region = cache.get(region_name)
    if region is None:
        region = session.scalar(select(DimRegion).where(DimRegion.region_name == region_name))
    if region is None:
        region = DimRegion(region_name=region_name)
        session.add(region)
        session.flush()

    cache[region_name] = region
    return region


def get_or_create_channel(
    session: Session,
    cache: dict[str, DimChannel],
    channel_name: str,
) -> DimChannel:
    channel = cache.get(channel_name)
    if channel is None:
        channel = session.scalar(select(DimChannel).where(DimChannel.channel_name == channel_name))
    if channel is None:
        channel = DimChannel(channel_name=channel_name)
        session.add(channel)
        session.flush()

    cache[channel_name] = channel
    return channel


def create_quality_issue_for_raw_order(
    session: Session,
    *,
    transform_run_id: str,
    raw_order: RawOrder,
    issue_type: str,
    field_name: str,
    message: str,
    original_value: str | None,
) -> None:
    session.add(
        DataQualityIssue(
            ingestion_run_id=transform_run_id,
            source_record_id=raw_order.source_record_id,
            issue_type=issue_type,
            field_name=field_name,
            original_value=original_value,
            message=message,
        )
    )


def transform_raw_orders(
    *,
    source_run_id: str | None = None,
    job_name: str = "transform_orders",
    session_factory: SessionFactory = SessionLocal,
) -> TransformationResult:
    with session_factory() as session:
        source_run = resolve_source_run(session, source_run_id)
        transform_run = IngestionRun(
            job_name=job_name,
            source_name=source_run.source_name,
            status="running",
            started_at=current_utc_timestamp(),
            records_read=0,
            records_inserted=0,
            records_rejected=0,
        )
        session.add(transform_run)
        session.commit()
        session.refresh(transform_run)
        transform_run_id = transform_run.id
        source_run_id_value = source_run.id
        source_name = source_run.source_name

    records_read = 0
    records_inserted = 0
    records_rejected = 0

    try:
        with session_factory() as session:
            transform_run = session.get(IngestionRun, transform_run_id)
            if transform_run is None:
                raise RuntimeError("Transformation run record was not found after creation.")

            raw_orders = session.scalars(
                select(RawOrder)
                .where(RawOrder.ingestion_run_id == source_run_id_value)
                .order_by(RawOrder.created_at.asc(), RawOrder.id.asc())
            ).all()

            product_cache: dict[str, DimProduct] = {}
            customer_cache: dict[str, DimCustomer] = {}
            region_cache: dict[str, DimRegion] = {}
            channel_cache: dict[str, DimChannel] = {}

            for raw_order in raw_orders:
                records_read += 1

                try:
                    validate_required_raw_fields(raw_order)

                    if raw_order.source_record_id is not None:
                        existing_fact = session.scalar(
                            select(FactOrder.id).where(
                                FactOrder.source_record_id == raw_order.source_record_id
                            )
                        )
                        if existing_fact is not None:
                            raise TransformationValidationError(
                                issue_type="duplicate_record",
                                field_name="source_record_id",
                                message="Source record already exists in fact_orders.",
                                original_value=raw_order.source_record_id,
                            )

                    order_date = parse_order_date(raw_order.order_date_raw or "")
                    quantity = parse_positive_int(raw_order.quantity_raw or "", "quantity_raw")
                    unit_price = parse_non_negative_decimal(
                        raw_order.unit_price_raw or "",
                        "unit_price_raw",
                    )
                    total_amount = calculate_total_amount(
                        quantity,
                        unit_price,
                        raw_order.total_amount_raw,
                    )

                    product_name = normalize_product_name(raw_order.product_name_raw or "")
                    category = normalize_dimension_value(raw_order.category_raw or "")
                    region_name = normalize_dimension_value(raw_order.region_raw or "")
                    channel_name = normalize_dimension_value(raw_order.channel_raw or "")

                    stg_order = StagingOrder(
                        source_record_id=raw_order.source_record_id,
                        order_date=order_date,
                        customer_external_id=raw_order.customer_id_raw or "",
                        product_external_id=raw_order.product_id_raw or "",
                        product_name=product_name,
                        category=category,
                        region=region_name,
                        channel=channel_name,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_amount=total_amount,
                        ingestion_run_id=transform_run_id,
                    )
                    session.add(stg_order)
                    session.flush()

                    product = get_or_create_product(
                        session,
                        product_cache,
                        raw_order.product_id_raw or "",
                        product_name,
                        category,
                    )
                    customer = get_or_create_customer(
                        session,
                        customer_cache,
                        raw_order.customer_id_raw or "",
                        region_name,
                    )
                    region = get_or_create_region(session, region_cache, region_name)
                    channel = get_or_create_channel(session, channel_cache, channel_name)

                    fact_order = FactOrder(
                        order_date=order_date,
                        product_id=product.id,
                        customer_id=customer.id,
                        region_id=region.id,
                        channel_id=channel.id,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_amount=total_amount,
                        source_record_id=raw_order.source_record_id,
                    )
                    session.add(fact_order)
                    session.flush()
                    records_inserted += 1

                except TransformationValidationError as exc:
                    create_quality_issue_for_raw_order(
                        session,
                        transform_run_id=str(transform_run_id),
                        raw_order=raw_order,
                        issue_type=exc.issue_type,
                        field_name=exc.field_name,
                        message=exc.message,
                        original_value=exc.original_value,
                    )
                    session.flush()
                    records_rejected += 1

            transform_run.records_read = records_read
            transform_run.records_inserted = records_inserted
            transform_run.records_rejected = records_rejected
            transform_run.finished_at = current_utc_timestamp()
            transform_run.status = "partial" if records_rejected else "success"
            session.commit()

        return TransformationResult(
            transform_run_id=str(transform_run_id),
            source_run_id=str(source_run_id_value),
            status="partial" if records_rejected else "success",
            source_name=source_name,
            records_read=records_read,
            records_inserted=records_inserted,
            records_rejected=records_rejected,
        )

    except Exception as exc:
        with session_factory() as session:
            transform_run = session.get(IngestionRun, transform_run_id)
            if transform_run is not None:
                transform_run.records_read = records_read
                transform_run.records_inserted = records_inserted
                transform_run.records_rejected = records_rejected
                transform_run.finished_at = current_utc_timestamp()
                transform_run.status = "failed"
                transform_run.error_message = str(exc)
                session.commit()
        raise
