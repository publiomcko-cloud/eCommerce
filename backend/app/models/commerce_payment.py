import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommercePayment(Base):
    __tablename__ = "commerce_payments"
    __table_args__ = (
        CheckConstraint(
            "provider_name in ('mock')",
            name="ck_commerce_payments_provider_name",
        ),
        CheckConstraint(
            "status in ('pending', 'succeeded', 'failed')",
            name="ck_commerce_payments_status",
        ),
        CheckConstraint("amount >= 0", name="ck_commerce_payments_amount_non_negative"),
        Index("ix_commerce_payments_order_id", "order_id"),
        Index("ix_commerce_payments_status", "status"),
        Index("ix_commerce_payments_provider_name", "provider_name"),
        Index("ix_commerce_payments_provider_payment_id", "provider_payment_id"),
        Index("ix_commerce_payments_processed_webhook_event_id", "processed_webhook_event_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_orders.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    provider_name: Mapped[str] = mapped_column(String(40), nullable=False, default="mock", server_default="mock")
    provider_payment_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    provider_session_token: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending", server_default="pending")
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    provider_payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
    processed_webhook_event_id: Mapped[str | None] = mapped_column(String(120), nullable=True, unique=True)
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
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
