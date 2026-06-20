import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommerceRefund(Base):
    __tablename__ = "commerce_refunds"
    __table_args__ = (
        CheckConstraint(
            "status in ('pending', 'succeeded', 'failed')",
            name="ck_commerce_refunds_status",
        ),
        CheckConstraint("amount > 0", name="ck_commerce_refunds_amount_positive"),
        Index("ix_commerce_refunds_order_id", "order_id"),
        Index("ix_commerce_refunds_payment_id", "payment_id"),
        Index("ix_commerce_refunds_status", "status"),
        Index("ix_commerce_refunds_provider_refund_id", "provider_refund_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    payment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_payments.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider_refund_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="succeeded", server_default="succeeded")
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )
