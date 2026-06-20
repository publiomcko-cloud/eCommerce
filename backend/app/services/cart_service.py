from __future__ import annotations

import secrets
import uuid
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.commerce_cart import CommerceCart
from app.models.commerce_cart_item import CommerceCartItem
from app.models.commerce_customer import CommerceCustomer
from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_product import CommerceProduct
from app.models.commerce_product_image import CommerceProductImage
from app.models.commerce_product_variant import CommerceProductVariant
from app.schemas.cart import AddCartItemRequest, CartItemResponse, CartResponse, UpdateCartItemRequest
from app.services.auth_service import AuthContext
from app.services.commerce_event_service import emit_commerce_event


@dataclass
class ResolvedCart:
    cart: CommerceCart
    cart_token: str | None


def to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def _available_stock_snapshot(inventory: CommerceInventoryItem | None) -> tuple[int, bool]:
    if inventory is None:
        return 0, False
    return inventory.stock_on_hand - inventory.stock_reserved, inventory.allow_backorder


def _get_guest_cart_by_token(session: Session, cart_token: str) -> CommerceCart | None:
    return session.scalar(
        select(CommerceCart).where(
            CommerceCart.anonymous_token == cart_token,
            CommerceCart.status == "active",
            CommerceCart.customer_id.is_(None),
        )
    )


def _get_active_customer_cart(session: Session, customer_id: uuid.UUID) -> CommerceCart | None:
    return session.scalar(
        select(CommerceCart)
        .where(
            CommerceCart.customer_id == customer_id,
            CommerceCart.status == "active",
        )
        .order_by(CommerceCart.created_at.asc())
    )


def _create_guest_cart(session: Session) -> CommerceCart:
    cart = CommerceCart(
        anonymous_token=secrets.token_urlsafe(32),
        status="active",
        currency=get_settings().store_currency,
    )
    session.add(cart)
    session.flush()
    return cart


def _create_customer_cart(session: Session, customer: CommerceCustomer) -> CommerceCart:
    cart = CommerceCart(
        customer_id=customer.id,
        status="active",
        currency=get_settings().store_currency,
    )
    session.add(cart)
    session.flush()
    return cart


def _require_customer_profile(auth_context: AuthContext | None) -> CommerceCustomer | None:
    if auth_context is None:
        return None
    if auth_context.customer is None:
        raise ValueError("Authenticated cart access requires a customer profile.")
    return auth_context.customer


def _get_sellable_variant(
    session: Session,
    variant_id: str,
) -> tuple[CommerceProductVariant, CommerceProduct, CommerceInventoryItem | None]:
    row = session.execute(
        select(CommerceProductVariant, CommerceProduct, CommerceInventoryItem)
        .join(CommerceProduct, CommerceProduct.id == CommerceProductVariant.product_id)
        .outerjoin(CommerceInventoryItem, CommerceInventoryItem.variant_id == CommerceProductVariant.id)
        .where(CommerceProductVariant.id == uuid.UUID(variant_id))
    ).first()
    if row is None:
        raise ValueError("Variant not found.")

    variant, product, inventory = row
    if product.status != "active" or variant.status != "active":
        raise ValueError("Inactive variants cannot be added to the cart.")
    return variant, product, inventory


def _validate_quantity_against_inventory(quantity: int, inventory: CommerceInventoryItem | None) -> None:
    if quantity < 1:
        raise ValueError("Cart quantity must be at least 1.")
    available_stock, allow_backorder = _available_stock_snapshot(inventory)
    if allow_backorder:
        return
    if available_stock < quantity:
        raise ValueError("Requested quantity exceeds available stock.")


def _normalized_merge_quantity(
    existing_quantity: int,
    added_quantity: int,
    inventory: CommerceInventoryItem | None,
) -> int:
    available_stock, allow_backorder = _available_stock_snapshot(inventory)
    if allow_backorder:
        return existing_quantity + added_quantity
    if available_stock <= existing_quantity:
        return existing_quantity
    return min(available_stock, existing_quantity + added_quantity)


def _find_cart_item(
    session: Session,
    *,
    cart_id: uuid.UUID,
    variant_id: uuid.UUID,
) -> CommerceCartItem | None:
    return session.scalar(
        select(CommerceCartItem).where(
            CommerceCartItem.cart_id == cart_id,
            CommerceCartItem.variant_id == variant_id,
        )
    )


def _load_cart_items_with_context(
    session: Session,
    cart_id: uuid.UUID,
) -> list[tuple[CommerceCartItem, CommerceProductVariant, CommerceProduct, CommerceInventoryItem | None, str | None]]:
    primary_image_subquery = (
        select(CommerceProductImage.url)
        .where(CommerceProductImage.product_id == CommerceProduct.id)
        .order_by(CommerceProductImage.is_primary.desc(), CommerceProductImage.sort_order.asc(), CommerceProductImage.created_at.asc())
        .limit(1)
        .scalar_subquery()
    )
    return session.execute(
        select(
            CommerceCartItem,
            CommerceProductVariant,
            CommerceProduct,
            CommerceInventoryItem,
            primary_image_subquery.label("primary_image_url"),
        )
        .join(CommerceProductVariant, CommerceProductVariant.id == CommerceCartItem.variant_id)
        .join(CommerceProduct, CommerceProduct.id == CommerceProductVariant.product_id)
        .outerjoin(CommerceInventoryItem, CommerceInventoryItem.variant_id == CommerceProductVariant.id)
        .where(CommerceCartItem.cart_id == cart_id)
        .order_by(CommerceCartItem.created_at.asc())
    ).all()


def _serialize_cart(session: Session, cart: CommerceCart) -> CartResponse:
    rows = _load_cart_items_with_context(session, cart.id)
    items: list[CartItemResponse] = []
    subtotal = 0.0

    for cart_item, variant, product, inventory, primary_image_url in rows:
        available_stock, allow_backorder = _available_stock_snapshot(inventory)
        unit_price = to_float(variant.price if variant.price is not None else product.base_price)
        line_total = round(unit_price * cart_item.quantity, 2)
        subtotal += line_total
        items.append(
            CartItemResponse(
                id=str(cart_item.id),
                variant_id=str(variant.id),
                product_id=str(product.id),
                product_name=product.name,
                product_slug=product.slug,
                variant_name=variant.name,
                sku=variant.sku,
                quantity=cart_item.quantity,
                unit_price=unit_price,
                line_total=line_total,
                currency=cart.currency,
                primary_image_url=primary_image_url,
                available_stock=max(available_stock, 0),
                allow_backorder=allow_backorder,
                is_in_stock=available_stock > 0 or allow_backorder,
                created_at=cart_item.created_at,
                updated_at=cart_item.updated_at,
            )
        )

    return CartResponse(
        id=str(cart.id),
        cart_token=cart.anonymous_token if cart.customer_id is None and cart.status == "active" else None,
        customer_id=str(cart.customer_id) if cart.customer_id is not None else None,
        item_count=sum(item.quantity for item in items),
        unique_item_count=len(items),
        subtotal=round(subtotal, 2),
        currency=cart.currency,
        items=items,
    )


def _merge_guest_cart_into_customer(
    session: Session,
    *,
    guest_cart: CommerceCart,
    customer_cart: CommerceCart,
) -> None:
    guest_items = session.scalars(
        select(CommerceCartItem).where(CommerceCartItem.cart_id == guest_cart.id)
    ).all()
    for guest_item in guest_items:
        variant, product, inventory = _get_sellable_variant(session, str(guest_item.variant_id))
        existing_item = _find_cart_item(session, cart_id=customer_cart.id, variant_id=variant.id)
        existing_quantity = existing_item.quantity if existing_item is not None else 0
        merged_quantity = _normalized_merge_quantity(existing_quantity, guest_item.quantity, inventory)

        if existing_item is None and merged_quantity > 0:
            session.add(
                CommerceCartItem(
                    cart_id=customer_cart.id,
                    variant_id=variant.id,
                    quantity=merged_quantity,
                )
            )
        elif existing_item is not None:
            existing_item.quantity = merged_quantity

        session.delete(guest_item)

    guest_cart.status = "merged"
    guest_cart.anonymous_token = None
    session.flush()


