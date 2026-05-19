"""add commerce identity tables

Revision ID: 20260519_0002
Revises: 20260429_0001
Create Date: 2026-05-19 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260519_0002"
down_revision: Union[str, Sequence[str], None] = "20260429_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "commerce_users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("role", sa.String(length=30), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("email_verified_at", sa.DateTime(), nullable=True),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("role in ('customer', 'admin', 'analyst')", name="ck_commerce_users_role"),
        sa.UniqueConstraint("email", name="uq_commerce_users_email"),
    )
    op.create_index("ix_commerce_users_email", "commerce_users", ["email"], unique=False)
    op.create_index("ix_commerce_users_role", "commerce_users", ["role"], unique=False)

    op.create_table(
        "commerce_customers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("first_name", sa.String(length=120), nullable=True),
        sa.Column("last_name", sa.String(length=120), nullable=True),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("marketing_opt_in", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["commerce_users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", name="uq_commerce_customers_user_id"),
    )
    op.create_index("ix_commerce_customers_user_id", "commerce_customers", ["user_id"], unique=False)

    op.create_table(
        "commerce_customer_addresses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(length=30), nullable=False),
        sa.Column("recipient_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("line1", sa.String(length=255), nullable=False),
        sa.Column("line2", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("region", sa.String(length=120), nullable=False),
        sa.Column("postal_code", sa.String(length=40), nullable=False),
        sa.Column("country", sa.String(length=120), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "type in ('shipping', 'billing', 'both')",
            name="ck_commerce_customer_addresses_type",
        ),
        sa.ForeignKeyConstraint(["customer_id"], ["commerce_customers.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_commerce_customer_addresses_customer_id",
        "commerce_customer_addresses",
        ["customer_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_commerce_customer_addresses_customer_id", table_name="commerce_customer_addresses")
    op.drop_table("commerce_customer_addresses")

    op.drop_index("ix_commerce_customers_user_id", table_name="commerce_customers")
    op.drop_table("commerce_customers")

    op.drop_index("ix_commerce_users_role", table_name="commerce_users")
    op.drop_index("ix_commerce_users_email", table_name="commerce_users")
    op.drop_table("commerce_users")
