import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.commerce_category import CommerceCategory
from app.models.commerce_customer import CommerceCustomer
from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_inventory_movement import CommerceInventoryMovement
from app.models.commerce_product import CommerceProduct
from app.models.commerce_product_image import CommerceProductImage
from app.models.commerce_product_variant import CommerceProductVariant
from app.models.commerce_user import CommerceUser

DEMO_CUSTOMER_EMAIL = "customer@datapulse.local"
DEMO_CUSTOMER_PASSWORD = "customer123-local-only"

DEMO_CATALOG = [
    {
        "category": {"name": "Electronics", "slug": "electronics", "description": "Devices for home and work.", "sort_order": 1},
        "product": {
            "name": "Portable Projector",
            "slug": "portable-projector",
            "description": "Compact projector tuned for demo rooms, living rooms, and travel kits.",
            "short_description": "Compact cinema-ready projector.",
            "status": "active",
            "brand": "DataPulse Vision",
            "base_price": 549.0,
            "compare_at_price": 629.0,
            "seo_title": "Portable Projector | DataPulse Commerce",
            "seo_description": "Portable projector with flexible setup options and bright output for small rooms.",
        },
        "images": [
            {"url": "/globe.svg", "alt_text": "Portable projector hero", "sort_order": 0, "is_primary": True},
            {"url": "/window.svg", "alt_text": "Portable projector side angle", "sort_order": 1, "is_primary": False},
        ],
        "variants": [
            {
                "sku": "PROJ-001",
                "name": "Portable Projector Standard",
                "attributes": {"color": "graphite", "bundle": "standard"},
                "price": 549.0,
                "weight_grams": 1800,
                "status": "active",
                "stock_on_hand": 18,
                "low_stock_threshold": 4,
            },
            {
                "sku": "PROJ-002",
                "name": "Portable Projector Travel Kit",
                "attributes": {"color": "graphite", "bundle": "travel-kit"},
                "price": 629.0,
                "weight_grams": 2200,
                "status": "active",
                "stock_on_hand": 8,
                "low_stock_threshold": 3,
            },
        ],
    },
    {
        "category": {"name": "Home", "slug": "home", "description": "Comfort and utility for the house.", "sort_order": 2},
        "product": {
            "name": "Coffee Maker Deluxe",
            "slug": "coffee-maker-deluxe",
            "description": "Programmable coffee maker with two brew profiles and thermal retention.",
            "short_description": "Programmable premium coffee maker.",
            "status": "active",
            "brand": "DataPulse Home",
            "base_price": 329.0,
            "compare_at_price": 379.0,
            "seo_title": "Coffee Maker Deluxe | DataPulse Commerce",
            "seo_description": "Programmable coffee maker with premium thermal retention and compact footprint.",
        },
        "images": [
            {"url": "/file.svg", "alt_text": "Coffee maker product hero", "sort_order": 0, "is_primary": True},
        ],
        "variants": [
            {
                "sku": "COFFEE-001",
                "name": "Coffee Maker Deluxe 220V",
                "attributes": {"voltage": "220v"},
                "price": 329.0,
                "weight_grams": 3900,
                "status": "active",
                "stock_on_hand": 21,
                "low_stock_threshold": 5,
            },
            {
                "sku": "COFFEE-002",
                "name": "Coffee Maker Deluxe 110V",
                "attributes": {"voltage": "110v"},
                "price": 329.0,
                "weight_grams": 3900,
                "status": "active",
                "stock_on_hand": 13,
                "low_stock_threshold": 5,
            },
        ],
    },
    {
        "category": {"name": "Accessories", "slug": "accessories", "description": "Small tools and add-ons.", "sort_order": 3},
        "product": {
            "name": "Travel Mug",
            "slug": "travel-mug",
            "description": "Insulated travel mug built for commute-ready coffee and tea carry.",
            "short_description": "Insulated mug for daily carry.",
            "status": "active",
            "brand": "DataPulse Carry",
            "base_price": 79.0,
            "compare_at_price": 99.0,
            "seo_title": "Travel Mug | DataPulse Commerce",
            "seo_description": "Insulated travel mug with leak-resistant lid and all-day usability.",
        },
        "images": [
            {"url": "/next.svg", "alt_text": "Travel mug hero", "sort_order": 0, "is_primary": True},
        ],
        "variants": [
            {
                "sku": "MUG-001",
                "name": "Travel Mug 500ml",
                "attributes": {"size": "500ml", "color": "sand"},
                "price": 79.0,
                "weight_grams": 350,
                "status": "active",
                "stock_on_hand": 42,
                "low_stock_threshold": 10,
            },
            {
                "sku": "MUG-002",
                "name": "Travel Mug 750ml",
                "attributes": {"size": "750ml", "color": "midnight"},
                "price": 89.0,
                "weight_grams": 420,
                "status": "active",
                "stock_on_hand": 27,
                "low_stock_threshold": 8,
            },
        ],
    },
    {
        "category": {"name": "Fitness", "slug": "fitness", "description": "Demo fitness catalog entries.", "sort_order": 4},
        "product": {
            "name": "Adjustable Dumbbells",
            "slug": "adjustable-dumbbells",
            "description": "Space-saving adjustable dumbbells for compact home workout setups.",
            "short_description": "Compact adjustable dumbbell set.",
            "status": "active",
            "brand": "DataPulse Motion",
            "base_price": 899.0,
            "compare_at_price": 999.0,
            "seo_title": "Adjustable Dumbbells | DataPulse Commerce",
            "seo_description": "Adjustable dumbbells for strength routines with compact storage.",
        },
        "images": [
            {"url": "/vercel.svg", "alt_text": "Adjustable dumbbells hero", "sort_order": 0, "is_primary": True},
        ],
        "variants": [
            {
                "sku": "FIT-001",
                "name": "Adjustable Dumbbells 24kg",
                "attributes": {"weight_range": "2kg-24kg"},
                "price": 899.0,
                "weight_grams": 24000,
                "status": "active",
                "stock_on_hand": 9,
                "low_stock_threshold": 2,
            }
        ],
    },
]


