import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.session import SessionLocal
from app.main import app
from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_inventory_movement import CommerceInventoryMovement
from app.models.commerce_order import CommerceOrder
from app.models.commerce_order_status_history import CommerceOrderStatusHistory
from app.models.commerce_payment import CommercePayment
from tests.test_checkout import build_customer_cart_with_item, checkout_payload


def create_order_for_payment_flow(*, quantity: int = 2, stock_on_hand: int = 10) -> tuple[str, str, str]:
    token, _, variant_id = build_customer_cart_with_item(quantity=quantity, stock_on_hand=stock_on_hand)
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    session_response = client.post("/checkout/sessions", headers=headers, json=checkout_payload())
    assert session_response.status_code == 200

    order_response = client.post(
        "/checkout/orders",
        headers=headers,
        json={
            "checkout_session_id": session_response.json()["id"],
            "idempotency_key": f"payment-idempotency-{quantity}-{stock_on_hand}",
        },
    )
    assert order_response.status_code == 200
    return token, order_response.json()["id"], variant_id


def test_payment_success_marks_order_paid_and_captures_inventory() -> None:
    token, order_id, variant_id = create_order_for_payment_flow(quantity=2, stock_on_hand=8)
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    payment_response = client.post(f"/payments/orders/{order_id}", headers=headers)
    assert payment_response.status_code == 200
    payment_payload = payment_response.json()
    assert payment_payload["status"] == "pending"

    success_response = client.post(f"/payments/{payment_payload['id']}/simulate-success", headers=headers)
    assert success_response.status_code == 200
    assert success_response.json()["status"] == "succeeded"

    order_response = client.get(f"/checkout/orders/{order_id}", headers=headers)
    assert order_response.status_code == 200
    assert order_response.json()["status"] == "paid"
    assert order_response.json()["payment"]["status"] == "succeeded"

    with SessionLocal() as session:
        order = session.get(CommerceOrder, uuid.UUID(order_id))
        payment = session.get(CommercePayment, uuid.UUID(payment_payload["id"]))
        inventory = session.scalar(
            select(CommerceInventoryItem).where(CommerceInventoryItem.variant_id == uuid.UUID(variant_id))
        )
        sale_movements = session.scalars(
            select(CommerceInventoryMovement).where(
                CommerceInventoryMovement.variant_id == uuid.UUID(variant_id),
                CommerceInventoryMovement.movement_type == "sale",
            )
        ).all()
        history_rows = session.scalars(
            select(CommerceOrderStatusHistory).where(CommerceOrderStatusHistory.order_id == uuid.UUID(order_id))
        ).all()

        assert order is not None
        assert order.status == "paid"
        assert payment is not None
        assert payment.status == "succeeded"
        assert inventory is not None
        assert inventory.stock_on_hand == 6
        assert inventory.stock_reserved == 1
        assert len(sale_movements) == 1
        assert len(history_rows) == 2


def test_payment_failure_cancels_order_and_releases_inventory() -> None:
    token, order_id, variant_id = create_order_for_payment_flow(quantity=3, stock_on_hand=9)
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    payment_response = client.post(f"/payments/orders/{order_id}", headers=headers)
    assert payment_response.status_code == 200
    payment_payload = payment_response.json()

    failure_response = client.post(f"/payments/{payment_payload['id']}/simulate-failure", headers=headers)
    assert failure_response.status_code == 200
    assert failure_response.json()["status"] == "failed"

    order_response = client.get(f"/checkout/orders/{order_id}", headers=headers)
    assert order_response.status_code == 200
    assert order_response.json()["status"] == "cancelled"
    assert order_response.json()["payment"]["status"] == "failed"

    with SessionLocal() as session:
        inventory = session.scalar(
            select(CommerceInventoryItem).where(CommerceInventoryItem.variant_id == uuid.UUID(variant_id))
        )
        release_movements = session.scalars(
            select(CommerceInventoryMovement).where(
                CommerceInventoryMovement.variant_id == uuid.UUID(variant_id),
                CommerceInventoryMovement.movement_type == "release",
            )
        ).all()
        history_rows = session.scalars(
            select(CommerceOrderStatusHistory).where(CommerceOrderStatusHistory.order_id == uuid.UUID(order_id))
        ).all()

        assert inventory is not None
        assert inventory.stock_on_hand == 9
        assert inventory.stock_reserved == 1
        assert len(release_movements) == 1
        assert len(history_rows) == 2


def test_mock_webhook_is_idempotent() -> None:
    token, order_id, variant_id = create_order_for_payment_flow(quantity=1, stock_on_hand=5)
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    payment_response = client.post(f"/payments/orders/{order_id}", headers=headers)
    assert payment_response.status_code == 200
    payment_payload = payment_response.json()

    webhook_payload = {
        "event_id": "mockevt_repeatable_001",
        "provider_payment_id": payment_payload["provider_payment_id"],
        "status": "succeeded",
    }
    first_webhook = client.post("/payments/webhooks/mock", json=webhook_payload)
    second_webhook = client.post("/payments/webhooks/mock", json=webhook_payload)

    assert first_webhook.status_code == 200
    assert second_webhook.status_code == 200
    assert second_webhook.json()["status"] == "succeeded"

    with SessionLocal() as session:
        inventory = session.scalar(
            select(CommerceInventoryItem).where(CommerceInventoryItem.variant_id == uuid.UUID(variant_id))
        )
        sale_movements = session.scalars(
            select(CommerceInventoryMovement).where(
                CommerceInventoryMovement.variant_id == uuid.UUID(variant_id),
                CommerceInventoryMovement.movement_type == "sale",
            )
        ).all()
        history_rows = session.scalars(
            select(CommerceOrderStatusHistory).where(CommerceOrderStatusHistory.order_id == uuid.UUID(order_id))
        ).all()

        assert inventory is not None
        assert inventory.stock_on_hand == 4
        assert inventory.stock_reserved == 1
        assert len(sale_movements) == 1
        assert len(history_rows) == 2
