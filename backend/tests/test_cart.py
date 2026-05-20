import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.commerce_cart import CommerceCart
from app.models.commerce_cart_item import CommerceCartItem
from app.models.commerce_category import CommerceCategory
from app.models.commerce_customer import CommerceCustomer
from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_product import CommerceProduct
from app.models.commerce_product_variant import CommerceProductVariant
from app.models.commerce_user import CommerceUser


def create_catalog_variant(
    *,
    slug: str,
    sku: str,
    stock_on_hand: int,
    stock_reserved: int = 0,
    product_status: str = "active",
    variant_status: str = "active",
    allow_backorder: bool = False,
) -> str:
    with SessionLocal() as session:
        category = CommerceCategory(name=f"Category {slug}", slug=f"category-{slug}", is_active=True, sort_order=1)
        session.add(category)
        session.flush()

        product = CommerceProduct(
            category_id=category.id,
            name=f"Product {slug}",
            slug=slug,
            short_description="Stage 3 cart product",
            status=product_status,
            brand="DataPulse",
            base_price=199.0,
            currency="BRL",
        )
        session.add(product)
        session.flush()

        variant = CommerceProductVariant(
            product_id=product.id,
            sku=sku,
            name=f"Variant {sku}",
            status=variant_status,
            price=179.0,
            attributes={"size": "standard"},
        )
        session.add(variant)
        session.flush()

        session.add(
            CommerceInventoryItem(
                variant_id=variant.id,
                stock_on_hand=stock_on_hand,
                stock_reserved=stock_reserved,
                low_stock_threshold=2,
                allow_backorder=allow_backorder,
            )
        )
        session.commit()
        return str(variant.id)


def create_customer_token(*, email: str = "customer-cart@example.com") -> str:
    with SessionLocal() as session:
        user = CommerceUser(
            email=email,
            password_hash=hash_password("supersecret123"),
            role="customer",
            is_active=True,
        )
        session.add(user)
        session.flush()

        customer = CommerceCustomer(
            user_id=user.id,
            first_name="Cart",
            last_name="Customer",
        )
        session.add(customer)
        session.commit()
        session.refresh(user)
        return create_access_token(subject=str(user.id), role=user.role)


def test_guest_cart_add_update_remove_and_stock_validation() -> None:
    variant_id = create_catalog_variant(slug="portable-speaker", sku="SPEAKER-001", stock_on_hand=6, stock_reserved=1)

    client = TestClient(app)

    cart_response = client.get("/cart")
    assert cart_response.status_code == 200
    cart_token = cart_response.json()["cart_token"]
    headers = {"X-Cart-Token": cart_token}

    add_response = client.post("/cart/items", headers=headers, json={"variant_id": variant_id, "quantity": 2})
    assert add_response.status_code == 200
    add_payload = add_response.json()
    assert add_payload["item_count"] == 2
    assert add_payload["unique_item_count"] == 1

    duplicate_add_response = client.post("/cart/items", headers=headers, json={"variant_id": variant_id, "quantity": 1})
    assert duplicate_add_response.status_code == 200
    duplicate_payload = duplicate_add_response.json()
    assert duplicate_payload["item_count"] == 3
    item_id = duplicate_payload["items"][0]["id"]
    assert duplicate_payload["items"][0]["quantity"] == 3
    assert duplicate_payload["items"][0]["available_stock"] == 5

    update_response = client.put(f"/cart/items/{item_id}", headers=headers, json={"quantity": 5})
    assert update_response.status_code == 200
    assert update_response.json()["items"][0]["quantity"] == 5

    invalid_update_response = client.put(f"/cart/items/{item_id}", headers=headers, json={"quantity": 6})
    assert invalid_update_response.status_code == 400
    assert invalid_update_response.json()["detail"] == "Requested quantity exceeds available stock."

    remove_response = client.delete(f"/cart/items/{item_id}", headers=headers)
    assert remove_response.status_code == 200
    remove_payload = remove_response.json()
    assert remove_payload["item_count"] == 0
    assert remove_payload["unique_item_count"] == 0

    with SessionLocal() as session:
        cart = session.scalar(select(CommerceCart).where(CommerceCart.anonymous_token == cart_token))
        items = session.scalars(select(CommerceCartItem).where(CommerceCartItem.cart_id == cart.id)).all()
        assert cart is not None
        assert items == []


def test_inactive_variants_cannot_be_added_to_cart() -> None:
    variant_id = create_catalog_variant(
        slug="hidden-prototype",
        sku="PROTO-001",
        stock_on_hand=5,
        variant_status="inactive",
    )

    client = TestClient(app)
    cart_response = client.get("/cart")
    cart_token = cart_response.json()["cart_token"]

    add_response = client.post(
        "/cart/items",
        headers={"X-Cart-Token": cart_token},
        json={"variant_id": variant_id, "quantity": 1},
    )

    assert add_response.status_code == 400
    assert add_response.json()["detail"] == "Inactive variants cannot be added to the cart."


def test_guest_cart_merges_into_customer_cart_after_login() -> None:
    variant_a_id = create_catalog_variant(slug="projector-mini", sku="PROJ-MINI-001", stock_on_hand=8)
    variant_b_id = create_catalog_variant(slug="travel-stand", sku="STAND-001", stock_on_hand=4)

    token = create_customer_token()

    with SessionLocal() as session:
        customer = session.scalar(select(CommerceCustomer))
        customer_cart = CommerceCart(customer_id=customer.id, status="active", currency="BRL")
        session.add(customer_cart)
        session.flush()
        session.add(
                CommerceCartItem(
                    cart_id=customer_cart.id,
                    variant_id=uuid.UUID(variant_a_id),
                    quantity=1,
                )
        )
        session.commit()

    client = TestClient(app)
    guest_cart_response = client.get("/cart")
    guest_cart_token = guest_cart_response.json()["cart_token"]
    guest_headers = {"X-Cart-Token": guest_cart_token}

    first_guest_add = client.post("/cart/items", headers=guest_headers, json={"variant_id": variant_a_id, "quantity": 2})
    second_guest_add = client.post("/cart/items", headers=guest_headers, json={"variant_id": variant_b_id, "quantity": 1})
    assert first_guest_add.status_code == 200
    assert second_guest_add.status_code == 200

    merged_response = client.get(
        "/cart",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Cart-Token": guest_cart_token,
        },
    )

    assert merged_response.status_code == 200
    merged_payload = merged_response.json()
    assert merged_payload["cart_token"] is None
    assert merged_payload["customer_id"] is not None
    assert merged_payload["item_count"] == 4
    assert merged_payload["unique_item_count"] == 2

    quantities_by_sku = {item["sku"]: item["quantity"] for item in merged_payload["items"]}
    assert quantities_by_sku["PROJ-MINI-001"] == 3
    assert quantities_by_sku["STAND-001"] == 1

    with SessionLocal() as session:
        merged_guest_cart = session.scalar(select(CommerceCart).where(CommerceCart.id == guest_cart_response.json()["id"]))
        customer_cart = session.scalar(
            select(CommerceCart).where(
                CommerceCart.customer_id.is_not(None),
                CommerceCart.status == "active",
            )
        )
        customer_items = session.scalars(
            select(CommerceCartItem).where(CommerceCartItem.cart_id == customer_cart.id)
        ).all()

        assert merged_guest_cart is not None
        assert merged_guest_cart.status == "merged"
        assert merged_guest_cart.anonymous_token is None
        assert len(customer_items) == 2