def upsert_admin_user(session: Session) -> CommerceUser:
    settings = get_settings()
    existing_user = session.scalar(
        select(CommerceUser).where(CommerceUser.email == settings.admin_demo_email.lower())
    )
    if existing_user is not None:
        existing_user.role = "admin"
        existing_user.is_active = True
        existing_user.password_hash = hash_password(settings.admin_demo_password)
        session.flush()
        return existing_user

    user = CommerceUser(
        email=settings.admin_demo_email.lower(),
        password_hash=hash_password(settings.admin_demo_password),
        role="admin",
        is_active=True,
    )
    session.add(user)
    session.flush()
    return user


def upsert_customer_user(session: Session) -> CommerceUser:
    existing_user = session.scalar(select(CommerceUser).where(CommerceUser.email == DEMO_CUSTOMER_EMAIL))
    if existing_user is None:
        existing_user = CommerceUser(
            email=DEMO_CUSTOMER_EMAIL,
            password_hash=hash_password(DEMO_CUSTOMER_PASSWORD),
            role="customer",
            is_active=True,
        )
        session.add(existing_user)
        session.flush()
    else:
        existing_user.role = "customer"
        existing_user.is_active = True
        existing_user.password_hash = hash_password(DEMO_CUSTOMER_PASSWORD)
        session.flush()

    customer = session.scalar(select(CommerceCustomer).where(CommerceCustomer.user_id == existing_user.id))
    if customer is None:
        customer = CommerceCustomer(user_id=existing_user.id)
        session.add(customer)

    customer.first_name = "Demo"
    customer.last_name = "Customer"
    customer.phone = "+55 11 90000-0101"
    customer.marketing_opt_in = True
    session.flush()
    return existing_user


def get_or_create_category(session: Session, payload: dict) -> CommerceCategory:
    category = session.scalar(select(CommerceCategory).where(CommerceCategory.slug == payload["slug"]))
    if category is None:
        category = CommerceCategory(
            name=payload["name"],
            slug=payload["slug"],
            description=payload["description"],
            sort_order=payload["sort_order"],
            is_active=True,
        )
        session.add(category)
        session.flush()

    category.name = payload["name"]
    category.description = payload["description"]
    category.sort_order = payload["sort_order"]
    category.is_active = True
    return category


