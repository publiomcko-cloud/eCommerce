from __future__ import annotations

import secrets
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.commerce_cart import CommerceCart
from app.models.commerce_cart_item import CommerceCartItem
from app.models.commerce_checkout_session import CommerceCheckoutSession
from app.models.commerce_customer import CommerceCustomer
from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_inventory_movement import CommerceInventoryMovement
from app.models.commerce_order import CommerceOrder
from app.models.commerce_order_item import CommerceOrderItem
from app.models.commerce_order_status_history import CommerceOrderStatusHistory
from app.models.commerce_product import CommerceProduct
from app.models.commerce_product_variant import CommerceProductVariant
from app.schemas.checkout import (
    CheckoutAddressInput,
    CheckoutAddressResponse,
    CheckoutSessionResponse,
    CheckoutTotalsResponse,
    CreateCheckoutSessionRequest,
    OrderItemResponse,
    OrderResponse,
    PlaceOrderRequest,
)
from app.services.auth_service import AuthContext
from app.services.cart_service import resolve_cart


def to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def _require_customer(auth_context: AuthContext) -> CommerceCustomer:
    if auth_context.customer is None:
        raise ValueError("Checkout requires a customer profile.")
    return auth_context.customer


def _serialize_address_snapshot(snapshot: dict) -> CheckoutAddressResponse:
    return CheckoutAddressResponse(
        recipient_name=snapshot["recipient_name"],
        phone=snapshot.get("phone"),
        line1=snapshot["line1"],
        line2=snapshot.get("line2"),
        city=snapshot["city"],
        region=snapshot["region"],
        postal_code=snapshot["postal_code"],
        country=snapshot["country"],
    )


def _snapshot_address(address: CheckoutAddressInput) -> dict:
    return {
        "recipient_name": address.recipient_name,
        "phone": address.phone,
        "line1": address.line1,
        "line2": address.line2,
        "city": address.city,
        "region": address.region,
        "postal_code": address.postal_code,
        "country": address.country,
    }


def _load_checkout_cart_rows(
    session: Session,
    cart_id: uuid.UUID,
) -> list[tuple[CommerceCartItem, CommerceProductVariant, CommerceProduct, CommerceInventoryItem | None]]:
    return session.execute(
        select(
            CommerceCartItem,
            CommerceProductVariant,
            CommerceProduct,
            CommerceInventoryItem,
        )
        .join(CommerceProductVariant, CommerceProductVariant.id == CommerceCartItem.variant_id)
        .join(CommerceProduct, CommerceProduct.id == CommerceProductVariant.product_id)
        .outerjoin(CommerceInventoryItem, CommerceInventoryItem.variant_id == CommerceProductVariant.id)
        .where(CommerceCartItem.cart_id == cart_id)
        .order_by(CommerceCartItem.created_at.asc())
    ).all()


def _validate_checkout_cart_rows(
    rows: list[tuple[CommerceCartItem, CommerceProductVariant, CommerceProduct, CommerceInventoryItem | None]],
) -> CheckoutTotalsResponse:
    if not rows:
        raise ValueError("Cannot checkout an empty cart.")

    subtotal = 0.0
    item_count = 0
    currency = rows[0][2].currency

    for cart_item, variant, product, inventory in rows:
        if product.status != "active" or variant.status != "active":
            raise ValueError("Checkout cannot proceed with inactive products or variants.")
        available_stock = (inventory.stock_on_hand - inventory.stock_reserved) if inventory is not None else 0
        allow_backorder = inventory.allow_backorder if inventory is not None else False
        if not allow_backorder and available_stock < cart_item.quantity:
            raise ValueError("Checkout quantity exceeds available stock.")
        unit_price = to_float(variant.price if variant.price is not None else product.base_price)
        subtotal += round(unit_price * cart_item.quantity, 2)
        item_count += cart_item.quantity

    return CheckoutTotalsResponse(
        item_count=item_count,
        unique_item_count=len(rows),
        subtotal=round(subtotal, 2),
        total=round(subtotal, 2),
        currency=currency,
    )


def _serialize_checkout_session(checkout_session: CommerceCheckoutSession) -> CheckoutSessionResponse:
    totals = checkout_session.totals_snapshot
    return CheckoutSessionResponse(
        id=str(checkout_session.id),
        cart_id=str(checkout_session.cart_id),
        customer_id=str(checkout_session.customer_id),
        email=checkout_session.email,
        status=checkout_session.status,
        shipping_address=_serialize_address_snapshot(checkout_session.shipping_address_snapshot),
        billing_address=_serialize_address_snapshot(checkout_session.billing_address_snapshot),
        totals=CheckoutTotalsResponse(
            item_count=totals["item_count"],
            unique_item_count=totals["unique_item_count"],
            subtotal=totals["subtotal"],
            total=totals["total"],
            currency=totals["currency"],
        ),
        created_at=checkout_session.created_at,
        updated_at=checkout_session.updated_at,
    )


