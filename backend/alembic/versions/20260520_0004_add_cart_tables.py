"""add cart tables

Revision ID: 20260520_0004
Revises: 20260520_0003
Create Date: 2026-05-20 00:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260520_0004"
down_revision: Union[str, Sequence[str], None] = "20260520_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "commerce_carts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("anonymous_token", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="active"),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="BRL"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "status in ('active', 'converted', 'abandoned', 'merged')",
            name="ck_commerce_carts_status",
        ),
        sa.ForeignKeyConstraint(["customer_id"], ["commerce_customers.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("anonymous_token", name="uq_commerce_carts_anonymous_token"),
    )
    op.create_index("ix_commerce_carts_anonymous_token", "commerce_carts", ["anonymous_token"])
    op.create_index("ix_commerce_carts_customer_id", "commerce_carts", ["customer_id"])
    op.create_index("ix_commerce_carts_status", "commerce_carts", ["status"])

    op.create_table(
        "commerce_cart_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("cart_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("quantity >= 1", name="ck_commerce_cart_items_quantity_positive"),
        sa.ForeignKeyConstraint(["cart_id"], ["commerce_carts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["variant_id"], ["commerce_product_variants.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("cart_id", "variant_id", name="uq_commerce_cart_items_cart_variant"),
    )
    op.create_index("ix_commerce_cart_items_cart_id", "commerce_cart_items", ["cart_id"])
    op.create_index("ix_commerce_cart_items_variant_id", "commerce_cart_items", ["variant_id"])


def downgrade() -> None:
    op.drop_index("ix_commerce_cart_items_variant_id", table_name="commerce_cart_items")
    op.drop_index("ix_commerce_cart_items_cart_id", table_name="commerce_cart_items")
    op.drop_table("commerce_cart_items")

    op.drop_index("ix_commerce_carts_status", table_name="commerce_carts")
    op.drop_index("ix_commerce_carts_customer_id", table_name="commerce_carts")
    op.drop_index("ix_commerce_carts_anonymous_token", table_name="commerce_carts")
    op.drop_table("commerce_carts")
