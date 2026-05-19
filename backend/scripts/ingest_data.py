import argparse
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.ingestion_service import ingest_csv_file


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
    parser = argparse.ArgumentParser(description="Ingest a CSV dataset into raw_orders.")
    parser.add_argument(
        "--csv-path",
        default=default_sample_csv_path(),
        help="Path to the CSV file to ingest.",
    )
    parser.add_argument(
        "--source-name",
        default=None,
        help="Optional logical source name stored in ingestion metadata.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    result = ingest_csv_file(args.csv_path, source_name=args.source_name)
    print("run_id=", result.run_id)
    print("status=", result.status)
    print("source_name=", result.source_name)
    print("csv_path=", result.csv_path)
    print("records_read=", result.records_read)
    print("records_inserted=", result.records_inserted)
    print("records_rejected=", result.records_rejected)


if __name__ == "__main__":
    main()