def _serialize_order(session: Session, order: CommerceOrder) -> OrderResponse:
    items = session.scalars(
        select(CommerceOrderItem)
        .where(CommerceOrderItem.order_id == order.id)
        .order_by(CommerceOrderItem.created_at.asc())
    ).all()
    totals = order.totals_snapshot
    return OrderResponse(
        id=str(order.id),
        checkout_session_id=str(order.checkout_session_id),
        cart_id=str(order.cart_id),
        customer_id=str(order.customer_id),
        order_number=order.order_number,
        status=order.status,
        email=order.email,
        currency=order.currency,
        subtotal_amount=to_float(order.subtotal_amount),
        total_amount=to_float(order.total_amount),
        shipping_address=_serialize_address_snapshot(order.shipping_address_snapshot),
        billing_address=_serialize_address_snapshot(order.billing_address_snapshot),
        totals=CheckoutTotalsResponse(
            item_count=totals["item_count"],
            unique_item_count=totals["unique_item_count"],
            subtotal=totals["subtotal"],
            total=totals["total"],
            currency=totals["currency"],
        ),
        items=[
            OrderItemResponse(
                id=str(item.id),
                variant_id=str(item.variant_id),
                product_name=item.product_name,
                product_slug=item.product_slug,
                variant_name=item.variant_name,
                sku=item.sku,
                quantity=item.quantity,
                unit_price=to_float(item.unit_price),
                line_total=to_float(item.line_total),
                attributes_snapshot=item.attributes_snapshot,
            )
            for item in items
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


def create_checkout_session(
    session: Session,
    *,
    auth_context: AuthContext,
    cart_token: str | None,
    payload: CreateCheckoutSessionRequest,
) -> CheckoutSessionResponse:
    customer = _require_customer(auth_context)
    resolved_cart = resolve_cart(session, auth_context=auth_context, cart_token=cart_token, create_if_missing=True)
    if resolved_cart.cart.status != "active":
        raise ValueError("Only active carts can be checked out.")

    rows = _load_checkout_cart_rows(session, resolved_cart.cart.id)
    totals = _validate_checkout_cart_rows(rows)
    checkout_session = CommerceCheckoutSession(
        cart_id=resolved_cart.cart.id,
        customer_id=customer.id,
        email=payload.email,
        status="open",
        shipping_address_snapshot=_snapshot_address(payload.shipping_address),
        billing_address_snapshot=_snapshot_address(payload.billing_address),
        totals_snapshot=totals.model_dump(),
    )
    session.add(checkout_session)
    session.commit()
    session.refresh(checkout_session)
    return _serialize_checkout_session(checkout_session)


def _generate_order_number() -> str:
    return f"DP-{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(3).upper()}"


def place_order(
    session: Session,
    *,
    auth_context: AuthContext,
    payload: PlaceOrderRequest,
) -> OrderResponse:
    customer = _require_customer(auth_context)
    existing_by_key = session.scalar(
        select(CommerceOrder).where(CommerceOrder.idempotency_key == payload.idempotency_key)
    )
    if existing_by_key is not None:
        return _serialize_order(session, existing_by_key)

    checkout_session = session.get(CommerceCheckoutSession, uuid.UUID(payload.checkout_session_id))
    if checkout_session is None or checkout_session.customer_id != customer.id:
        raise ValueError("Checkout session not found.")

    existing_order = session.scalar(
        select(CommerceOrder).where(CommerceOrder.checkout_session_id == checkout_session.id)
    )
    if existing_order is not None:
        return _serialize_order(session, existing_order)

    if checkout_session.status != "open":
        raise ValueError("Checkout session is no longer open.")

    cart = session.get(CommerceCart, checkout_session.cart_id)
    if cart is None or cart.customer_id != customer.id:
        raise ValueError("Checkout cart not found.")
    if cart.status != "active":
        raise ValueError("Only active carts can place orders.")

    rows = _load_checkout_cart_rows(session, cart.id)
    totals = _validate_checkout_cart_rows(rows)
    order = CommerceOrder(
        checkout_session_id=checkout_session.id,
        cart_id=cart.id,
        customer_id=customer.id,
        order_number=_generate_order_number(),
        status="pending_payment",
        email=checkout_session.email,
        currency=totals.currency,
        subtotal_amount=totals.subtotal,
        total_amount=totals.total,
        shipping_address_snapshot=checkout_session.shipping_address_snapshot,
        billing_address_snapshot=checkout_session.billing_address_snapshot,
        totals_snapshot=totals.model_dump(),
        idempotency_key=payload.idempotency_key,
    )
    session.add(order)
    session.flush()

    for cart_item, variant, product, inventory in rows:
        unit_price = to_float(variant.price if variant.price is not None else product.base_price)
        line_total = round(unit_price * cart_item.quantity, 2)
        if inventory is not None:
            inventory.stock_reserved += cart_item.quantity
        session.add(
            CommerceInventoryMovement(
                variant_id=variant.id,
                movement_type="reservation",
                quantity_delta=cart_item.quantity,
                reason=f"Reserved for order {order.order_number}",
                reference_type="order",
                reference_id=order.id,
                created_by_user_id=auth_context.user.id,
            )
        )
        session.add(
            CommerceOrderItem(
                order_id=order.id,
                variant_id=variant.id,
                product_name=product.name,
                product_slug=product.slug,
                variant_name=variant.name,
                sku=variant.sku,
                quantity=cart_item.quantity,
                unit_price=unit_price,
                line_total=line_total,
                attributes_snapshot=variant.attributes or {},
            )
        )

    session.add(
        CommerceOrderStatusHistory(
            order_id=order.id,
            from_status=None,
            to_status="pending_payment",
            reason="Order created from checkout session.",
        )
    )
    checkout_session.status = "converted"
    cart.status = "converted"
    session.commit()
    return _serialize_order(session, order)


def get_order(
    session: Session,
    *,
    auth_context: AuthContext,
    order_id: str,
) -> OrderResponse:
    customer = _require_customer(auth_context)
    order = session.get(CommerceOrder, uuid.UUID(order_id))
    if order is None or order.customer_id != customer.id:
        raise ValueError("Order not found.")
    return _serialize_order(session, order)
