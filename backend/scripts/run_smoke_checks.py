import sys
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.services.ingestion_service import ingest_csv_file
from app.services.transformation_service import transform_raw_orders


def default_sample_csv_path() -> Path:
    candidate_paths = [
        BACKEND_DIR.parent / "data" / "sample_orders.csv",
        Path("/data/sample_orders.csv"),
        BACKEND_DIR / "data" / "sample_orders.csv",
    ]
    for candidate in candidate_paths:
        if candidate.exists():
            return candidate
    return candidate_paths[0]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> None:
    client = TestClient(app)

    health_response = client.get("/health")
    require(health_response.status_code == 200, "Healthcheck failed.")
    require(health_response.json()["status"] == "ok", "API did not report status ok.")

    ingestion_result = ingest_csv_file(default_sample_csv_path())
    transformation_result = transform_raw_orders(source_run_id=ingestion_result.run_id)

    latest_run_response = client.get("/ingestion/runs/latest")
    summary_response = client.get("/metrics/summary")
    orders_response = client.get("/orders", params={"limit": 5, "offset": 0})

    require(latest_run_response.status_code == 200, "Latest ingestion run endpoint failed.")
    require(summary_response.status_code == 200, "Summary metrics endpoint failed.")
    require(orders_response.status_code == 200, "Orders endpoint failed.")

    latest_payload = latest_run_response.json()
    summary_payload = summary_response.json()
    orders_payload = orders_response.json()

    require(
        latest_payload["id"] == transformation_result.transform_run_id,
        "Latest run endpoint did not return the fresh transform run.",
    )
    require(
        summary_payload["total_orders"] >= transformation_result.records_inserted,
        "Summary endpoint did not reflect transformed analytical data.",
    )
    require(
        len(orders_payload["items"]) > 0,
        "Orders endpoint returned no items after transformation.",
    )

    print("health_status=", health_response.json()["status"])
    print("ingest_run_id=", ingestion_result.run_id)
    print("transform_run_id=", transformation_result.transform_run_id)
    print("latest_job_name=", latest_payload["job_name"])
    print("summary_total_revenue=", summary_payload["total_revenue"])
    print("summary_total_orders=", summary_payload["total_orders"])
    print("orders_returned=", len(orders_payload["items"]))
    print("smoke_status= ok")


if __name__ == "__main__":
    main()
