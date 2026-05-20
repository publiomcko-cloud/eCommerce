"""add payment table

Revision ID: 20260520_0006
Revises: 20260520_0005
Create Date: 2026-05-20 02:05:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260520_0006"
down_revision: Union[str, Sequence[str], None] = "20260520_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "commerce_payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider_name", sa.String(length=40), nullable=False, server_default="mock"),
        sa.Column("provider_payment_id", sa.String(length=120), nullable=False),
        sa.Column("provider_session_token", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending"),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("provider_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("processed_webhook_event_id", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint(
            "provider_name in ('mock')",
            name="ck_commerce_payments_provider_name",
        ),
        sa.CheckConstraint(
            "status in ('pending', 'succeeded', 'failed')",
            name="ck_commerce_payments_status",
        ),
        sa.CheckConstraint("amount >= 0", name="ck_commerce_payments_amount_non_negative"),
        sa.ForeignKeyConstraint(["order_id"], ["commerce_orders.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("order_id", name="uq_commerce_payments_order_id"),
        sa.UniqueConstraint("provider_payment_id", name="uq_commerce_payments_provider_payment_id"),
        sa.UniqueConstraint("provider_session_token", name="uq_commerce_payments_provider_session_token"),
        sa.UniqueConstraint("processed_webhook_event_id", name="uq_commerce_payments_processed_webhook_event_id"),
    )
    op.create_index("ix_commerce_payments_order_id", "commerce_payments", ["order_id"])
    op.create_index("ix_commerce_payments_status", "commerce_payments", ["status"])
    op.create_index("ix_commerce_payments_provider_name", "commerce_payments", ["provider_name"])
    op.create_index("ix_commerce_payments_provider_payment_id", "commerce_payments", ["provider_payment_id"])
    op.create_index(
        "ix_commerce_payments_processed_webhook_event_id",
        "commerce_payments",
        ["processed_webhook_event_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_commerce_payments_processed_webhook_event_id",
        table_name="commerce_payments",
    )
    op.drop_index("ix_commerce_payments_provider_payment_id", table_name="commerce_payments")
    op.drop_index("ix_commerce_payments_provider_name", table_name="commerce_payments")
    op.drop_index("ix_commerce_payments_status", table_name="commerce_payments")
    op.drop_index("ix_commerce_payments_order_id", table_name="commerce_payments")
    op.drop_table("commerce_payments")
