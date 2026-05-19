import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class StagingOrder(Base):
    __tablename__ = "stg_orders"
    __table_args__ = (
        Index("ix_stg_orders_order_date", "order_date"),
        Index("ix_stg_orders_category", "category"),
        Index("ix_stg_orders_region", "region"),
        Index("ix_stg_orders_channel", "channel"),
        Index("ix_stg_orders_ingestion_run_id", "ingestion_run_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_record_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    customer_external_id: Mapped[str] = mapped_column(String(100), nullable=False)
    product_external_id: Mapped[str] = mapped_column(String(100), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    channel: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    ingestion_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ingestion_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )
