from fastapi.testclient import TestClient

from app.main import app
from app.services.ingestion_service import ingest_csv_file


def test_health_endpoint_returns_application_and_database_status() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "ok",
        "environment": "local",
    }


def test_ingestion_latest_endpoint_includes_quality_summary_for_duplicate_run(sample_pipeline_loaded) -> None:
    client = TestClient(app)

    sample_run_id = sample_pipeline_loaded["ingestion_result"].run_id
    duplicate_result = ingest_csv_file(sample_pipeline_loaded["ingestion_result"].csv_path)

    response = client.get("/ingestion/runs/latest")

    assert response.status_code == 200
    payload = response.json()
    assert payload["job_name"] == "ingest_orders"
    assert payload["status"] == "partial"
    assert payload["records_read"] == 12
    assert payload["records_inserted"] == 0
    assert payload["records_rejected"] == 12
    assert payload["id"] == duplicate_result.run_id
    assert payload["id"] != sample_run_id
    assert payload["quality_summary"]["total_issues"] == 12
    assert payload["quality_summary"]["issue_types"] == [
        {"issue_type": "duplicate_record", "count": 12}
    ]


def test_metrics_summary_endpoint_returns_expected_values(sample_pipeline_loaded) -> None:
    client = TestClient(app)

    response = client.get("/metrics/summary")

    assert response.status_code == 200
    assert response.json() == {
        "total_revenue": 8518.5,
        "total_orders": 12,
        "average_order_value": 709.88,
        "top_product": "Notebook 14",
    }


def test_revenue_over_time_and_orders_endpoint_support_filters(sample_pipeline_loaded) -> None:
    client = TestClient(app)

    timeline_response = client.get(
        "/metrics/revenue-over-time",
        params={"start_date": "2026-03-01", "end_date": "2026-03-31"},
    )
    orders_response = client.get(
        "/orders",
        params={"region": "southeast", "limit": 10, "offset": 0},
    )

    assert timeline_response.status_code == 200
    timeline_payload = timeline_response.json()
    assert len(timeline_payload) == 4
    assert timeline_payload[0]["order_date"] == "2026-03-05"
    assert timeline_payload[-1]["order_date"] == "2026-03-25"

    assert orders_response.status_code == 200
    orders_payload = orders_response.json()
    assert orders_payload["total"] == 4
    assert orders_payload["limit"] == 10
    assert orders_payload["offset"] == 0
    assert orders_payload["items"][0]["product_name"] == "Coffee Maker"
    assert {item["product_name"] for item in orders_payload["items"]} == {
        "Wireless Mouse",
        "Notebook 14",
        "Smart Speaker",
        "Coffee Maker",
    }


def test_create_order_endpoint_adds_manual_order_and_refreshes_metrics(sample_pipeline_loaded) -> None:
    client = TestClient(app)

    response = client.post(
        "/orders",
        json={
            "order_date": "2026-04-06",
            "customer_id": "cust-manual-001",
            "product_id": "prod-manual-001",
            "product_name": "Portable Projector",
            "category": "electronics",
            "region": "south",
            "channel": "online",
            "quantity": 1,
            "unit_price": 459.0,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["transform_run_id"] is not None
    assert payload["message"] == "Order submitted and transformed successfully."
    assert payload["quality_summary"] == {"total_issues": 0, "issue_types": []}
    assert payload["created_order"] == {
        "source_record_id": payload["source_record_id"],
        "order_date": "2026-04-06",
        "product_name": "Portable Projector",
        "category": "electronics",
        "region": "south",
        "channel": "online",
        "quantity": 1,
        "unit_price": 459.0,
        "total_amount": 459.0,
    }

    summary_response = client.get("/metrics/summary")
    latest_run_response = client.get("/ingestion/runs/latest")

    assert summary_response.status_code == 200
    assert summary_response.json() == {
        "total_revenue": 8977.5,
        "total_orders": 13,
        "average_order_value": 690.58,
        "top_product": "Notebook 14",
    }

    assert latest_run_response.status_code == 200
    latest_payload = latest_run_response.json()
    assert latest_payload["job_name"] == "transform_orders"
    assert latest_payload["status"] == "success"
    assert latest_payload["records_read"] == 1
    assert latest_payload["records_inserted"] == 1
    assert latest_payload["records_rejected"] == 0
