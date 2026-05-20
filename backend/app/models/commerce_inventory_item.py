import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommerceInventoryItem(Base):
    __tablename__ = "commerce_inventory_items"
    __table_args__ = (
        CheckConstraint("stock_on_hand >= 0", name="ck_commerce_inventory_items_stock_on_hand_non_negative"),
        CheckConstraint("stock_reserved >= 0", name="ck_commerce_inventory_items_stock_reserved_non_negative"),
        CheckConstraint("low_stock_threshold >= 0", name="ck_commerce_inventory_items_low_stock_threshold_non_negative"),
        Index("ix_commerce_inventory_items_variant_id", "variant_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_product_variants.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    stock_on_hand: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    stock_reserved: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=5, server_default="5")
    allow_backorder: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
