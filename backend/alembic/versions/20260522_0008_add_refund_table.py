"""add refund table

Revision ID: 20260522_0008
Revises: 20260521_0007
Create Date: 2026-05-22 00:08:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260522_0008"
down_revision: Union[str, None] = "20260521_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "commerce_refunds",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider_refund_id", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=30), server_default="succeeded", nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("amount > 0", name="ck_commerce_refunds_amount_positive"),
        sa.CheckConstraint("status in ('pending', 'succeeded', 'failed')", name="ck_commerce_refunds_status"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["commerce_users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["order_id"], ["commerce_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["payment_id"], ["commerce_payments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider_refund_id"),
    )
    op.create_index("ix_commerce_refunds_order_id", "commerce_refunds", ["order_id"])
    op.create_index("ix_commerce_refunds_payment_id", "commerce_refunds", ["payment_id"])
    op.create_index("ix_commerce_refunds_provider_refund_id", "commerce_refunds", ["provider_refund_id"])
    op.create_index("ix_commerce_refunds_status", "commerce_refunds", ["status"])


def downgrade() -> None:
    op.drop_index("ix_commerce_refunds_status", table_name="commerce_refunds")
    op.drop_index("ix_commerce_refunds_provider_refund_id", table_name="commerce_refunds")
    op.drop_index("ix_commerce_refunds_payment_id", table_name="commerce_refunds")
    op.drop_index("ix_commerce_refunds_order_id", table_name="commerce_refunds")
    op.drop_table("commerce_refunds")
