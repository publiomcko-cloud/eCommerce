import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class RawOrder(Base):
    __tablename__ = "raw_orders"
    __table_args__ = (
        Index("ix_raw_orders_row_hash", "row_hash", unique=True),
        Index("ix_raw_orders_ingestion_run_id", "ingestion_run_id"),
        Index("ix_raw_orders_source_record_id", "source_record_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_record_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_name: Mapped[str] = mapped_column(String(100), nullable=False)
    order_date_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    customer_id_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    product_id_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    product_name_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    category_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    region_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    channel_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    quantity_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    unit_price_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    ingestion_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ingestion_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    row_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )
