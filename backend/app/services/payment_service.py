from __future__ import annotations

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_inventory_movement import CommerceInventoryMovement
from app.models.commerce_order import CommerceOrder
from app.models.commerce_order_item import CommerceOrderItem
from app.models.commerce_order_status_history import CommerceOrderStatusHistory
from app.models.commerce_payment import CommercePayment
from app.schemas.payment import MockWebhookRequest, PaymentResponse
from app.services.auth_service import AuthContext
from app.services.commerce_event_service import emit_commerce_event
from app.services.payment_provider import MockPaymentProvider, PaymentProviderEvent


def to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def _serialize_payment(payment: CommercePayment) -> PaymentResponse:
    return PaymentResponse(
        id=str(payment.id),
        order_id=str(payment.order_id),
        provider_name=payment.provider_name,
        provider_payment_id=payment.provider_payment_id,
        provider_session_token=payment.provider_session_token,
        status=payment.status,
        amount=to_float(payment.amount),
        currency=payment.currency,
        failure_reason=payment.failure_reason,
        provider_payload=payment.provider_payload or {},
        created_at=payment.created_at,
        updated_at=payment.updated_at,
        completed_at=payment.completed_at,
    )


def _get_customer_order(session: Session, *, auth_context: AuthContext, order_id: str) -> CommerceOrder:
    if auth_context.customer is None:
        raise ValueError("Payment actions require a customer profile.")

    order = session.get(CommerceOrder, uuid.UUID(order_id))
    if order is None or order.customer_id != auth_context.customer.id:
        raise ValueError("Order not found.")
    return order


def _get_customer_payment(session: Session, *, auth_context: AuthContext, payment_id: str) -> CommercePayment:
    if auth_context.customer is None:
        raise ValueError("Payment actions require a customer profile.")

    payment = session.get(CommercePayment, uuid.UUID(payment_id))
    if payment is None:
        raise ValueError("Payment not found.")

    order = session.get(CommerceOrder, payment.order_id)
    if order is None or order.customer_id != auth_context.customer.id:
        raise ValueError("Payment not found.")
    return payment


def create_order_payment(
    session: Session,
    *,
    auth_context: AuthContext,
    order_id: str,
) -> PaymentResponse:
    order = _get_customer_order(session, auth_context=auth_context, order_id=order_id)
    existing_payment = session.scalar(select(CommercePayment).where(CommercePayment.order_id == order.id))
    if existing_payment is not None:
        return _serialize_payment(existing_payment)

    if order.status != "pending_payment":
        raise ValueError("Payments can only be created for pending payment orders.")

    provider = MockPaymentProvider()
    payment = CommercePayment(
        order_id=order.id,
        provider_name=provider.provider_name,
        provider_payment_id="pending",
        provider_session_token="pending",
        status="pending",
        amount=order.total_amount,
        currency=order.currency,
        provider_payload={},
    )
    session.add(payment)
    session.flush()

    provider_session = provider.create_payment(order=order, payment=payment)
    payment.provider_payment_id = provider_session.provider_payment_id
    payment.provider_session_token = provider_session.provider_session_token
    payment.provider_payload = provider_session.provider_payload
    session.commit()
    session.refresh(payment)
    return _serialize_payment(payment)


def _load_payment_by_provider_payment_id(session: Session, provider_payment_id: str) -> CommercePayment:
    payment = session.scalar(
        select(CommercePayment).where(CommercePayment.provider_payment_id == provider_payment_id)
    )
    if payment is None:
        raise ValueError("Payment not found.")
    return payment


def _load_order_inventory_rows(
    session: Session,
    *,
    order_id: uuid.UUID,
) -> list[tuple[CommerceOrderItem, CommerceInventoryItem | None]]:
    return session.execute(
        select(CommerceOrderItem, CommerceInventoryItem)
        .outerjoin(CommerceInventoryItem, CommerceInventoryItem.variant_id == CommerceOrderItem.variant_id)
        .where(CommerceOrderItem.order_id == order_id)
        .order_by(CommerceOrderItem.created_at.asc())
    ).all()


def _set_order_status(
    session: Session,
    *,
    order: CommerceOrder,
    to_status: str,
    reason: str,
) -> None:
    if order.status == to_status:
        return
    from_status = order.status
    order.status = to_status
    session.add(
        CommerceOrderStatusHistory(
            order_id=order.id,
            from_status=from_status,
            to_status=to_status,
            reason=reason,
        )
    )


def _capture_reserved_inventory(
    session: Session,
    *,
    auth_context: AuthContext | None,
    order: CommerceOrder,
) -> None:
    rows = _load_order_inventory_rows(session, order_id=order.id)
    for order_item, inventory in rows:
        if inventory is None:
            continue
        if inventory.stock_reserved < order_item.quantity:
            raise ValueError("Reserved inventory is inconsistent for this order.")

        inventory.stock_reserved -= order_item.quantity
        inventory.stock_on_hand = max(inventory.stock_on_hand - order_item.quantity, 0)
        session.add(
            CommerceInventoryMovement(
                variant_id=order_item.variant_id,
                movement_type="sale",
                quantity_delta=-order_item.quantity,
                reason=f"Payment captured for order {order.order_number}",
                reference_type="payment",
                reference_id=order.id,
                created_by_user_id=auth_context.user.id if auth_context is not None else None,
            )
        )


