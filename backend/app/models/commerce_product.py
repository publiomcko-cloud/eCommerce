import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommerceProduct(Base):
    __tablename__ = "commerce_products"
    __table_args__ = (
        CheckConstraint(
            "status in ('draft', 'active', 'archived')",
            name="ck_commerce_products_status",
        ),
        CheckConstraint("base_price >= 0", name="ck_commerce_products_base_price_non_negative"),
        CheckConstraint(
            "compare_at_price is null or compare_at_price >= 0",
            name="ck_commerce_products_compare_at_price_non_negative",
        ),
        Index("ix_commerce_products_category_id", "category_id"),
        Index("ix_commerce_products_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(280), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="draft")
    brand: Mapped[str | None] = mapped_column(String(120), nullable=True)
    base_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    compare_at_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="BRL", server_default="BRL")
    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)
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
