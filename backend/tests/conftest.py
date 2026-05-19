import sys
from pathlib import Path

import pytest
from sqlalchemy import text

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal
from app.services.ingestion_service import ingest_csv_file
from app.services.transformation_service import transform_raw_orders


ROOT_DIR = BACKEND_DIR.parent
SAMPLE_CSV_PATH = ROOT_DIR / "data" / "sample_orders.csv"


TRUNCATE_ALL_TABLES_SQL = """
TRUNCATE TABLE
    data_quality_issues,
    fact_orders,
    stg_orders,
    raw_orders,
    dim_channels,
    dim_regions,
    dim_customers,
    dim_products,
    ingestion_runs
RESTART IDENTITY CASCADE
"""


@pytest.fixture(autouse=True)
def clean_database() -> None:
    with SessionLocal() as session:
        session.execute(text(TRUNCATE_ALL_TABLES_SQL))
        session.commit()
    yield
    with SessionLocal() as session:
        session.execute(text(TRUNCATE_ALL_TABLES_SQL))
        session.commit()


@pytest.fixture
def sample_pipeline_loaded() -> dict[str, object]:
    ingestion_result = ingest_csv_file(SAMPLE_CSV_PATH)
    transformation_result = transform_raw_orders(source_run_id=ingestion_result.run_id)
    return {
        "ingestion_result": ingestion_result,
        "transformation_result": transformation_result,
    }
