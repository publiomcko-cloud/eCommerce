from fastapi.testclient import TestClient

from app.main import app


def test_end_to_end_pipeline_smoke_check(sample_pipeline_loaded) -> None:
    client = TestClient(app)

    health_response = client.get("/health")
    latest_run_response = client.get("/ingestion/runs/latest")
    summary_response = client.get("/metrics/summary")
    orders_response = client.get("/orders", params={"limit": 5, "offset": 0})

    assert health_response.status_code == 200
    assert health_response.json()["status"] == "ok"

    assert latest_run_response.status_code == 200
    latest_payload = latest_run_response.json()
    assert latest_payload["job_name"] == "transform_orders"
    assert latest_payload["status"] == "success"
    assert latest_payload["records_read"] == 12
    assert latest_payload["records_inserted"] == 12
    assert latest_payload["records_rejected"] == 0
    assert latest_payload["quality_summary"]["total_issues"] == 0

    assert summary_response.status_code == 200
    assert summary_response.json() == {
        "total_revenue": 8518.5,
        "total_orders": 12,
        "average_order_value": 709.88,
        "top_product": "Notebook 14",
    }

    assert orders_response.status_code == 200
    orders_payload = orders_response.json()
    assert orders_payload["total"] == 12
    assert len(orders_payload["items"]) == 5
    assert orders_payload["items"][0]["source_record_id"] == "order-012"
