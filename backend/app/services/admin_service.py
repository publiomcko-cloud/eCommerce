from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session

from app.models.commerce_category import CommerceCategory
from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_order import CommerceOrder
from app.models.commerce_order_item import CommerceOrderItem
from app.models.commerce_order_status_history import CommerceOrderStatusHistory
from app.models.commerce_payment import CommercePayment
from app.models.commerce_product import CommerceProduct
from app.models.commerce_product_variant import CommerceProductVariant
from app.models.commerce_refund import CommerceRefund
from app.models.commerce_shipment import CommerceShipment
from app.schemas.admin import (
    AdminInventoryListItemResponse,
    AdminInventoryListResponse,
    AdminOrderDetailResponse,
    AdminOrderListItemResponse,
    AdminOrderListResponse,
    AdminOrderStatusHistoryResponse,
    AdminOverviewResponse,
    AdminRefundCreateRequest,
    AdminRefundResponse,
    AdminShipmentResponse,
    AdminShipmentUpsertRequest,
)
from app.schemas.checkout import CheckoutAddressResponse, OrderItemResponse, OrderPaymentSummaryResponse
from app.services.commerce_event_service import emit_commerce_event


def to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def _serialize_address(snapshot: dict) -> CheckoutAddressResponse:
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


def _serialize_payment(payment: CommercePayment | None) -> OrderPaymentSummaryResponse | None:
    if payment is None:
        return None
    return OrderPaymentSummaryResponse(
        id=str(payment.id),
        provider_name=payment.provider_name,
        provider_payment_id=payment.provider_payment_id,
        provider_session_token=payment.provider_session_token,
        status=payment.status,
        amount=to_float(payment.amount),
        currency=payment.currency,
        failure_reason=payment.failure_reason,
        completed_at=payment.completed_at,
    )


def _serialize_shipment(shipment: CommerceShipment | None) -> AdminShipmentResponse | None:
    if shipment is None:
        return None
    return AdminShipmentResponse(
        id=str(shipment.id),
        order_id=str(shipment.order_id),
        carrier=shipment.carrier,
        service_level=shipment.service_level,
        tracking_number=shipment.tracking_number,
        status=shipment.status,
        notes=shipment.notes,
        created_at=shipment.created_at,
        updated_at=shipment.updated_at,
    )


def _serialize_refund(refund: CommerceRefund) -> AdminRefundResponse:
    return AdminRefundResponse(
        id=str(refund.id),
        order_id=str(refund.order_id),
        payment_id=str(refund.payment_id),
        provider_refund_id=refund.provider_refund_id,
        status=refund.status,
        amount=to_float(refund.amount),
        currency=refund.currency,
        reason=refund.reason,
        created_by_user_id=str(refund.created_by_user_id) if refund.created_by_user_id else None,
        created_at=refund.created_at,
    )


def get_admin_overview(session: Session) -> AdminOverviewResponse:
    product_counts = session.execute(
        select(
            func.count(CommerceProduct.id),
            func.coalesce(func.sum(case((CommerceProduct.status == "active", 1), else_=0)), 0),
        )
    ).one()
    order_counts = session.execute(
        select(
            func.count(CommerceOrder.id),
            func.coalesce(func.sum(case((CommerceOrder.status == "pending_payment", 1), else_=0)), 0),
            func.coalesce(func.sum(case((CommerceOrder.status == "paid", 1), else_=0)), 0),
            func.coalesce(func.sum(case((CommerceOrder.status == "fulfilled", 1), else_=0)), 0),
            func.coalesce(func.sum(case((CommerceOrder.status == "cancelled", 1), else_=0)), 0),
        )
    ).one()
    low_stock_variants = session.scalar(
        select(func.count(CommerceInventoryItem.id)).where(
            CommerceInventoryItem.allow_backorder.is_(False),
            (CommerceInventoryItem.stock_on_hand - CommerceInventoryItem.stock_reserved)
            <= CommerceInventoryItem.low_stock_threshold,
        )
    ) or 0
    shipments_in_progress = session.scalar(
        select(func.count(CommerceShipment.id)).where(
            CommerceShipment.status.in_(["pending", "packed", "shipped"])
        )
    ) or 0

    return AdminOverviewResponse(
        total_products=int(product_counts[0] or 0),
        active_products=int(product_counts[1] or 0),
        total_orders=int(order_counts[0] or 0),
        pending_payment_orders=int(order_counts[1] or 0),
        paid_orders=int(order_counts[2] or 0),
        fulfilled_orders=int(order_counts[3] or 0),
        cancelled_orders=int(order_counts[4] or 0),
        low_stock_variants=int(low_stock_variants),
        shipments_in_progress=int(shipments_in_progress),
    )


def list_admin_orders(
    session: Session,
    *,
    status: str | None = None,
    payment_status: str | None = None,
    shipment_status: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> AdminOrderListResponse:
    filters = []
    if status:
        filters.append(CommerceOrder.status == status)
    if payment_status:
        filters.append(CommercePayment.status == payment_status)
    if shipment_status:
        filters.append(CommerceShipment.status == shipment_status)

    total = session.scalar(
        select(func.count(CommerceOrder.id))
        .select_from(CommerceOrder)
        .outerjoin(CommercePayment, CommercePayment.order_id == CommerceOrder.id)
        .outerjoin(CommerceShipment, CommerceShipment.order_id == CommerceOrder.id)
        .where(*filters)
    ) or 0

    rows = session.execute(
        select(
            CommerceOrder,
            CommercePayment.status,
            CommerceShipment.status,
            func.coalesce(func.sum(CommerceOrderItem.quantity), 0).label("item_count"),
        )
        .outerjoin(CommercePayment, CommercePayment.order_id == CommerceOrder.id)
        .outerjoin(CommerceShipment, CommerceShipment.order_id == CommerceOrder.id)
        .outerjoin(CommerceOrderItem, CommerceOrderItem.order_id == CommerceOrder.id)
        .where(*filters)
        .group_by(CommerceOrder.id, CommercePayment.status, CommerceShipment.status)
        .order_by(CommerceOrder.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return AdminOrderListResponse(
        total=int(total),
        limit=limit,
        offset=offset,
        items=[
            AdminOrderListItemResponse(
                id=str(order.id),
                order_number=order.order_number,
                status=order.status,
                customer_email=order.email,
                payment_status=payment_state,
                shipment_status=shipment_state,
                total_amount=to_float(order.total_amount),
                currency=order.currency,
                item_count=int(item_count or 0),
                created_at=order.created_at,
            )
            for order, payment_state, shipment_state, item_count in rows
        ],
    )


def get_admin_order_detail(session: Session, order_id: str) -> AdminOrderDetailResponse:
    order = session.get(CommerceOrder, uuid.UUID(order_id))
    if order is None:
        raise ValueError("Order not found.")

    items = session.scalars(
        select(CommerceOrderItem)
        .where(CommerceOrderItem.order_id == order.id)
        .order_by(CommerceOrderItem.created_at.asc())
    ).all()
    payment = session.scalar(select(CommercePayment).where(CommercePayment.order_id == order.id))
    shipment = session.scalar(select(CommerceShipment).where(CommerceShipment.order_id == order.id))
    refunds = session.scalars(
        select(CommerceRefund).where(CommerceRefund.order_id == order.id).order_by(CommerceRefund.created_at.asc())
    ).all()
    history_rows = session.scalars(
        select(CommerceOrderStatusHistory)
        .where(CommerceOrderStatusHistory.order_id == order.id)
        .order_by(CommerceOrderStatusHistory.created_at.asc())
    ).all()

    return AdminOrderDetailResponse(
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
        shipping_address=_serialize_address(order.shipping_address_snapshot),
        billing_address=_serialize_address(order.billing_address_snapshot),
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
        payment=_serialize_payment(payment),
        shipment=_serialize_shipment(shipment),
        refunds=[_serialize_refund(refund) for refund in refunds],
        status_history=[
            AdminOrderStatusHistoryResponse(
                id=str(history.id),
                from_status=history.from_status,
                to_status=history.to_status,
                reason=history.reason,
                created_at=history.created_at,
            )
            for history in history_rows
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


ALLOWED_ADMIN_STATUS_TRANSITIONS = {
    "pending_payment": {"cancelled"},
    "paid": {"fulfilled"},
    "fulfilled": set(),
    "cancelled": set(),
}


def update_admin_order_status(
    session: Session,
    *,
    order_id: str,
    status: str,
    reason: str | None,
) -> AdminOrderDetailResponse:
    order = session.get(CommerceOrder, uuid.UUID(order_id))
    if order is None:
        raise ValueError("Order not found.")
    if order.status == status:
        return get_admin_order_detail(session, order_id)

    allowed = ALLOWED_ADMIN_STATUS_TRANSITIONS.get(order.status, set())
    if status not in allowed:
        raise ValueError(f"Cannot move order from {order.status} to {status}.")

    if status == "fulfilled":
        payment = session.scalar(select(CommercePayment).where(CommercePayment.order_id == order.id))
        if payment is None or payment.status != "succeeded":
            raise ValueError("Only successfully paid orders can be fulfilled.")

    previous_status = order.status
    order.status = status
    session.add(
        CommerceOrderStatusHistory(
            order_id=order.id,
            from_status=previous_status,
            to_status=status,
            reason=reason or "Status changed from admin back office.",
        )
    )
    session.commit()
    return get_admin_order_detail(session, order_id)


def upsert_admin_shipment(
    session: Session,
    *,
    order_id: str,
    payload: AdminShipmentUpsertRequest,
) -> AdminShipmentResponse:
    order = session.get(CommerceOrder, uuid.UUID(order_id))
    if order is None:
        raise ValueError("Order not found.")
    if order.status not in {"paid", "fulfilled"}:
        raise ValueError("Shipment records can only be added after payment succeeds.")

    shipment = session.scalar(select(CommerceShipment).where(CommerceShipment.order_id == order.id))
    if shipment is None:
        shipment = CommerceShipment(order_id=order.id)
        session.add(shipment)
        session.flush()

    shipment.carrier = payload.carrier
    shipment.service_level = payload.service_level
    shipment.tracking_number = payload.tracking_number
    shipment.status = payload.status
    shipment.notes = payload.notes

    if payload.status == "delivered" and order.status != "fulfilled":
        session.add(
            CommerceOrderStatusHistory(
                order_id=order.id,
                from_status=order.status,
                to_status="fulfilled",
                reason="Shipment delivered and order auto-fulfilled.",
            )
        )
        order.status = "fulfilled"

    emit_commerce_event(
        session,
        event_type="shipment_updated",
        order_id=order.id,
        shipment_id=shipment.id,
        payload={"status": shipment.status, "carrier": shipment.carrier},
    )
    session.commit()
    session.refresh(shipment)
    return _serialize_shipment(shipment)


def create_admin_refund(
    session: Session,
    *,
    order_id: str,
    payload: AdminRefundCreateRequest,
    created_by_user_id: str,
) -> AdminRefundResponse:
    order = session.get(CommerceOrder, uuid.UUID(order_id))
    if order is None:
        raise ValueError("Order not found.")

    payment = session.scalar(select(CommercePayment).where(CommercePayment.order_id == order.id))
    if payment is None or payment.status != "succeeded":
        raise ValueError("Only successfully paid orders can be refunded.")

    refunded_amount = session.scalar(
        select(func.coalesce(func.sum(CommerceRefund.amount), 0)).where(
            CommerceRefund.order_id == order.id,
            CommerceRefund.status == "succeeded",
        )
    ) or Decimal("0")
    remaining_amount = Decimal(str(payment.amount)) - Decimal(str(refunded_amount))
    requested_amount = remaining_amount if payload.amount is None else Decimal(str(payload.amount))

    if requested_amount <= 0:
        raise ValueError("Refund amount must be greater than zero.")
    if requested_amount > remaining_amount:
        raise ValueError("Refund amount cannot exceed the remaining paid amount.")

    refund = CommerceRefund(
        order_id=order.id,
        payment_id=payment.id,
        provider_refund_id=f"mock_refund_{uuid.uuid4().hex}",
        status="succeeded",
        amount=requested_amount,
        currency=payment.currency,
        reason=payload.reason,
        created_by_user_id=uuid.UUID(created_by_user_id),
    )
    session.add(refund)
    session.flush()

    if requested_amount == remaining_amount and order.status != "cancelled":
        previous_status = order.status
        order.status = "cancelled"
        session.add(
            CommerceOrderStatusHistory(
                order_id=order.id,
                from_status=previous_status,
                to_status="cancelled",
                reason=payload.reason or "Order fully refunded from admin back office.",
            )
        )

    emit_commerce_event(
        session,
        event_type="refund_created",
        order_id=order.id,
        payment_id=payment.id,
        refund_id=refund.id,
        payload={"amount": to_float(requested_amount), "currency": refund.currency, "reason": refund.reason},
    )
    session.commit()
    session.refresh(refund)
    return _serialize_refund(refund)


def list_admin_inventory(
    session: Session,
    *,
    q: str | None = None,
    low_stock_only: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> AdminInventoryListResponse:
    filters = []
    if q:
        search = f"%{q.strip()}%"
        filters.append(
            or_(
                CommerceProduct.name.ilike(search),
                CommerceProductVariant.name.ilike(search),
                CommerceProductVariant.sku.ilike(search),
            )
        )
    if low_stock_only:
        filters.append(CommerceInventoryItem.allow_backorder.is_(False))
        filters.append(
            (CommerceInventoryItem.stock_on_hand - CommerceInventoryItem.stock_reserved)
            <= CommerceInventoryItem.low_stock_threshold
        )

    total = session.scalar(
        select(func.count(CommerceProductVariant.id))
        .select_from(CommerceProductVariant)
        .join(CommerceProduct, CommerceProduct.id == CommerceProductVariant.product_id)
        .join(CommerceCategory, CommerceCategory.id == CommerceProduct.category_id)
        .outerjoin(CommerceInventoryItem, CommerceInventoryItem.variant_id == CommerceProductVariant.id)
        .where(*filters)
    ) or 0

    rows = session.execute(
        select(CommerceProductVariant, CommerceProduct, CommerceCategory, CommerceInventoryItem)
        .join(CommerceProduct, CommerceProduct.id == CommerceProductVariant.product_id)
        .join(CommerceCategory, CommerceCategory.id == CommerceProduct.category_id)
        .outerjoin(CommerceInventoryItem, CommerceInventoryItem.variant_id == CommerceProductVariant.id)
        .where(*filters)
        .order_by(CommerceProduct.updated_at.desc(), CommerceProductVariant.created_at.asc())
        .limit(limit)
        .offset(offset)
    ).all()

    items = []
    for variant, product, category, inventory in rows:
        stock_on_hand = inventory.stock_on_hand if inventory is not None else 0
        stock_reserved = inventory.stock_reserved if inventory is not None else 0
        low_stock_threshold = inventory.low_stock_threshold if inventory is not None else 5
        allow_backorder = inventory.allow_backorder if inventory is not None else False
        available_stock = stock_on_hand - stock_reserved
        items.append(
            AdminInventoryListItemResponse(
                variant_id=str(variant.id),
                product_id=str(product.id),
                product_name=product.name,
                product_slug=product.slug,
                category_name=category.name,
                variant_name=variant.name,
                sku=variant.sku,
                variant_status=variant.status,
                price=to_float(variant.price if variant.price is not None else product.base_price),
                stock_on_hand=stock_on_hand,
                stock_reserved=stock_reserved,
                available_stock=available_stock,
                low_stock_threshold=low_stock_threshold,
                allow_backorder=allow_backorder,
            )
        )

    return AdminInventoryListResponse(total=int(total), limit=limit, offset=offset, items=items)
