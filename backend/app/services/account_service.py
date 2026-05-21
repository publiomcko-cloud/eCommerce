from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.commerce_customer import CommerceCustomer
from app.models.commerce_customer_address import CommerceCustomerAddress
from app.models.commerce_order import CommerceOrder
from app.models.commerce_order_item import CommerceOrderItem
from app.models.commerce_payment import CommercePayment
from app.schemas.account import (
    CustomerAccountProfileResponse,
    CustomerAddressInput,
    CustomerAddressResponse,
    CustomerOrderListItemResponse,
    CustomerOrderListResponse,
)
from app.schemas.checkout import OrderResponse
from app.services.auth_service import AuthContext
from app.services.checkout_service import _serialize_order


def to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def _require_customer(auth_context: AuthContext) -> CommerceCustomer:
    if auth_context.customer is None:
        raise ValueError("Account actions require a customer profile.")
    return auth_context.customer


def _serialize_address(address: CommerceCustomerAddress) -> CustomerAddressResponse:
    return CustomerAddressResponse(
        id=str(address.id),
        type=address.type,
        recipient_name=address.recipient_name,
        phone=address.phone,
        line1=address.line1,
        line2=address.line2,
        city=address.city,
        region=address.region,
        postal_code=address.postal_code,
        country=address.country,
        is_default=address.is_default,
        created_at=address.created_at,
        updated_at=address.updated_at,
    )


def get_customer_profile(
    session: Session,
    *,
    auth_context: AuthContext,
) -> CustomerAccountProfileResponse:
    customer = _require_customer(auth_context)
    address_count = session.scalar(
        select(func.count(CommerceCustomerAddress.id)).where(CommerceCustomerAddress.customer_id == customer.id)
    ) or 0
    order_count = session.scalar(
        select(func.count(CommerceOrder.id)).where(CommerceOrder.customer_id == customer.id)
    ) or 0

    return CustomerAccountProfileResponse(
        user_id=str(auth_context.user.id),
        customer_id=str(customer.id),
        email=auth_context.user.email,
        role=auth_context.user.role,
        first_name=customer.first_name,
        last_name=customer.last_name,
        phone=customer.phone,
        marketing_opt_in=customer.marketing_opt_in,
        address_count=int(address_count),
        order_count=int(order_count),
        created_at=auth_context.user.created_at,
        last_login_at=auth_context.user.last_login_at,
    )


def list_customer_addresses(
    session: Session,
    *,
    auth_context: AuthContext,
) -> list[CustomerAddressResponse]:
    customer = _require_customer(auth_context)
    addresses = session.scalars(
        select(CommerceCustomerAddress)
        .where(CommerceCustomerAddress.customer_id == customer.id)
        .order_by(CommerceCustomerAddress.is_default.desc(), CommerceCustomerAddress.created_at.asc())
    ).all()
    return [_serialize_address(address) for address in addresses]


def _clear_default_addresses(session: Session, *, customer_id: uuid.UUID) -> None:
    addresses = session.scalars(
        select(CommerceCustomerAddress).where(CommerceCustomerAddress.customer_id == customer_id)
    ).all()
    for address in addresses:
        address.is_default = False


def create_customer_address(
    session: Session,
    *,
    auth_context: AuthContext,
    payload: CustomerAddressInput,
) -> CustomerAddressResponse:
    customer = _require_customer(auth_context)
    if payload.is_default:
        _clear_default_addresses(session, customer_id=customer.id)

    address = CommerceCustomerAddress(
        customer_id=customer.id,
        type=payload.type,
        recipient_name=payload.recipient_name,
        phone=payload.phone,
        line1=payload.line1,
        line2=payload.line2,
        city=payload.city,
        region=payload.region,
        postal_code=payload.postal_code,
        country=payload.country,
        is_default=payload.is_default,
    )
    session.add(address)
    session.commit()
    session.refresh(address)
    return _serialize_address(address)


def _get_owned_address(
    session: Session,
    *,
    customer_id: uuid.UUID,
    address_id: str,
) -> CommerceCustomerAddress:
    address = session.get(CommerceCustomerAddress, uuid.UUID(address_id))
    if address is None or address.customer_id != customer_id:
        raise ValueError("Address not found.")
    return address


def update_customer_address(
    session: Session,
    *,
    auth_context: AuthContext,
    address_id: str,
    payload: CustomerAddressInput,
) -> CustomerAddressResponse:
    customer = _require_customer(auth_context)
    address = _get_owned_address(session, customer_id=customer.id, address_id=address_id)
    if payload.is_default:
        _clear_default_addresses(session, customer_id=customer.id)

    address.type = payload.type
    address.recipient_name = payload.recipient_name
    address.phone = payload.phone
    address.line1 = payload.line1
    address.line2 = payload.line2
    address.city = payload.city
    address.region = payload.region
    address.postal_code = payload.postal_code
    address.country = payload.country
    address.is_default = payload.is_default
    session.commit()
    session.refresh(address)
    return _serialize_address(address)


def delete_customer_address(
    session: Session,
    *,
    auth_context: AuthContext,
    address_id: str,
) -> None:
    customer = _require_customer(auth_context)
    address = _get_owned_address(session, customer_id=customer.id, address_id=address_id)
    session.delete(address)
    session.commit()


def list_customer_orders(
    session: Session,
    *,
    auth_context: AuthContext,
    limit: int = 20,
    offset: int = 0,
) -> CustomerOrderListResponse:
    customer = _require_customer(auth_context)
    total = session.scalar(
        select(func.count(CommerceOrder.id)).where(CommerceOrder.customer_id == customer.id)
    ) or 0

    rows = session.execute(
        select(
            CommerceOrder,
            CommercePayment.status,
            func.coalesce(func.sum(CommerceOrderItem.quantity), 0).label("item_count"),
        )
        .outerjoin(CommercePayment, CommercePayment.order_id == CommerceOrder.id)
        .outerjoin(CommerceOrderItem, CommerceOrderItem.order_id == CommerceOrder.id)
        .where(CommerceOrder.customer_id == customer.id)
        .group_by(CommerceOrder.id, CommercePayment.status)
        .order_by(CommerceOrder.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    items = [
        CustomerOrderListItemResponse(
            id=str(order.id),
            order_number=order.order_number,
            status=order.status,
            payment_status=payment_status,
            total_amount=to_float(order.total_amount),
            currency=order.currency,
            item_count=int(item_count or 0),
            created_at=order.created_at,
        )
        for order, payment_status, item_count in rows
    ]
    return CustomerOrderListResponse(total=int(total), limit=limit, offset=offset, items=items)


def get_customer_order_detail(
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
