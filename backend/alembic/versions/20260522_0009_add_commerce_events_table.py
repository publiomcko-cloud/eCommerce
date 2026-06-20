"""add commerce events table

Revision ID: 20260522_0009
Revises: 20260522_0008
Create Date: 2026-05-22 00:09:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260522_0009"
down_revision: Union[str, None] = "20260522_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "commerce_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("cart_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("checkout_session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("refund_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("shipment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["commerce_users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["cart_id"], ["commerce_carts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["checkout_session_id"], ["commerce_checkout_sessions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["customer_id"], ["commerce_customers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["order_id"], ["commerce_orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["payment_id"], ["commerce_payments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["commerce_products.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["refund_id"], ["commerce_refunds.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["shipment_id"], ["commerce_shipments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_commerce_events_cart_id", "commerce_events", ["cart_id"])
    op.create_index("ix_commerce_events_created_at", "commerce_events", ["created_at"])
    op.create_index("ix_commerce_events_event_type", "commerce_events", ["event_type"])
    op.create_index("ix_commerce_events_order_id", "commerce_events", ["order_id"])
    op.create_index("ix_commerce_events_product_id", "commerce_events", ["product_id"])


def downgrade() -> None:
    op.drop_index("ix_commerce_events_product_id", table_name="commerce_events")
    op.drop_index("ix_commerce_events_order_id", table_name="commerce_events")
    op.drop_index("ix_commerce_events_event_type", table_name="commerce_events")
    op.drop_index("ix_commerce_events_created_at", table_name="commerce_events")
    op.drop_index("ix_commerce_events_cart_id", table_name="commerce_events")
    op.drop_table("commerce_events")
