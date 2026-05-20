import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommerceProductVariant(Base):
    __tablename__ = "commerce_product_variants"
    __table_args__ = (
        CheckConstraint(
            "status in ('active', 'inactive', 'archived')",
            name="ck_commerce_product_variants_status",
        ),
        CheckConstraint("price is null or price >= 0", name="ck_commerce_product_variants_price_non_negative"),
        CheckConstraint(
            "weight_grams is null or weight_grams >= 0",
            name="ck_commerce_product_variants_weight_non_negative",
        ),
        Index("ix_commerce_product_variants_product_id", "product_id"),
        Index("ix_commerce_product_variants_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_products.id", ondelete="CASCADE"),
        nullable=False,
    )
    sku: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    attributes: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
    price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    weight_grams: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
