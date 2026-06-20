import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.session import SessionLocal
from app.main import app
from app.models.commerce_event import CommerceEvent
from app.models.fact_order import FactOrder
from app.services.commerce_analytics_service import project_commerce_orders_to_facts
from tests.test_payments import create_order_for_payment_flow


def test_commerce_events_and_operational_metrics_track_checkout_payment_and_inventory() -> None:
    token, order_id, variant_id = create_order_for_payment_flow(quantity=2, stock_on_hand=3)
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    payment_response = client.post(f"/payments/orders/{order_id}", headers=headers)
    assert payment_response.status_code == 200
    success_response = client.post(
        f"/payments/{payment_response.json()['id']}/simulate-success",
        headers=headers,
    )
    assert success_response.status_code == 200

    funnel_response = client.get("/metrics/conversion-funnel")
    payment_health_response = client.get("/metrics/payment-health")
    inventory_risk_response = client.get("/metrics/inventory-risk")
    revenue_by_category_response = client.get("/metrics/revenue-by-category")

    assert funnel_response.status_code == 200
    assert funnel_response.json()["cart_adds"] == 0
    assert funnel_response.json()["checkouts_started"] == 1
    assert funnel_response.json()["orders_created"] == 1
    assert funnel_response.json()["payments_succeeded"] == 1
    assert payment_health_response.status_code == 200
    assert payment_health_response.json()["succeeded_payments"] == 1
    assert payment_health_response.json()["success_rate"] == 1.0
    assert revenue_by_category_response.status_code == 200
    assert revenue_by_category_response.json()[0]["quantity_sold"] == 2
    assert inventory_risk_response.status_code == 200
    assert any(item["variant_id"] == variant_id for item in inventory_risk_response.json())

    with SessionLocal() as session:
        event_types = [
            event.event_type
            for event in session.scalars(
                select(CommerceEvent).order_by(CommerceEvent.created_at.asc())
            ).all()
        ]
        assert "checkout_started" in event_types
        assert "order_created" in event_types
        assert "payment_succeeded" in event_types


def test_commerce_projection_inserts_paid_order_items_into_fact_orders_once() -> None:
    token, order_id, _ = create_order_for_payment_flow(quantity=1, stock_on_hand=3)
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    payment_response = client.post(f"/payments/orders/{order_id}", headers=headers)
    assert payment_response.status_code == 200
    success_response = client.post(
        f"/payments/{payment_response.json()['id']}/simulate-success",
        headers=headers,
    )
    assert success_response.status_code == 200

    with SessionLocal() as session:
        first_result = project_commerce_orders_to_facts(session)
        second_result = project_commerce_orders_to_facts(session)
        fact_orders = session.scalars(select(FactOrder)).all()

    assert first_result.records_read == 1
    assert first_result.records_inserted == 1
    assert first_result.records_skipped == 0
    assert second_result.records_read == 1
    assert second_result.records_inserted == 0
    assert second_result.records_skipped == 1
    assert len(fact_orders) == 1
    assert fact_orders[0].source_record_id is not None
    assert fact_orders[0].source_record_id.startswith("commerce:")
