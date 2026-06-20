from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models.commerce_event import CommerceEvent
from app.services.auth_service import AuthContext


def emit_commerce_event(
    session: Session,
    *,
    event_type: str,
    auth_context: AuthContext | None = None,
    customer_id: uuid.UUID | None = None,
    cart_id: uuid.UUID | None = None,
    checkout_session_id: uuid.UUID | None = None,
    order_id: uuid.UUID | None = None,
    payment_id: uuid.UUID | None = None,
    refund_id: uuid.UUID | None = None,
    shipment_id: uuid.UUID | None = None,
    product_id: uuid.UUID | None = None,
    payload: dict[str, Any] | None = None,
) -> CommerceEvent:
    event = CommerceEvent(
        event_type=event_type,
        actor_user_id=auth_context.user.id if auth_context is not None else None,
        customer_id=customer_id or (auth_context.customer.id if auth_context is not None and auth_context.customer else None),
        cart_id=cart_id,
        checkout_session_id=checkout_session_id,
        order_id=order_id,
        payment_id=payment_id,
        refund_id=refund_id,
        shipment_id=shipment_id,
        product_id=product_id,
        payload=payload or {},
    )
    session.add(event)
    return event
