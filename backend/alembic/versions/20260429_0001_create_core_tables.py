"""create core tables

Revision ID: 20260429_0001
Revises:
Create Date: 2026-04-29 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "20260429_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ingestion_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("job_name", sa.String(length=100), nullable=False),
        sa.Column("source_name", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("records_read", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("records_inserted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("records_rejected", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status in ('success', 'failed', 'partial', 'running')", name="ck_ingestion_runs_status"),
    )
    op.create_index("ix_ingestion_runs_job_name", "ingestion_runs", ["job_name"])
    op.create_index("ix_ingestion_runs_status", "ingestion_runs", ["status"])
    op.create_index("ix_ingestion_runs_started_at", "ingestion_runs", ["started_at"])

    op.create_table(
        "raw_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("source_record_id", sa.String(length=100), nullable=True),
        sa.Column("source_name", sa.String(length=100), nullable=False),
        sa.Column("order_date_raw", sa.Text(), nullable=True),
        sa.Column("customer_id_raw", sa.Text(), nullable=True),
        sa.Column("product_id_raw", sa.Text(), nullable=True),
        sa.Column("product_name_raw", sa.Text(), nullable=True),
        sa.Column("category_raw", sa.Text(), nullable=True),
        sa.Column("region_raw", sa.Text(), nullable=True),
        sa.Column("channel_raw", sa.Text(), nullable=True),
        sa.Column("quantity_raw", sa.Text(), nullable=True),
        sa.Column("unit_price_raw", sa.Text(), nullable=True),
        sa.Column("total_amount_raw", sa.Text(), nullable=True),
        sa.Column("ingestion_run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("row_hash", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["ingestion_run_id"], ["ingestion_runs.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_raw_orders_row_hash", "raw_orders", ["row_hash"], unique=True)
    op.create_index("ix_raw_orders_ingestion_run_id", "raw_orders", ["ingestion_run_id"])
    op.create_index("ix_raw_orders_source_record_id", "raw_orders", ["source_record_id"])

    op.create_table(
        "stg_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("source_record_id", sa.String(length=100), nullable=True),
        sa.Column("order_date", sa.Date(), nullable=False),
        sa.Column("customer_external_id", sa.String(length=100), nullable=False),
        sa.Column("product_external_id", sa.String(length=100), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("region", sa.String(length=100), nullable=False),
        sa.Column("channel", sa.String(length=100), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("ingestion_run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("quantity > 0", name="ck_stg_orders_quantity_positive"),
        sa.CheckConstraint("unit_price >= 0", name="ck_stg_orders_unit_price_non_negative"),
        sa.CheckConstraint("total_amount >= 0", name="ck_stg_orders_total_amount_non_negative"),
        sa.ForeignKeyConstraint(["ingestion_run_id"], ["ingestion_runs.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_stg_orders_order_date", "stg_orders", ["order_date"])
    op.create_index("ix_stg_orders_category", "stg_orders", ["category"])
    op.create_index("ix_stg_orders_region", "stg_orders", ["region"])
    op.create_index("ix_stg_orders_channel", "stg_orders", ["channel"])
    op.create_index("ix_stg_orders_ingestion_run_id", "stg_orders", ["ingestion_run_id"])

    op.create_table(
        "dim_products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("product_external_id", sa.String(length=100), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("product_external_id", name="uq_dim_products_product_external_id"),
    )

    op.create_table(
        "dim_customers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("customer_external_id", sa.String(length=100), nullable=False),
        sa.Column("region", sa.String(length=100), nullable=True),
        sa.Column("customer_segment", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("customer_external_id", name="uq_dim_customers_customer_external_id"),
    )

    op.create_table(
        "dim_regions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("region_name", sa.String(length=100), nullable=False),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("region_name", name="uq_dim_regions_region_name"),
    )

    op.create_table(
        "dim_channels",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("channel_name", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("channel_name", name="uq_dim_channels_channel_name"),
    )

    op.create_table(
        "fact_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("order_date", sa.Date(), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("region_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("channel_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("source_record_id", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("quantity > 0", name="ck_fact_orders_quantity_positive"),
        sa.CheckConstraint("unit_price >= 0", name="ck_fact_orders_unit_price_non_negative"),
        sa.CheckConstraint("total_amount >= 0", name="ck_fact_orders_total_amount_non_negative"),
        sa.ForeignKeyConstraint(["channel_id"], ["dim_channels.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["customer_id"], ["dim_customers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["product_id"], ["dim_products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["region_id"], ["dim_regions.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_fact_orders_order_date", "fact_orders", ["order_date"])
    op.create_index("ix_fact_orders_product_id", "fact_orders", ["product_id"])
    op.create_index("ix_fact_orders_customer_id", "fact_orders", ["customer_id"])
    op.create_index("ix_fact_orders_region_id", "fact_orders", ["region_id"])
    op.create_index("ix_fact_orders_channel_id", "fact_orders", ["channel_id"])
    op.create_index("ix_fact_orders_order_date_region_id", "fact_orders", ["order_date", "region_id"])
    op.create_index("ix_fact_orders_order_date_channel_id", "fact_orders", ["order_date", "channel_id"])
    op.create_index("ix_fact_orders_order_date_product_id", "fact_orders", ["order_date", "product_id"])

    op.create_table(
        "data_quality_issues",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("ingestion_run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_record_id", sa.String(length=100), nullable=True),
        sa.Column("issue_type", sa.String(length=100), nullable=False),
        sa.Column("field_name", sa.String(length=100), nullable=True),
        sa.Column("original_value", sa.Text(), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["ingestion_run_id"], ["ingestion_runs.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_data_quality_issues_ingestion_run_id", "data_quality_issues", ["ingestion_run_id"])
    op.create_index("ix_data_quality_issues_issue_type", "data_quality_issues", ["issue_type"])
    op.create_index("ix_data_quality_issues_source_record_id", "data_quality_issues", ["source_record_id"])


def downgrade() -> None:
    op.drop_index("ix_data_quality_issues_source_record_id", table_name="data_quality_issues")
    op.drop_index("ix_data_quality_issues_issue_type", table_name="data_quality_issues")
    op.drop_index("ix_data_quality_issues_ingestion_run_id", table_name="data_quality_issues")
    op.drop_table("data_quality_issues")

    op.drop_index("ix_fact_orders_order_date_product_id", table_name="fact_orders")
    op.drop_index("ix_fact_orders_order_date_channel_id", table_name="fact_orders")
    op.drop_index("ix_fact_orders_order_date_region_id", table_name="fact_orders")
    op.drop_index("ix_fact_orders_channel_id", table_name="fact_orders")
    op.drop_index("ix_fact_orders_region_id", table_name="fact_orders")
    op.drop_index("ix_fact_orders_customer_id", table_name="fact_orders")
    op.drop_index("ix_fact_orders_product_id", table_name="fact_orders")
    op.drop_index("ix_fact_orders_order_date", table_name="fact_orders")
    op.drop_table("fact_orders")

    op.drop_table("dim_channels")
    op.drop_table("dim_regions")
    op.drop_table("dim_customers")
    op.drop_table("dim_products")

    op.drop_index("ix_stg_orders_ingestion_run_id", table_name="stg_orders")
    op.drop_index("ix_stg_orders_channel", table_name="stg_orders")
    op.drop_index("ix_stg_orders_region", table_name="stg_orders")
    op.drop_index("ix_stg_orders_category", table_name="stg_orders")
    op.drop_index("ix_stg_orders_order_date", table_name="stg_orders")
    op.drop_table("stg_orders")

    op.drop_index("ix_raw_orders_source_record_id", table_name="raw_orders")
    op.drop_index("ix_raw_orders_ingestion_run_id", table_name="raw_orders")
    op.drop_index("ix_raw_orders_row_hash", table_name="raw_orders")
    op.drop_table("raw_orders")

    op.drop_index("ix_ingestion_runs_started_at", table_name="ingestion_runs")
    op.drop_index("ix_ingestion_runs_status", table_name="ingestion_runs")
    op.drop_index("ix_ingestion_runs_job_name", table_name="ingestion_runs")
    op.drop_table("ingestion_runs")
