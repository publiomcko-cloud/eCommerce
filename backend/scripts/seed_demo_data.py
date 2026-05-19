import argparse
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.ingestion_service import ingest_csv_file
from app.services.transformation_service import transform_raw_orders


def default_sample_csv_path() -> str:
    candidate_paths = [
        BACKEND_DIR.parent / "data" / "sample_orders.csv",
        Path("/data/sample_orders.csv"),
        BACKEND_DIR / "data" / "sample_orders.csv",
    ]
    for candidate in candidate_paths:
        if candidate.exists():
            return str(candidate)
    return str(candidate_paths[0])


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Load demo data by running ingestion followed by transformation."
    )
    parser.add_argument(
        "--csv-path",
        default=default_sample_csv_path(),
        help="Path to the CSV file to seed into the environment.",
    )
    parser.add_argument(
        "--source-name",
        default="sample_orders_demo",
        help="Logical source name stored in ingestion metadata.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    ingestion_result = ingest_csv_file(args.csv_path, source_name=args.source_name)
    transformation_result = transform_raw_orders(source_run_id=ingestion_result.run_id)

    print("ingest_run_id=", ingestion_result.run_id)
    print("ingest_status=", ingestion_result.status)
    print("records_read=", ingestion_result.records_read)
    print("records_inserted=", ingestion_result.records_inserted)
    print("records_rejected=", ingestion_result.records_rejected)
    print("transform_run_id=", transformation_result.transform_run_id)
    print("transform_status=", transformation_result.status)
    print("transform_records_read=", transformation_result.records_read)
    print("transform_records_inserted=", transformation_result.records_inserted)
    print("transform_records_rejected=", transformation_result.records_rejected)


if __name__ == "__main__":
    main()