def _release_reserved_inventory(
    session: Session,
    *,
    auth_context: AuthContext | None,
    order: CommerceOrder,
) -> None:
    rows = _load_order_inventory_rows(session, order_id=order.id)
    for order_item, inventory in rows:
        if inventory is None:
            continue
        if inventory.stock_reserved < order_item.quantity:
            raise ValueError("Reserved inventory is inconsistent for this order.")

        inventory.stock_reserved -= order_item.quantity
        session.add(
            CommerceInventoryMovement(
                variant_id=order_item.variant_id,
                movement_type="release",
                quantity_delta=-order_item.quantity,
                reason=f"Payment failed for order {order.order_number}",
                reference_type="payment",
                reference_id=order.id,
                created_by_user_id=auth_context.user.id if auth_context is not None else None,
            )
        )


def _apply_payment_event(
    session: Session,
    *,
    payment: CommercePayment,
    event: PaymentProviderEvent,
    auth_context: AuthContext | None,
) -> PaymentResponse:
    if payment.processed_webhook_event_id == event.event_id:
        return _serialize_payment(payment)

    order = session.get(CommerceOrder, payment.order_id)
    if order is None:
        raise ValueError("Order not found.")

    if payment.status == "succeeded":
        payment.processed_webhook_event_id = event.event_id
        payment.provider_payload = {
            **(payment.provider_payload or {}),
            **event.provider_payload,
            "last_event_id": event.event_id,
        }
        session.commit()
        session.refresh(payment)
        return _serialize_payment(payment)

    now = datetime.now(UTC).replace(tzinfo=None)
    payment.failure_reason = event.failure_reason
    payment.provider_payload = {
        **(payment.provider_payload or {}),
        **event.provider_payload,
        "last_event_id": event.event_id,
    }
    payment.processed_webhook_event_id = event.event_id
    payment.completed_at = now

    if event.status == "succeeded":
        payment.status = "succeeded"
        payment.failure_reason = None
        _capture_reserved_inventory(session, auth_context=auth_context, order=order)
        _set_order_status(
            session,
            order=order,
            to_status="paid",
            reason="Mock payment provider reported success.",
        )
        emit_commerce_event(
            session,
            event_type="payment_succeeded",
            auth_context=auth_context,
            customer_id=order.customer_id,
            order_id=order.id,
            payment_id=payment.id,
            payload={"amount": to_float(payment.amount), "currency": payment.currency},
        )
    elif event.status == "failed":
        payment.status = "failed"
        _release_reserved_inventory(session, auth_context=auth_context, order=order)
        _set_order_status(
            session,
            order=order,
            to_status="cancelled",
            reason=event.failure_reason or "Mock payment provider reported failure.",
        )
        emit_commerce_event(
            session,
            event_type="payment_failed",
            auth_context=auth_context,
            customer_id=order.customer_id,
            order_id=order.id,
            payment_id=payment.id,
            payload={"failure_reason": event.failure_reason},
        )
    else:
        raise ValueError("Unsupported payment event status.")

    session.commit()
    session.refresh(payment)
    return _serialize_payment(payment)


def simulate_payment_success(
    session: Session,
    *,
    auth_context: AuthContext,
    payment_id: str,
) -> PaymentResponse:
    payment = _get_customer_payment(session, auth_context=auth_context, payment_id=payment_id)
    provider = MockPaymentProvider()
    event = provider.build_success_event(payment=payment)
    return _apply_payment_event(session, payment=payment, event=event, auth_context=auth_context)


def simulate_payment_failure(
    session: Session,
    *,
    auth_context: AuthContext,
    payment_id: str,
    failure_reason: str | None = None,
) -> PaymentResponse:
    payment = _get_customer_payment(session, auth_context=auth_context, payment_id=payment_id)
    provider = MockPaymentProvider()
    event = provider.build_failure_event(payment=payment, failure_reason=failure_reason)
    return _apply_payment_event(session, payment=payment, event=event, auth_context=auth_context)


def process_mock_webhook(
    session: Session,
    *,
    payload: MockWebhookRequest,
) -> PaymentResponse:
    payment = _load_payment_by_provider_payment_id(session, payload.provider_payment_id)
    event = PaymentProviderEvent(
        event_id=payload.event_id,
        provider_payment_id=payload.provider_payment_id,
        status=payload.status,
        failure_reason=payload.failure_reason,
        provider_payload={
            "provider": "mock",
            "event_type": f"payment.{payload.status}",
        },
    )
    return _apply_payment_event(session, payment=payment, event=event, auth_context=None)
