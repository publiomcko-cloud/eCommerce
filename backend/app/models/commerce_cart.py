import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommerceCart(Base):
    __tablename__ = "commerce_carts"
    __table_args__ = (
        CheckConstraint(
            "status in ('active', 'converted', 'abandoned', 'merged')",
            name="ck_commerce_carts_status",
        ),
        Index("ix_commerce_carts_customer_id", "customer_id"),
        Index("ix_commerce_carts_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_customers.id", ondelete="CASCADE"),
        nullable=True,
    )
    anonymous_token: Mapped[str | None] = mapped_column(String(120), nullable=True, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active", server_default="active")
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="BRL", server_default="BRL")
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
