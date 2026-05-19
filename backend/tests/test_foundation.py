from app.core.config import get_settings
from app.db.base import Base


def test_settings_expose_postgres_connection_url() -> None:
    settings = get_settings()

    assert settings.database_url.startswith("postgresql+psycopg://")
    assert settings.environment in {"local", "development", "test", "production"}


def test_metadata_registers_core_milestone_two_tables() -> None:
    expected_tables = {
        "ingestion_runs",
        "raw_orders",
        "stg_orders",
        "dim_products",
        "dim_customers",
        "dim_regions",
        "dim_channels",
        "fact_orders",
        "data_quality_issues",
    }

    assert expected_tables.issubset(set(Base.metadata.tables))