def resolve_cart(
    session: Session,
    *,
    auth_context: AuthContext | None,
    cart_token: str | None,
    create_if_missing: bool = True,
) -> ResolvedCart:
    customer = _require_customer_profile(auth_context)
    guest_cart = _get_guest_cart_by_token(session, cart_token) if cart_token else None

    if customer is not None:
        customer_cart = _get_active_customer_cart(session, customer.id)
        if customer_cart is None and create_if_missing:
            customer_cart = _create_customer_cart(session, customer)
        if customer_cart is None:
            raise ValueError("Cart not found.")

        if guest_cart is not None and guest_cart.id != customer_cart.id:
            _merge_guest_cart_into_customer(session, guest_cart=guest_cart, customer_cart=customer_cart)

        session.flush()
        return ResolvedCart(cart=customer_cart, cart_token=None)

    if guest_cart is not None:
        return ResolvedCart(cart=guest_cart, cart_token=guest_cart.anonymous_token)

    if not create_if_missing:
        raise ValueError("Cart not found.")

    created_guest_cart = _create_guest_cart(session)
    return ResolvedCart(cart=created_guest_cart, cart_token=created_guest_cart.anonymous_token)


def get_cart(
    session: Session,
    *,
    auth_context: AuthContext | None,
    cart_token: str | None,
) -> CartResponse:
    resolved = resolve_cart(session, auth_context=auth_context, cart_token=cart_token, create_if_missing=True)
    session.commit()
    return _serialize_cart(session, resolved.cart)


def add_cart_item(
    session: Session,
    *,
    auth_context: AuthContext | None,
    cart_token: str | None,
    payload: AddCartItemRequest,
) -> CartResponse:
    resolved = resolve_cart(session, auth_context=auth_context, cart_token=cart_token, create_if_missing=True)
    variant, _, inventory = _get_sellable_variant(session, payload.variant_id)
    existing_item = _find_cart_item(session, cart_id=resolved.cart.id, variant_id=variant.id)
    desired_quantity = payload.quantity + (existing_item.quantity if existing_item is not None else 0)
    _validate_quantity_against_inventory(desired_quantity, inventory)

    if existing_item is None:
        session.add(
            CommerceCartItem(
                cart_id=resolved.cart.id,
                variant_id=variant.id,
                quantity=payload.quantity,
            )
        )
    else:
        existing_item.quantity = desired_quantity

    emit_commerce_event(
        session,
        event_type="cart_item_added",
        auth_context=auth_context,
        cart_id=resolved.cart.id,
        product_id=variant.product_id,
        payload={"variant_id": str(variant.id), "quantity": payload.quantity},
    )
    session.commit()
    return _serialize_cart(session, resolved.cart)


def update_cart_item(
    session: Session,
    *,
    auth_context: AuthContext | None,
    cart_token: str | None,
    item_id: str,
    payload: UpdateCartItemRequest,
) -> CartResponse:
    resolved = resolve_cart(session, auth_context=auth_context, cart_token=cart_token, create_if_missing=True)
    cart_item = session.get(CommerceCartItem, uuid.UUID(item_id))
    if cart_item is None or cart_item.cart_id != resolved.cart.id:
        raise ValueError("Cart item not found.")

    _, _, inventory = _get_sellable_variant(session, str(cart_item.variant_id))
    _validate_quantity_against_inventory(payload.quantity, inventory)
    cart_item.quantity = payload.quantity
    session.commit()
    return _serialize_cart(session, resolved.cart)


def remove_cart_item(
    session: Session,
    *,
    auth_context: AuthContext | None,
    cart_token: str | None,
    item_id: str,
) -> CartResponse:
    resolved = resolve_cart(session, auth_context=auth_context, cart_token=cart_token, create_if_missing=True)
    cart_item = session.get(CommerceCartItem, uuid.UUID(item_id))
    if cart_item is None or cart_item.cart_id != resolved.cart.id:
        raise ValueError("Cart item not found.")

    session.delete(cart_item)
    session.commit()
    return _serialize_cart(session, resolved.cart)
