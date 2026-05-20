from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.commerce_category import CommerceCategory
from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_inventory_movement import CommerceInventoryMovement
from app.models.commerce_product import CommerceProduct
from app.models.commerce_product_variant import CommerceProductVariant
from app.models.commerce_user import CommerceUser


def create_admin_token() -> str:
    with SessionLocal() as session:
        admin_user = CommerceUser(
            email="admin-catalog@example.com",
            password_hash=hash_password("supersecret123"),
            role="admin",
            is_active=True,
        )
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        return create_access_token(subject=str(admin_user.id), role=admin_user.role)


def test_catalog_listing_and_detail_only_show_active_products() -> None:
    with SessionLocal() as session:
        category = CommerceCategory(name="Electronics", slug="electronics", is_active=True, sort_order=1)
        session.add(category)
        session.flush()

        active_product = CommerceProduct(
            category_id=category.id,
            name="Portable Projector",
            slug="portable-projector",
            short_description="Portable cinema on the move.",
            status="active",
            brand="DataPulse",
            base_price=599.0,
            currency="BRL",
        )
        draft_product = CommerceProduct(
            category_id=category.id,
            name="Secret Prototype",
            slug="secret-prototype",
            short_description="Hidden draft product.",
            status="draft",
            brand="DataPulse",
            base_price=999.0,
            currency="BRL",
        )
        session.add_all([active_product, draft_product])
        session.flush()

        active_variant = CommerceProductVariant(
            product_id=active_product.id,
            sku="PROJ-001",
            name="Portable Projector Standard",
            price=579.0,
            status="active",
            attributes={"color": "graphite"},
        )
        session.add(active_variant)
        session.flush()
        session.add(
            CommerceInventoryItem(
                variant_id=active_variant.id,
                stock_on_hand=8,
                stock_reserved=2,
                low_stock_threshold=2,
            )
        )
        session.commit()

    client = TestClient(app)

    categories_response = client.get("/catalog/categories")
    products_response = client.get("/catalog/products")
    detail_response = client.get("/catalog/products/portable-projector")
    missing_response = client.get("/catalog/products/secret-prototype")

    assert categories_response.status_code == 200
    assert categories_response.json()[0]["product_count"] == 1

    assert products_response.status_code == 200
    payload = products_response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["slug"] == "portable-projector"
    assert payload["items"][0]["is_in_stock"] is True
    assert payload["items"][0]["available_stock"] == 6

    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert detail_payload["slug"] == "portable-projector"
    assert detail_payload["variants"][0]["sku"] == "PROJ-001"
    assert detail_payload["variants"][0]["available_stock"] == 6

    assert missing_response.status_code == 404


def test_admin_product_create_update_and_inventory_adjustment() -> None:
    with SessionLocal() as session:
        category = CommerceCategory(name="Home", slug="home", is_active=True, sort_order=1)
        session.add(category)
        session.commit()
        session.refresh(category)
        category_id = str(category.id)

    token = create_admin_token()
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post(
        "/admin/products",
        headers=headers,
        json={
            "category_id": category_id,
            "name": "Coffee Maker",
            "slug": "coffee-maker",
            "description": "Hot coffee at home.",
            "short_description": "Single-touch brew flow.",
            "status": "active",
            "brand": "DataPulse Home",
            "base_price": 310.0,
            "compare_at_price": 359.0,
            "currency": "BRL",
            "images": [
                {"url": "/file.svg", "alt_text": "Coffee maker hero", "sort_order": 0, "is_primary": True}
            ],
            "variants": [
                {
                    "sku": "COFFEE-001",
                    "name": "Coffee Maker Standard",
                    "attributes": {"voltage": "220v"},
                    "price": 299.0,
                    "status": "active",
                    "stock_on_hand": 12,
                    "stock_reserved": 2,
                    "low_stock_threshold": 4,
                    "allow_backorder": False,
                }
            ],
        },
    )

    assert create_response.status_code == 201
    created_payload = create_response.json()
    product_id = created_payload["id"]
    variant_id = created_payload["variants"][0]["id"]
    assert created_payload["variants"][0]["inventory"]["available_stock"] == 10

    update_response = client.put(
        f"/admin/products/{product_id}",
        headers=headers,
        json={
            "category_id": category_id,
            "name": "Coffee Maker Deluxe",
            "slug": "coffee-maker-deluxe",
            "description": "Updated brew flow.",
            "short_description": "Deluxe edition.",
            "status": "active",
            "brand": "DataPulse Home",
            "base_price": 340.0,
            "compare_at_price": 389.0,
            "currency": "BRL",
            "images": [
                {"url": "/globe.svg", "alt_text": "Coffee maker deluxe", "sort_order": 0, "is_primary": True}
            ],
            "variants": [
                {
                    "id": variant_id,
                    "sku": "COFFEE-001",
                    "name": "Coffee Maker Deluxe",
                    "attributes": {"voltage": "220v", "finish": "matte"},
                    "price": 329.0,
                    "status": "active",
                    "stock_on_hand": 15,
                    "stock_reserved": 1,
                    "low_stock_threshold": 3,
                    "allow_backorder": False,
                }
            ],
        },
    )

    assert update_response.status_code == 200
    updated_payload = update_response.json()
    assert updated_payload["name"] == "Coffee Maker Deluxe"
    assert updated_payload["slug"] == "coffee-maker-deluxe"
    assert updated_payload["variants"][0]["inventory"]["available_stock"] == 14

    adjustment_response = client.post(
        "/admin/inventory/adjustments",
        headers=headers,
        json={"variant_id": variant_id, "quantity_delta": -3, "reason": "Damaged boxes"},
    )
    assert adjustment_response.status_code == 200
    adjustment_payload = adjustment_response.json()
    assert adjustment_payload["stock_on_hand"] == 12
    assert adjustment_payload["available_stock"] == 11

    negative_response = client.post(
        "/admin/inventory/adjustments",
        headers=headers,
        json={"variant_id": variant_id, "quantity_delta": -30, "reason": "Bad adjustment"},
    )
    assert negative_response.status_code == 400

    with SessionLocal() as session:
        product = session.scalar(select(CommerceProduct).where(CommerceProduct.id == product_id))
        variant = session.scalar(select(CommerceProductVariant).where(CommerceProductVariant.id == variant_id))
        inventory = session.scalar(select(CommerceInventoryItem).where(CommerceInventoryItem.variant_id == variant.id))
        movements = session.scalars(
            select(CommerceInventoryMovement).where(CommerceInventoryMovement.variant_id == variant.id)
        ).all()
        assert product is not None
        assert product.slug == "coffee-maker-deluxe"
        assert inventory is not None
        assert inventory.stock_on_hand == 12
        assert len(movements) == 1


def test_admin_routes_require_admin_role() -> None:
    client = TestClient(app)

    response = client.get("/admin/products")
    assert response.status_code == 401
