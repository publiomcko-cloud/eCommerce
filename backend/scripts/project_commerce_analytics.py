import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal
from app.services.commerce_analytics_service import project_commerce_orders_to_facts


def main() -> None:
    with SessionLocal() as session:
        result = project_commerce_orders_to_facts(session)
    print("records_read=", result.records_read)
    print("records_inserted=", result.records_inserted)
    print("records_skipped=", result.records_skipped)


if __name__ == "__main__":
    main()
