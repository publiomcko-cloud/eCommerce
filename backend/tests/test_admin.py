import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.commerce_order import CommerceOrder
from app.models.commerce_order_status_history import CommerceOrderStatusHistory
from app.models.commerce_refund import CommerceRefund
from app.models.commerce_shipment import CommerceShipment
from app.models.commerce_user import CommerceUser
from tests.test_payments import create_order_for_payment_flow


def create_admin_token() -> str:
    with SessionLocal() as session:
        admin = CommerceUser(
            email="admin-stage7@example.com",
            password_hash=hash_password("supersecret123"),
            role="admin",
            is_active=True,
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)
        return create_access_token(subject=str(admin.id), role=admin.role)


def test_admin_routes_require_admin_role() -> None:
    client = TestClient(app)
    customer_token, order_id, _ = create_order_for_payment_flow(quantity=1, stock_on_hand=5)
    admin_token = create_admin_token()

    anonymous_response = client.get("/admin/overview")
    customer_response = client.get("/admin/overview", headers={"Authorization": f"Bearer {customer_token}"})
    admin_response = client.get("/admin/overview", headers={"Authorization": f"Bearer {admin_token}"})
    detail_response = client.get(f"/admin/orders/{order_id}", headers={"Authorization": f"Bearer {admin_token}"})

    assert anonymous_response.status_code == 401
    assert customer_response.status_code == 403
    assert admin_response.status_code == 200
    assert detail_response.status_code == 200
    assert detail_response.json()["id"] == order_id


def test_admin_can_fulfill_paid_order_and_record_shipment() -> None:
    client = TestClient(app)
    customer_token, order_id, _ = create_order_for_payment_flow(quantity=2, stock_on_hand=7)
    admin_token = create_admin_token()

    payment_response = client.post(
        f"/payments/orders/{order_id}",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert payment_response.status_code == 200
    simulate_response = client.post(
        f"/payments/{payment_response.json()['id']}/simulate-success",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert simulate_response.status_code == 200

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    fulfill_response = client.post(
        f"/admin/orders/{order_id}/status",
        headers=admin_headers,
        json={"status": "fulfilled", "reason": "Packed and handed to carrier."},
    )
    assert fulfill_response.status_code == 200
    assert fulfill_response.json()["status"] == "fulfilled"

    shipment_response = client.put(
        f"/admin/orders/{order_id}/shipment",
        headers=admin_headers,
        json={
            "carrier": "Correios",
            "service_level": "SEDEX",
            "tracking_number": "BR123456789",
            "status": "shipped",
            "notes": "Left warehouse at 10:30.",
        },
    )
    assert shipment_response.status_code == 200
    assert shipment_response.json()["status"] == "shipped"

    inventory_response = client.get("/admin/inventory", headers=admin_headers)
    orders_response = client.get("/admin/orders", headers=admin_headers)
    assert inventory_response.status_code == 200
    assert orders_response.status_code == 200
    assert orders_response.json()["total"] == 1
    assert orders_response.json()["items"][0]["shipment_status"] == "shipped"

    with SessionLocal() as session:
        order = session.get(CommerceOrder, uuid.UUID(order_id))
        shipment = session.scalar(
            select(CommerceShipment).where(CommerceShipment.order_id == uuid.UUID(order_id))
        )
        history_rows = session.scalars(
            select(CommerceOrderStatusHistory).where(CommerceOrderStatusHistory.order_id == uuid.UUID(order_id))
        ).all()
        assert order is not None
        assert order.status == "fulfilled"
        assert shipment is not None
        assert shipment.carrier == "Correios"
        assert len(history_rows) == 3


def test_admin_rejects_invalid_order_status_transition() -> None:
    client = TestClient(app)
    _, order_id, _ = create_order_for_payment_flow(quantity=1, stock_on_hand=4)
    admin_token = create_admin_token()

    response = client.post(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "fulfilled", "reason": "Trying to skip payment."},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Cannot move order from pending_payment to fulfilled."


def test_admin_can_create_refund_for_paid_order() -> None:
    client = TestClient(app)
    customer_token, order_id, _ = create_order_for_payment_flow(quantity=1, stock_on_hand=4)
    admin_token = create_admin_token()

    payment_response = client.post(
        f"/payments/orders/{order_id}",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert payment_response.status_code == 200
    simulate_response = client.post(
        f"/payments/{payment_response.json()['id']}/simulate-success",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert simulate_response.status_code == 200

    refund_response = client.post(
        f"/admin/orders/{order_id}/refunds",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "Customer requested cancellation."},
    )

    assert refund_response.status_code == 201
    refund_payload = refund_response.json()
    assert refund_payload["status"] == "succeeded"
    assert refund_payload["amount"] > 0

    detail_response = client.get(
        f"/admin/orders/{order_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["status"] == "cancelled"
    assert len(detail_response.json()["refunds"]) == 1

    duplicate_refund_response = client.post(
        f"/admin/orders/{order_id}/refunds",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"amount": 1, "reason": "Second refund should exceed remaining balance."},
    )
    assert duplicate_refund_response.status_code == 400

    with SessionLocal() as session:
        refunds = session.scalars(
            select(CommerceRefund).where(CommerceRefund.order_id == uuid.UUID(order_id))
        ).all()
        order = session.get(CommerceOrder, uuid.UUID(order_id))
        assert len(refunds) == 1
        assert order is not None
        assert order.status == "cancelled"
