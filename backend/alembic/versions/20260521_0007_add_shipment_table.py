"""add shipment table

Revision ID: 20260521_0007
Revises: 20260520_0006
Create Date: 2026-05-21 08:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260521_0007"
down_revision: Union[str, Sequence[str], None] = "20260520_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "commerce_shipments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("carrier", sa.String(length=120), nullable=True),
        sa.Column("service_level", sa.String(length=120), nullable=True),
        sa.Column("tracking_number", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "status in ('pending', 'packed', 'shipped', 'delivered')",
            name="ck_commerce_shipments_status",
        ),
        sa.ForeignKeyConstraint(["order_id"], ["commerce_orders.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("order_id", name="uq_commerce_shipments_order_id"),
    )
    op.create_index("ix_commerce_shipments_order_id", "commerce_shipments", ["order_id"])
    op.create_index("ix_commerce_shipments_status", "commerce_shipments", ["status"])


def downgrade() -> None:
    op.drop_index("ix_commerce_shipments_status", table_name="commerce_shipments")
    op.drop_index("ix_commerce_shipments_order_id", table_name="commerce_shipments")
    op.drop_table("commerce_shipments")
