import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommerceOrder(Base):
    __tablename__ = "commerce_orders"
    __table_args__ = (
        CheckConstraint(
            "status in ('pending_payment', 'paid', 'cancelled', 'fulfilled')",
            name="ck_commerce_orders_status",
        ),
        CheckConstraint("subtotal_amount >= 0", name="ck_commerce_orders_subtotal_non_negative"),
        CheckConstraint("total_amount >= 0", name="ck_commerce_orders_total_non_negative"),
        Index("ix_commerce_orders_customer_id", "customer_id"),
        Index("ix_commerce_orders_checkout_session_id", "checkout_session_id"),
        Index("ix_commerce_orders_cart_id", "cart_id"),
        Index("ix_commerce_orders_status", "status"),
        Index("ix_commerce_orders_order_number", "order_number"),
        Index("ix_commerce_orders_idempotency_key", "idempotency_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    checkout_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_checkout_sessions.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
    )
    cart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_carts.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_customers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    order_number: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending_payment", server_default="pending_payment")
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    subtotal_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    shipping_address_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    billing_address_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    totals_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
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
