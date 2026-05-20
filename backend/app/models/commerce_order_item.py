import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommerceOrderItem(Base):
    __tablename__ = "commerce_order_items"
    __table_args__ = (
        CheckConstraint("quantity >= 1", name="ck_commerce_order_items_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="ck_commerce_order_items_unit_price_non_negative"),
        CheckConstraint("line_total >= 0", name="ck_commerce_order_items_line_total_non_negative"),
        Index("ix_commerce_order_items_order_id", "order_id"),
        Index("ix_commerce_order_items_variant_id", "variant_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_slug: Mapped[str] = mapped_column(String(280), nullable=False)
    variant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    attributes_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )
