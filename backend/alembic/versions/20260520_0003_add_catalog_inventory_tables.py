"""add catalog inventory tables

Revision ID: 20260520_0003
Revises: 20260519_0002
Create Date: 2026-05-20 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260520_0003"
down_revision: Union[str, Sequence[str], None] = "20260519_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "commerce_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["parent_id"], ["commerce_categories.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("slug", name="uq_commerce_categories_slug"),
    )
    op.create_index("ix_commerce_categories_slug", "commerce_categories", ["slug"])
    op.create_index("ix_commerce_categories_parent_id", "commerce_categories", ["parent_id"])
    op.create_index("ix_commerce_categories_sort_order", "commerce_categories", ["sort_order"])

    op.create_table(
        "commerce_products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=280), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("brand", sa.String(length=120), nullable=True),
        sa.Column("base_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("compare_at_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="BRL"),
        sa.Column("seo_title", sa.String(length=255), nullable=True),
        sa.Column("seo_description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status in ('draft', 'active', 'archived')", name="ck_commerce_products_status"),
        sa.CheckConstraint("base_price >= 0", name="ck_commerce_products_base_price_non_negative"),
        sa.CheckConstraint(
            "compare_at_price is null or compare_at_price >= 0",
            name="ck_commerce_products_compare_at_price_non_negative",
        ),
        sa.ForeignKeyConstraint(["category_id"], ["commerce_categories.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("slug", name="uq_commerce_products_slug"),
    )
    op.create_index("ix_commerce_products_slug", "commerce_products", ["slug"])
    op.create_index("ix_commerce_products_category_id", "commerce_products", ["category_id"])
    op.create_index("ix_commerce_products_status", "commerce_products", ["status"])

    op.create_table(
        "commerce_product_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("alt_text", sa.String(length=255), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["product_id"], ["commerce_products.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_commerce_product_images_product_id", "commerce_product_images", ["product_id"])
    op.create_index("ix_commerce_product_images_sort_order", "commerce_product_images", ["sort_order"])

    op.create_table(
        "commerce_product_variants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("attributes", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("price", sa.Numeric(12, 2), nullable=True),
        sa.Column("weight_grams", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status in ('active', 'inactive', 'archived')", name="ck_commerce_product_variants_status"),
        sa.CheckConstraint("price is null or price >= 0", name="ck_commerce_product_variants_price_non_negative"),
        sa.CheckConstraint(
            "weight_grams is null or weight_grams >= 0",
            name="ck_commerce_product_variants_weight_non_negative",
        ),
        sa.ForeignKeyConstraint(["product_id"], ["commerce_products.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("sku", name="uq_commerce_product_variants_sku"),
    )
    op.create_index("ix_commerce_product_variants_sku", "commerce_product_variants", ["sku"])
    op.create_index("ix_commerce_product_variants_product_id", "commerce_product_variants", ["product_id"])
    op.create_index("ix_commerce_product_variants_status", "commerce_product_variants", ["status"])

    op.create_table(
        "commerce_inventory_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("stock_on_hand", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("stock_reserved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("low_stock_threshold", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("allow_backorder", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("stock_on_hand >= 0", name="ck_commerce_inventory_items_stock_on_hand_non_negative"),
        sa.CheckConstraint("stock_reserved >= 0", name="ck_commerce_inventory_items_stock_reserved_non_negative"),
        sa.CheckConstraint(
            "low_stock_threshold >= 0",
            name="ck_commerce_inventory_items_low_stock_threshold_non_negative",
        ),
        sa.ForeignKeyConstraint(["variant_id"], ["commerce_product_variants.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("variant_id", name="uq_commerce_inventory_items_variant_id"),
    )
    op.create_index("ix_commerce_inventory_items_variant_id", "commerce_inventory_items", ["variant_id"])

    op.create_table(
        "commerce_inventory_movements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("movement_type", sa.String(length=40), nullable=False),
        sa.Column("quantity_delta", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("reference_type", sa.String(length=40), nullable=True),
        sa.Column("reference_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "movement_type in ('adjustment', 'reservation', 'release', 'sale', 'return')",
            name="ck_commerce_inventory_movements_movement_type",
        ),
        sa.ForeignKeyConstraint(["variant_id"], ["commerce_product_variants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["commerce_users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_commerce_inventory_movements_variant_id", "commerce_inventory_movements", ["variant_id"])
    op.create_index(
        "ix_commerce_inventory_movements_created_by_user_id",
        "commerce_inventory_movements",
        ["created_by_user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_commerce_inventory_movements_created_by_user_id", table_name="commerce_inventory_movements")
    op.drop_index("ix_commerce_inventory_movements_variant_id", table_name="commerce_inventory_movements")
    op.drop_table("commerce_inventory_movements")

    op.drop_index("ix_commerce_inventory_items_variant_id", table_name="commerce_inventory_items")
    op.drop_table("commerce_inventory_items")

    op.drop_index("ix_commerce_product_variants_status", table_name="commerce_product_variants")
    op.drop_index("ix_commerce_product_variants_product_id", table_name="commerce_product_variants")
    op.drop_index("ix_commerce_product_variants_sku", table_name="commerce_product_variants")
    op.drop_table("commerce_product_variants")

    op.drop_index("ix_commerce_product_images_sort_order", table_name="commerce_product_images")
    op.drop_index("ix_commerce_product_images_product_id", table_name="commerce_product_images")
    op.drop_table("commerce_product_images")

    op.drop_index("ix_commerce_products_status", table_name="commerce_products")
    op.drop_index("ix_commerce_products_category_id", table_name="commerce_products")
    op.drop_index("ix_commerce_products_slug", table_name="commerce_products")
    op.drop_table("commerce_products")

    op.drop_index("ix_commerce_categories_sort_order", table_name="commerce_categories")
    op.drop_index("ix_commerce_categories_parent_id", table_name="commerce_categories")
    op.drop_index("ix_commerce_categories_slug", table_name="commerce_categories")
    op.drop_table("commerce_categories")
