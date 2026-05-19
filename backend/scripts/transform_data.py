import argparse
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.transformation_service import transform_raw_orders


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Transform raw_orders into staging, dimensions, and fact_orders."
    )
    parser.add_argument(
        "--source-run-id",
        default=None,
        help="Optional ingestion run id to transform. Defaults to the latest ingestion run with raw rows.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    result = transform_raw_orders(source_run_id=args.source_run_id)
    print("transform_run_id=", result.transform_run_id)
    print("source_run_id=", result.source_run_id)
    print("status=", result.status)
    print("source_name=", result.source_name)
    print("records_read=", result.records_read)
    print("records_inserted=", result.records_inserted)
    print("records_rejected=", result.records_rejected)


if __name__ == "__main__":
    main()
