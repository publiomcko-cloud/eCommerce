"""add checkout and order tables

Revision ID: 20260520_0005
Revises: 20260520_0004
Create Date: 2026-05-20 01:15:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260520_0005"
down_revision: Union[str, Sequence[str], None] = "20260520_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "commerce_checkout_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("cart_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="open"),
        sa.Column("shipping_address_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("billing_address_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("totals_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "status in ('open', 'converted', 'expired')",
            name="ck_commerce_checkout_sessions_status",
        ),
        sa.ForeignKeyConstraint(["cart_id"], ["commerce_carts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["commerce_customers.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_commerce_checkout_sessions_cart_id", "commerce_checkout_sessions", ["cart_id"])
    op.create_index("ix_commerce_checkout_sessions_customer_id", "commerce_checkout_sessions", ["customer_id"])
    op.create_index("ix_commerce_checkout_sessions_status", "commerce_checkout_sessions", ["status"])

    op.create_table(
        "commerce_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("checkout_session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cart_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_number", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending_payment"),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("subtotal_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("shipping_address_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("billing_address_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("totals_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("idempotency_key", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "status in ('pending_payment', 'paid', 'cancelled', 'fulfilled')",
            name="ck_commerce_orders_status",
        ),
        sa.CheckConstraint("subtotal_amount >= 0", name="ck_commerce_orders_subtotal_non_negative"),
        sa.CheckConstraint("total_amount >= 0", name="ck_commerce_orders_total_non_negative"),
        sa.ForeignKeyConstraint(["checkout_session_id"], ["commerce_checkout_sessions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["cart_id"], ["commerce_carts.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["customer_id"], ["commerce_customers.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("checkout_session_id", name="uq_commerce_orders_checkout_session_id"),
        sa.UniqueConstraint("order_number", name="uq_commerce_orders_order_number"),
        sa.UniqueConstraint("idempotency_key", name="uq_commerce_orders_idempotency_key"),
    )
    op.create_index("ix_commerce_orders_customer_id", "commerce_orders", ["customer_id"])
    op.create_index("ix_commerce_orders_checkout_session_id", "commerce_orders", ["checkout_session_id"])
    op.create_index("ix_commerce_orders_cart_id", "commerce_orders", ["cart_id"])
    op.create_index("ix_commerce_orders_status", "commerce_orders", ["status"])
    op.create_index("ix_commerce_orders_order_number", "commerce_orders", ["order_number"])
    op.create_index("ix_commerce_orders_idempotency_key", "commerce_orders", ["idempotency_key"])

    op.create_table(
        "commerce_order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("product_slug", sa.String(length=280), nullable=False),
        sa.Column("variant_name", sa.String(length=255), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=False),
        sa.Column("attributes_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("quantity >= 1", name="ck_commerce_order_items_quantity_positive"),
        sa.CheckConstraint("unit_price >= 0", name="ck_commerce_order_items_unit_price_non_negative"),
        sa.CheckConstraint("line_total >= 0", name="ck_commerce_order_items_line_total_non_negative"),
        sa.ForeignKeyConstraint(["order_id"], ["commerce_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["variant_id"], ["commerce_product_variants.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_commerce_order_items_order_id", "commerce_order_items", ["order_id"])
    op.create_index("ix_commerce_order_items_variant_id", "commerce_order_items", ["variant_id"])

    op.create_table(
        "commerce_order_status_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("from_status", sa.String(length=30), nullable=True),
        sa.Column("to_status", sa.String(length=30), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "to_status in ('pending_payment', 'paid', 'cancelled', 'fulfilled')",
            name="ck_commerce_order_status_history_to_status",
        ),
        sa.ForeignKeyConstraint(["order_id"], ["commerce_orders.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_commerce_order_status_history_order_id", "commerce_order_status_history", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_commerce_order_status_history_order_id", table_name="commerce_order_status_history")
    op.drop_table("commerce_order_status_history")

    op.drop_index("ix_commerce_order_items_variant_id", table_name="commerce_order_items")
    op.drop_index("ix_commerce_order_items_order_id", table_name="commerce_order_items")
    op.drop_table("commerce_order_items")

    op.drop_index("ix_commerce_orders_idempotency_key", table_name="commerce_orders")
    op.drop_index("ix_commerce_orders_order_number", table_name="commerce_orders")
    op.drop_index("ix_commerce_orders_status", table_name="commerce_orders")
    op.drop_index("ix_commerce_orders_cart_id", table_name="commerce_orders")
    op.drop_index("ix_commerce_orders_checkout_session_id", table_name="commerce_orders")
    op.drop_index("ix_commerce_orders_customer_id", table_name="commerce_orders")
    op.drop_table("commerce_orders")

    op.drop_index("ix_commerce_checkout_sessions_status", table_name="commerce_checkout_sessions")
    op.drop_index("ix_commerce_checkout_sessions_customer_id", table_name="commerce_checkout_sessions")
    op.drop_index("ix_commerce_checkout_sessions_cart_id", table_name="commerce_checkout_sessions")
    op.drop_table("commerce_checkout_sessions")
