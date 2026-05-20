import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommerceInventoryMovement(Base):
    __tablename__ = "commerce_inventory_movements"
    __table_args__ = (
        CheckConstraint(
            "movement_type in ('adjustment', 'reservation', 'release', 'sale', 'return')",
            name="ck_commerce_inventory_movements_movement_type",
        ),
        Index("ix_commerce_inventory_movements_variant_id", "variant_id"),
        Index("ix_commerce_inventory_movements_created_by_user_id", "created_by_user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce_product_variants.id", ondelete="CASCADE"),
        nullable=False,
    )
    movement_type: Mapped[str] = mapped_column(String(40), nullable=False)
    quantity_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    reference_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    reference_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
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
