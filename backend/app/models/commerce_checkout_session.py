import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommerceCheckoutSession(Base):
    __tablename__ = "commerce_checkout_sessions"
    __table_args__ = (
        CheckConstraint(
            "status in ('open', 'converted', 'expired')",
            name="ck_commerce_checkout_sessions_status",
        ),
        Index("ix_commerce_checkout_sessions_cart_id", "cart_id"),
        Index("ix_commerce_checkout_sessions_customer_id", "customer_id"),
        Index("ix_commerce_checkout_sessions_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_carts.id", ondelete="CASCADE"),
        nullable=False,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_customers.id", ondelete="CASCADE"),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="open", server_default="open")
    shipping_address_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    billing_address_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    totals_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
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
