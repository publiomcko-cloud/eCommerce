import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.commerce_cart import CommerceCart
from app.models.commerce_cart_item import CommerceCartItem
from app.models.commerce_category import CommerceCategory
from app.models.commerce_checkout_session import CommerceCheckoutSession
from app.models.commerce_customer import CommerceCustomer
from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_inventory_movement import CommerceInventoryMovement
from app.models.commerce_order import CommerceOrder
from app.models.commerce_order_item import CommerceOrderItem
from app.models.commerce_order_status_history import CommerceOrderStatusHistory
from app.models.commerce_product import CommerceProduct
from app.models.commerce_product_variant import CommerceProductVariant
from app.models.commerce_user import CommerceUser


def build_customer_cart_with_item(*, quantity: int = 2, stock_on_hand: int = 10) -> tuple[str, str, str]:
    with SessionLocal() as session:
        user = CommerceUser(
            email="checkout@example.com",
            password_hash=hash_password("supersecret123"),
            role="customer",
            is_active=True,
        )
        session.add(user)
        session.flush()

        customer = CommerceCustomer(
            user_id=user.id,
            first_name="Checkout",
            last_name="Customer",
            phone="+55 11 99999-0000",
        )
        session.add(customer)
        session.flush()

        category = CommerceCategory(name="Electronics", slug="electronics-checkout", is_active=True, sort_order=1)
        session.add(category)
        session.flush()

        product = CommerceProduct(
            category_id=category.id,
            name="Portable Projector",
            slug="portable-projector-checkout",
            short_description="Checkout projector",
            status="active",
            brand="DataPulse",
            base_price=599.0,
            currency="BRL",
        )
        session.add(product)
        session.flush()

        variant = CommerceProductVariant(
            product_id=product.id,
            sku="PROJ-CHECK-001",
            name="Portable Projector Standard",
            status="active",
            price=579.0,
            attributes={"color": "graphite"},
        )
        session.add(variant)
        session.flush()

        inventory = CommerceInventoryItem(
            variant_id=variant.id,
            stock_on_hand=stock_on_hand,
            stock_reserved=1,
            low_stock_threshold=2,
            allow_backorder=False,
        )
        session.add(inventory)
        session.flush()

        cart = CommerceCart(customer_id=customer.id, status="active", currency="BRL")
        session.add(cart)
        session.flush()
        session.add(
            CommerceCartItem(
                cart_id=cart.id,
                variant_id=variant.id,
                quantity=quantity,
            )
        )
        session.commit()
        return (
            create_access_token(subject=str(user.id), role=user.role),
            str(cart.id),
            str(variant.id),
        )


def checkout_payload() -> dict:
    return {
        "email": "checkout@example.com",
        "shipping_address": {
            "recipient_name": "Checkout Customer",
            "phone": "+55 11 99999-0000",
            "line1": "Avenida Paulista, 1000",
            "line2": "Suite 12",
            "city": "Sao Paulo",
            "region": "SP",
            "postal_code": "01310-100",
            "country": "BR",
        },
        "billing_address": {
            "recipient_name": "Checkout Customer",
            "phone": "+55 11 99999-0000",
            "line1": "Avenida Paulista, 1000",
            "line2": "Suite 12",
            "city": "Sao Paulo",
            "region": "SP",
            "postal_code": "01310-100",
            "country": "BR",
        },
    }


def test_checkout_session_and_order_placement_are_idempotent() -> None:
    token, cart_id, variant_id = build_customer_cart_with_item(quantity=2, stock_on_hand=10)
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    session_response = client.post("/checkout/sessions", headers=headers, json=checkout_payload())
    assert session_response.status_code == 200
    session_payload = session_response.json()
    assert session_payload["cart_id"] == cart_id
    assert session_payload["totals"]["item_count"] == 2
    assert session_payload["totals"]["subtotal"] == 1158.0

    order_response = client.post(
        "/checkout/orders",
        headers=headers,
        json={
            "checkout_session_id": session_payload["id"],
            "idempotency_key": "checkout-idempotency-001",
        },
    )
    assert order_response.status_code == 200
    order_payload = order_response.json()
    assert order_payload["status"] == "pending_payment"
    assert order_payload["items"][0]["sku"] == "PROJ-CHECK-001"
    assert order_payload["subtotal_amount"] == 1158.0

    retry_response = client.post(
        "/checkout/orders",
        headers=headers,
        json={
            "checkout_session_id": session_payload["id"],
            "idempotency_key": "checkout-idempotency-001",
        },
    )
    assert retry_response.status_code == 200
    assert retry_response.json()["id"] == order_payload["id"]
    assert retry_response.json()["order_number"] == order_payload["order_number"]

    order_detail_response = client.get(f"/checkout/orders/{order_payload['id']}", headers=headers)
    assert order_detail_response.status_code == 200
    assert order_detail_response.json()["id"] == order_payload["id"]

    fresh_cart_response = client.get("/cart", headers=headers)
    assert fresh_cart_response.status_code == 200
    assert fresh_cart_response.json()["item_count"] == 0
    assert fresh_cart_response.json()["id"] != cart_id

    with SessionLocal() as session:
        checkout_session = session.get(CommerceCheckoutSession, uuid.UUID(session_payload["id"]))
        order = session.get(CommerceOrder, uuid.UUID(order_payload["id"]))
        inventory = session.scalar(
            select(CommerceInventoryItem).where(CommerceInventoryItem.variant_id == uuid.UUID(variant_id))
        )
        reservation_movements = session.scalars(
            select(CommerceInventoryMovement).where(
                CommerceInventoryMovement.variant_id == uuid.UUID(variant_id),
                CommerceInventoryMovement.movement_type == "reservation",
            )
        ).all()
        order_items = session.scalars(select(CommerceOrderItem).where(CommerceOrderItem.order_id == order.id)).all()
        history_rows = session.scalars(
            select(CommerceOrderStatusHistory).where(CommerceOrderStatusHistory.order_id == order.id)
        ).all()
        converted_cart = session.get(CommerceCart, uuid.UUID(cart_id))

        assert checkout_session is not None
        assert checkout_session.status == "converted"
        assert order is not None
        assert order.idempotency_key == "checkout-idempotency-001"
        assert inventory is not None
        assert inventory.stock_reserved == 3
        assert len(reservation_movements) == 1
        assert len(order_items) == 1
        assert len(history_rows) == 1
        assert converted_cart is not None
        assert converted_cart.status == "converted"


def test_checkout_fails_when_stock_becomes_unavailable_before_order() -> None:
    token, _, variant_id = build_customer_cart_with_item(quantity=3, stock_on_hand=5)
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    session_response = client.post("/checkout/sessions", headers=headers, json=checkout_payload())
    assert session_response.status_code == 200

    with SessionLocal() as session:
        inventory = session.scalar(
            select(CommerceInventoryItem).where(CommerceInventoryItem.variant_id == uuid.UUID(variant_id))
        )
        assert inventory is not None
        inventory.stock_reserved = 4
        session.commit()

    order_response = client.post(
        "/checkout/orders",
        headers=headers,
        json={
            "checkout_session_id": session_response.json()["id"],
            "idempotency_key": "checkout-idempotency-002",
        },
    )

    assert order_response.status_code == 400
    assert order_response.json()["detail"] == "Checkout quantity exceeds available stock."
