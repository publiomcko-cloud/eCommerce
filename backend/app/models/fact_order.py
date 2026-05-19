import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class FactOrder(Base):
    __tablename__ = "fact_orders"
    __table_args__ = (
        Index("ix_fact_orders_order_date", "order_date"),
        Index("ix_fact_orders_product_id", "product_id"),
        Index("ix_fact_orders_customer_id", "customer_id"),
        Index("ix_fact_orders_region_id", "region_id"),
        Index("ix_fact_orders_channel_id", "channel_id"),
        Index("ix_fact_orders_order_date_region_id", "order_date", "region_id"),
        Index("ix_fact_orders_order_date_channel_id", "order_date", "channel_id"),
        Index("ix_fact_orders_order_date_product_id", "order_date", "product_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dim_products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dim_customers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    region_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dim_regions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    channel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dim_channels.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    source_record_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )
