from __future__ import annotations

import uuid
from collections import defaultdict
from decimal import Decimal
from typing import Iterable

from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.models.commerce_category import CommerceCategory
from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_product import CommerceProduct
from app.models.commerce_product_image import CommerceProductImage
from app.models.commerce_product_variant import CommerceProductVariant
from app.schemas.catalog import (
    AdminInventoryStateResponse,
    AdminProductListItemResponse,
    AdminProductListResponse,
    AdminProductResponse,
    AdminProductUpsertRequest,
    AdminProductVariantResponse,
    CatalogCategoryResponse,
    CatalogVariantResponse,
    ProductCardResponse,
    ProductDetailResponse,
    ProductImageResponse,
    ProductListResponse,
)
from app.services.commerce_event_service import emit_commerce_event


def to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def _inventory_snapshot(inventory: CommerceInventoryItem | None) -> tuple[int, int, int, bool]:
    if inventory is None:
        return 0, 0, 0, False
    available_stock = inventory.stock_on_hand - inventory.stock_reserved
    return inventory.stock_on_hand, inventory.stock_reserved, available_stock, inventory.allow_backorder


def _variant_effective_price(product: CommerceProduct, variant: CommerceProductVariant) -> float:
    return to_float(variant.price if variant.price is not None else product.base_price)


def _serialize_image(image: CommerceProductImage) -> ProductImageResponse:
    return ProductImageResponse(
        id=str(image.id),
        url=image.url,
        alt_text=image.alt_text,
        sort_order=image.sort_order,
        is_primary=image.is_primary,
    )


def _load_images_by_product_id(session: Session, product_ids: Iterable[uuid.UUID]) -> dict[uuid.UUID, list[CommerceProductImage]]:
    product_ids = list(product_ids)
    if not product_ids:
        return {}
    rows = session.scalars(
        select(CommerceProductImage)
        .where(CommerceProductImage.product_id.in_(product_ids))
        .order_by(CommerceProductImage.is_primary.desc(), CommerceProductImage.sort_order.asc(), CommerceProductImage.created_at.asc())
    ).all()
    result: dict[uuid.UUID, list[CommerceProductImage]] = defaultdict(list)
    for row in rows:
        result[row.product_id].append(row)
    return result


def _load_variants_by_product_id(
    session: Session,
    product_ids: Iterable[uuid.UUID],
    *,
    active_only: bool,
) -> dict[uuid.UUID, list[tuple[CommerceProductVariant, CommerceInventoryItem | None]]]:
    product_ids = list(product_ids)
    if not product_ids:
        return {}

    query = (
        select(CommerceProductVariant, CommerceInventoryItem)
        .outerjoin(CommerceInventoryItem, CommerceInventoryItem.variant_id == CommerceProductVariant.id)
        .where(CommerceProductVariant.product_id.in_(product_ids))
        .order_by(CommerceProductVariant.created_at.asc())
    )
    if active_only:
        query = query.where(CommerceProductVariant.status == "active")

    rows = session.execute(query).all()
    result: dict[uuid.UUID, list[tuple[CommerceProductVariant, CommerceInventoryItem | None]]] = defaultdict(list)
    for variant, inventory in rows:
        result[variant.product_id].append((variant, inventory))
    return result


def _serialize_public_category(
    category: CommerceCategory,
    product_count: int = 0,
) -> CatalogCategoryResponse:
    return CatalogCategoryResponse(
        id=str(category.id),
        name=category.name,
        slug=category.slug,
        description=category.description,
        sort_order=category.sort_order,
        product_count=product_count,
    )


def _serialize_public_variant(
    product: CommerceProduct,
    variant: CommerceProductVariant,
    inventory: CommerceInventoryItem | None,
) -> CatalogVariantResponse:
    _, _, available_stock, allow_backorder = _inventory_snapshot(inventory)
    return CatalogVariantResponse(
        id=str(variant.id),
        sku=variant.sku,
        name=variant.name,
        attributes=variant.attributes or {},
        price=to_float(variant.price) if variant.price is not None else None,
        effective_price=_variant_effective_price(product, variant),
        weight_grams=variant.weight_grams,
        status=variant.status,
        available_stock=available_stock,
        allow_backorder=allow_backorder,
        is_in_stock=available_stock > 0 or allow_backorder,
    )


def _serialize_admin_variant(
    product: CommerceProduct,
    variant: CommerceProductVariant,
    inventory: CommerceInventoryItem | None,
) -> AdminProductVariantResponse:
    stock_on_hand, stock_reserved, available_stock, allow_backorder = _inventory_snapshot(inventory)
    low_stock_threshold = inventory.low_stock_threshold if inventory is not None else 5
    return AdminProductVariantResponse(
        id=str(variant.id),
        sku=variant.sku,
        name=variant.name,
        attributes=variant.attributes or {},
        price=to_float(variant.price) if variant.price is not None else None,
        effective_price=_variant_effective_price(product, variant),
        weight_grams=variant.weight_grams,
        status=variant.status,
        inventory=AdminInventoryStateResponse(
            stock_on_hand=stock_on_hand,
            stock_reserved=stock_reserved,
            available_stock=available_stock,
            low_stock_threshold=low_stock_threshold,
            allow_backorder=allow_backorder,
        ),
    )


def list_catalog_categories(session: Session) -> list[CatalogCategoryResponse]:
    rows = session.execute(
        select(
            CommerceCategory,
            func.count(CommerceProduct.id).label("product_count"),
        )
        .outerjoin(
            CommerceProduct,
            (CommerceProduct.category_id == CommerceCategory.id) & (CommerceProduct.status == "active"),
        )
        .where(CommerceCategory.is_active.is_(True))
        .group_by(CommerceCategory.id)
        .order_by(CommerceCategory.sort_order.asc(), CommerceCategory.name.asc())
    ).all()
    return [_serialize_public_category(category, int(product_count or 0)) for category, product_count in rows]


def _build_catalog_filters(*, q: str | None = None, category_slug: str | None = None) -> list:
    filters = [CommerceProduct.status == "active", CommerceCategory.is_active.is_(True)]
    if category_slug:
        filters.append(CommerceCategory.slug == category_slug)
    if q:
        search_value = f"%{q.strip()}%"
        filters.append(
            or_(
                CommerceProduct.name.ilike(search_value),
                CommerceProduct.short_description.ilike(search_value),
                CommerceProduct.description.ilike(search_value),
                cast(CommerceProduct.base_price, String).ilike(search_value),
            )
        )
    return filters


def list_catalog_products(
    session: Session,
    *,
    q: str | None = None,
    category_slug: str | None = None,
    limit: int = 24,
    offset: int = 0,
) -> ProductListResponse:
    filters = _build_catalog_filters(q=q, category_slug=category_slug)

    total = session.scalar(
        select(func.count(CommerceProduct.id))
        .select_from(CommerceProduct)
        .join(CommerceCategory, CommerceProduct.category_id == CommerceCategory.id)
        .where(*filters)
    ) or 0

    rows = session.execute(
        select(CommerceProduct, CommerceCategory)
        .join(CommerceCategory, CommerceProduct.category_id == CommerceCategory.id)
        .where(*filters)
        .order_by(CommerceProduct.created_at.desc(), CommerceProduct.name.asc())
        .limit(limit)
        .offset(offset)
    ).all()

    products = [product for product, _ in rows]
    images_by_product = _load_images_by_product_id(session, [product.id for product in products])
    variants_by_product = _load_variants_by_product_id(session, [product.id for product in products], active_only=True)

    items: list[ProductCardResponse] = []
    for product, category in rows:
        images = images_by_product.get(product.id, [])
        primary_image = images[0].url if images else None
        variants = variants_by_product.get(product.id, [])
        effective_prices = [_variant_effective_price(product, variant) for variant, _ in variants]
        available_stock_values = []
        is_in_stock = False
        for _, inventory in variants:
            _, _, available_stock, allow_backorder = _inventory_snapshot(inventory)
            available_stock_values.append(max(available_stock, 0))
            if available_stock > 0 or allow_backorder:
                is_in_stock = True

        items.append(
            ProductCardResponse(
                id=str(product.id),
                name=product.name,
                slug=product.slug,
                short_description=product.short_description,
                category_name=category.name,
                category_slug=category.slug,
                brand=product.brand,
                price=min(effective_prices) if effective_prices else to_float(product.base_price),
                compare_at_price=to_float(product.compare_at_price) if product.compare_at_price is not None else None,
                currency=product.currency,
                primary_image_url=primary_image,
                is_in_stock=is_in_stock,
                available_stock=max(available_stock_values) if available_stock_values else 0,
                variant_count=len(variants),
            )
        )

    return ProductListResponse(total=int(total), limit=limit, offset=offset, items=items)


def get_catalog_product_by_slug(session: Session, slug: str) -> ProductDetailResponse:
    row = session.execute(
        select(CommerceProduct, CommerceCategory)
        .join(CommerceCategory, CommerceProduct.category_id == CommerceCategory.id)
        .where(
            CommerceProduct.slug == slug,
            CommerceProduct.status == "active",
            CommerceCategory.is_active.is_(True),
        )
    ).first()
    if row is None:
        raise ValueError("Product not found.")

    product, category = row
    emit_commerce_event(
        session,
        event_type="product_viewed",
        product_id=product.id,
        payload={"slug": product.slug, "name": product.name},
    )
    images = _load_images_by_product_id(session, [product.id]).get(product.id, [])
    variants = _load_variants_by_product_id(session, [product.id], active_only=True).get(product.id, [])
    serialized_variants = [_serialize_public_variant(product, variant, inventory) for variant, inventory in variants]

    response = ProductDetailResponse(
        id=str(product.id),
        name=product.name,
        slug=product.slug,
        description=product.description,
        short_description=product.short_description,
        brand=product.brand,
        price=min((variant.effective_price for variant in serialized_variants), default=to_float(product.base_price)),
        compare_at_price=to_float(product.compare_at_price) if product.compare_at_price is not None else None,
        currency=product.currency,
        category=_serialize_public_category(category),
        images=[_serialize_image(image) for image in images],
        variants=serialized_variants,
    )
    session.commit()
    return response


def list_admin_products(
    session: Session,
    *,
    status: str | None = None,
    category_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> AdminProductListResponse:
    filters = []
    if status:
        filters.append(CommerceProduct.status == status)
    if category_id:
        filters.append(CommerceProduct.category_id == uuid.UUID(category_id))

    total = session.scalar(
        select(func.count(CommerceProduct.id))
        .select_from(CommerceProduct)
        .where(*filters)
    ) or 0

    rows = session.execute(
        select(CommerceProduct, CommerceCategory)
        .join(CommerceCategory, CommerceProduct.category_id == CommerceCategory.id)
        .where(*filters)
        .order_by(CommerceProduct.updated_at.desc(), CommerceProduct.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    product_ids = [product.id for product, _ in rows]
    variants_by_product = _load_variants_by_product_id(session, product_ids, active_only=False)

    items = []
    for product, category in rows:
        variants = variants_by_product.get(product.id, [])
        total_available_stock = 0
        for _, inventory in variants:
            _, _, available_stock, allow_backorder = _inventory_snapshot(inventory)
            total_available_stock += available_stock if available_stock > 0 else 0
            if allow_backorder and available_stock < 0:
                total_available_stock += 0
        items.append(
            AdminProductListItemResponse(
                id=str(product.id),
                name=product.name,
                slug=product.slug,
                status=product.status,
                category_name=category.name,
                variant_count=len(variants),
                total_available_stock=total_available_stock,
                updated_at=product.updated_at,
            )
        )

    return AdminProductListResponse(total=int(total), limit=limit, offset=offset, items=items)


def _get_category_or_raise(session: Session, category_id: str) -> CommerceCategory:
    category = session.get(CommerceCategory, uuid.UUID(category_id))
    if category is None:
        raise ValueError("Category not found.")
    return category


def _assert_unique_product_slug(session: Session, slug: str, product_id: uuid.UUID | None = None) -> None:
    query = select(CommerceProduct).where(CommerceProduct.slug == slug)
    existing = session.scalar(query)
    if existing is not None and existing.id != product_id:
        raise ValueError("A product with this slug already exists.")


def _assert_unique_variant_skus(
    session: Session,
    variants: list,
    *,
    product_id: uuid.UUID | None = None,
) -> None:
    seen: set[str] = set()
    for variant in variants:
        if variant.sku in seen:
            raise ValueError("Variant SKUs must be unique within the product payload.")
        seen.add(variant.sku)
        existing = session.scalar(select(CommerceProductVariant).where(CommerceProductVariant.sku == variant.sku))
        if existing is not None:
            if product_id is None or existing.product_id != product_id or (variant.id and str(existing.id) != variant.id):
                raise ValueError(f"SKU already exists: {variant.sku}")


def _replace_images(session: Session, product_id: uuid.UUID, images: list) -> None:
    existing_images = session.scalars(
        select(CommerceProductImage).where(CommerceProductImage.product_id == product_id)
    ).all()
    for image in existing_images:
        session.delete(image)

    normalized_images = list(images)
    if normalized_images and not any(image.is_primary for image in normalized_images):
        first_image = normalized_images[0].model_copy(update={"is_primary": True})
        normalized_images[0] = first_image

    for image in normalized_images:
        session.add(
            CommerceProductImage(
                product_id=product_id,
                url=image.url,
                alt_text=image.alt_text,
                sort_order=image.sort_order,
                is_primary=image.is_primary,
            )
        )


def _upsert_variants(session: Session, product: CommerceProduct, variants: list) -> None:
    _assert_unique_variant_skus(session, variants, product_id=product.id)

    for variant_input in variants:
        if variant_input.id:
            variant = session.get(CommerceProductVariant, uuid.UUID(variant_input.id))
            if variant is None or variant.product_id != product.id:
                raise ValueError("Variant not found for this product.")
        else:
            variant = CommerceProductVariant(
                product_id=product.id,
                sku=variant_input.sku,
                name=variant_input.name,
                attributes=variant_input.attributes,
                price=variant_input.price,
                weight_grams=variant_input.weight_grams,
                status=variant_input.status,
            )
            session.add(variant)

        variant.sku = variant_input.sku
        variant.name = variant_input.name
        variant.attributes = variant_input.attributes
        variant.price = variant_input.price
        variant.weight_grams = variant_input.weight_grams
        variant.status = variant_input.status
        session.flush()

        inventory = session.scalar(
            select(CommerceInventoryItem).where(CommerceInventoryItem.variant_id == variant.id)
        )
        if inventory is None:
            inventory = CommerceInventoryItem(variant_id=variant.id)
            session.add(inventory)
        inventory.stock_on_hand = variant_input.stock_on_hand
        inventory.stock_reserved = variant_input.stock_reserved
        inventory.low_stock_threshold = variant_input.low_stock_threshold
        inventory.allow_backorder = variant_input.allow_backorder


def create_admin_product(session: Session, payload: AdminProductUpsertRequest) -> AdminProductResponse:
    category = _get_category_or_raise(session, payload.category_id)
    _assert_unique_product_slug(session, payload.slug)
    _assert_unique_variant_skus(session, payload.variants)

    product = CommerceProduct(
        category_id=category.id,
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        short_description=payload.short_description,
        status=payload.status,
        brand=payload.brand,
        base_price=payload.base_price,
        compare_at_price=payload.compare_at_price,
        currency=payload.currency,
        seo_title=payload.seo_title,
        seo_description=payload.seo_description,
    )
    session.add(product)
    session.flush()
    _replace_images(session, product.id, payload.images)
    _upsert_variants(session, product, payload.variants)
    session.commit()
    return get_admin_product(session, str(product.id))


def update_admin_product(session: Session, product_id: str, payload: AdminProductUpsertRequest) -> AdminProductResponse:
    product = session.get(CommerceProduct, uuid.UUID(product_id))
    if product is None:
        raise ValueError("Product not found.")
    category = _get_category_or_raise(session, payload.category_id)
    _assert_unique_product_slug(session, payload.slug, product.id)
    _assert_unique_variant_skus(session, payload.variants, product_id=product.id)

    product.category_id = category.id
    product.name = payload.name
    product.slug = payload.slug
    product.description = payload.description
    product.short_description = payload.short_description
    product.status = payload.status
    product.brand = payload.brand
    product.base_price = payload.base_price
    product.compare_at_price = payload.compare_at_price
    product.currency = payload.currency
    product.seo_title = payload.seo_title
    product.seo_description = payload.seo_description

    _replace_images(session, product.id, payload.images)
    _upsert_variants(session, product, payload.variants)
    session.commit()
    return get_admin_product(session, str(product.id))


def get_admin_product(session: Session, product_id: str) -> AdminProductResponse:
    row = session.execute(
        select(CommerceProduct, CommerceCategory)
        .join(CommerceCategory, CommerceProduct.category_id == CommerceCategory.id)
        .where(CommerceProduct.id == uuid.UUID(product_id))
    ).first()
    if row is None:
        raise ValueError("Product not found.")

    product, category = row
    images = _load_images_by_product_id(session, [product.id]).get(product.id, [])
    variants = _load_variants_by_product_id(session, [product.id], active_only=False).get(product.id, [])
    return AdminProductResponse(
        id=str(product.id),
        category_id=str(category.id),
        category_name=category.name,
        category_slug=category.slug,
        name=product.name,
        slug=product.slug,
        description=product.description,
        short_description=product.short_description,
        status=product.status,
        brand=product.brand,
        base_price=to_float(product.base_price),
        compare_at_price=to_float(product.compare_at_price) if product.compare_at_price is not None else None,
        currency=product.currency,
        seo_title=product.seo_title,
        seo_description=product.seo_description,
        created_at=product.created_at,
        updated_at=product.updated_at,
        images=[_serialize_image(image) for image in images],
        variants=[_serialize_admin_variant(product, variant, inventory) for variant, inventory in variants],
    )
