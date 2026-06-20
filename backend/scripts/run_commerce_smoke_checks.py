import sys
import uuid
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal
from app.main import app
from app.services.commerce_analytics_service import project_commerce_orders_to_facts
from scripts.seed_commerce_demo_data import upsert_admin_user, upsert_product_catalog


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def seed_catalog(session: Session) -> None:
    admin_user = upsert_admin_user(session)
    upsert_product_catalog(session, admin_user)
    session.commit()


def main() -> None:
    client = TestClient(app)

    health_response = client.get("/health")
    require(health_response.status_code == 200, "Healthcheck failed.")
    require(health_response.json()["status"] == "ok", "API did not report status ok.")

    with SessionLocal() as session:
        seed_catalog(session)

    register_email = f"commerce-smoke-{uuid.uuid4().hex[:10]}@example.com"
    register_response = client.post(
        "/auth/register",
        json={
            "email": register_email,
            "password": "smoke-password-123",
            "first_name": "Commerce",
            "last_name": "Smoke",
        },
    )
    require(register_response.status_code == 201, "Customer registration failed.")
    access_token = register_response.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    products_response = client.get("/catalog/products", params={"limit": 1})
    require(products_response.status_code == 200, "Catalog product listing failed.")
    products = products_response.json()["items"]
    require(len(products) == 1, "Catalog did not return a product.")

    product_response = client.get(f"/catalog/products/{products[0]['slug']}")
    require(product_response.status_code == 200, "Catalog product detail failed.")
    product = product_response.json()
    active_variant = next((variant for variant in product["variants"] if variant["is_in_stock"]), None)
    require(active_variant is not None, "No in-stock active variant available for smoke checkout.")

    cart_response = client.post(
        "/cart/items",
        headers=auth_headers,
        json={"variant_id": active_variant["id"], "quantity": 1},
    )
    require(cart_response.status_code == 200, "Add-to-cart failed.")
    require(cart_response.json()["item_count"] == 1, "Cart did not contain the expected item count.")

    address = {
        "recipient_name": "Commerce Smoke",
        "phone": "+55 11 90000-0000",
        "line1": "Avenida Paulista, 1000",
        "line2": "Smoke Suite",
        "city": "Sao Paulo",
        "region": "SP",
        "postal_code": "01310-100",
        "country": "BR",
    }
    checkout_response = client.post(
        "/checkout/sessions",
        headers=auth_headers,
        json={
            "email": register_email,
            "shipping_address": address,
            "billing_address": address,
        },
    )
    require(checkout_response.status_code == 200, "Checkout session creation failed.")

    order_response = client.post(
        "/checkout/orders",
        headers=auth_headers,
        json={
            "checkout_session_id": checkout_response.json()["id"],
            "idempotency_key": f"commerce-smoke-{uuid.uuid4().hex}",
        },
    )
    require(order_response.status_code == 200, "Order placement failed.")
    order_payload = order_response.json()
    require(order_payload["status"] == "pending_payment", "Order did not start pending payment.")

    payment_response = client.post(f"/payments/orders/{order_payload['id']}", headers=auth_headers)
    require(payment_response.status_code == 200, "Payment creation failed.")

    success_response = client.post(
        f"/payments/{payment_response.json()['id']}/simulate-success",
        headers=auth_headers,
    )
    require(success_response.status_code == 200, "Mock payment success failed.")
    require(success_response.json()["status"] == "succeeded", "Payment did not succeed.")

    order_detail_response = client.get(f"/account/orders/{order_payload['id']}", headers=auth_headers)
    require(order_detail_response.status_code == 200, "Customer order detail lookup failed.")
    require(order_detail_response.json()["status"] == "paid", "Paid order was not visible in account area.")

    funnel_response = client.get("/metrics/conversion-funnel")
    payment_health_response = client.get("/metrics/payment-health")
    inventory_risk_response = client.get("/metrics/inventory-risk")
    require(funnel_response.status_code == 200, "Conversion funnel metric failed.")
    require(payment_health_response.status_code == 200, "Payment health metric failed.")
    require(inventory_risk_response.status_code == 200, "Inventory risk metric failed.")
    require(payment_health_response.json()["succeeded_payments"] >= 1, "Payment health did not include smoke payment.")

    with SessionLocal() as session:
        projection_result = project_commerce_orders_to_facts(session)

    print("health_status=", health_response.json()["status"])
    print("customer_email=", register_email)
    print("product_slug=", product["slug"])
    print("order_id=", order_payload["id"])
    print("order_number=", order_payload["order_number"])
    print("payment_status=", success_response.json()["status"])
    print("funnel_orders_created=", funnel_response.json()["orders_created"])
    print("payment_success_rate=", payment_health_response.json()["success_rate"])
    print("projection_records_read=", projection_result.records_read)
    print("projection_records_inserted=", projection_result.records_inserted)
    print("projection_records_skipped=", projection_result.records_skipped)
    print("commerce_smoke_status= ok")


if __name__ == "__main__":
    main()