def upsert_product_catalog(session: Session, admin_user: CommerceUser) -> None:
    settings = get_settings()

    for item in DEMO_CATALOG:
        category = get_or_create_category(session, item["category"])
        product_payload = item["product"]
        product = session.scalar(select(CommerceProduct).where(CommerceProduct.slug == product_payload["slug"]))
        if product is None:
            product = CommerceProduct(
                category_id=category.id,
                name=product_payload["name"],
                slug=product_payload["slug"],
                description=product_payload["description"],
                short_description=product_payload["short_description"],
                status=product_payload["status"],
                brand=product_payload["brand"],
                base_price=product_payload["base_price"],
                compare_at_price=product_payload["compare_at_price"],
                currency=settings.store_currency,
                seo_title=product_payload["seo_title"],
                seo_description=product_payload["seo_description"],
            )
            session.add(product)
            session.flush()

        product.category_id = category.id
        product.name = product_payload["name"]
        product.description = product_payload["description"]
        product.short_description = product_payload["short_description"]
        product.status = product_payload["status"]
        product.brand = product_payload["brand"]
        product.base_price = product_payload["base_price"]
        product.compare_at_price = product_payload["compare_at_price"]
        product.currency = settings.store_currency
        product.seo_title = product_payload["seo_title"]
        product.seo_description = product_payload["seo_description"]

        existing_images = session.scalars(
            select(CommerceProductImage).where(CommerceProductImage.product_id == product.id)
        ).all()
        for image in existing_images:
            session.delete(image)
        session.flush()

        for image_payload in item["images"]:
            session.add(
                CommerceProductImage(
                    product_id=product.id,
                    url=image_payload["url"],
                    alt_text=image_payload["alt_text"],
                    sort_order=image_payload["sort_order"],
                    is_primary=image_payload["is_primary"],
                )
            )

        existing_variants = {
            variant.sku: variant
            for variant in session.scalars(
                select(CommerceProductVariant).where(CommerceProductVariant.product_id == product.id)
            ).all()
        }

        for variant_payload in item["variants"]:
            variant = existing_variants.get(variant_payload["sku"])
            if variant is None:
                variant = CommerceProductVariant(product_id=product.id, sku=variant_payload["sku"], name=variant_payload["name"])
                session.add(variant)
                session.flush()

            variant.name = variant_payload["name"]
            variant.attributes = variant_payload["attributes"]
            variant.price = variant_payload["price"]
            variant.weight_grams = variant_payload["weight_grams"]
            variant.status = variant_payload["status"]

            inventory = session.scalar(
                select(CommerceInventoryItem).where(CommerceInventoryItem.variant_id == variant.id)
            )
            created_inventory = inventory is None
            if inventory is None:
                inventory = CommerceInventoryItem(variant_id=variant.id)
                session.add(inventory)
            inventory.stock_on_hand = variant_payload["stock_on_hand"]
            inventory.stock_reserved = 0
            inventory.low_stock_threshold = variant_payload["low_stock_threshold"]
            inventory.allow_backorder = False
            session.flush()

            if created_inventory:
                session.add(
                    CommerceInventoryMovement(
                        variant_id=variant.id,
                        movement_type="adjustment",
                        quantity_delta=variant_payload["stock_on_hand"],
                        reason="Initial demo catalog stock.",
                        reference_type="admin",
                        created_by_user_id=admin_user.id,
                    )
                )


def main() -> None:
    with SessionLocal() as session:
        admin_user = upsert_admin_user(session)
        upsert_customer_user(session)
        upsert_product_catalog(session, admin_user)
        session.commit()

    settings = get_settings()
    print("seed_status= ok")
    print("admin_demo_email=", settings.admin_demo_email)
    print("admin_demo_password=", settings.admin_demo_password)
    print("customer_demo_email=", DEMO_CUSTOMER_EMAIL)
    print("customer_demo_password=", DEMO_CUSTOMER_PASSWORD)
    print("catalog_products=", len(DEMO_CATALOG))


if __name__ == "__main__":
    main()
