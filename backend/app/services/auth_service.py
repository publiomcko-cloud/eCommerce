from __future__ import annotations

import uuid
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.commerce_customer import CommerceCustomer
from app.models.commerce_customer_address import CommerceCustomerAddress
from app.models.commerce_user import CommerceUser
from app.schemas.auth import (
    AuthTokenResponse,
    AuthUserResponse,
    CustomerAddressResponse,
    CustomerProfileResponse,
    LoginRequest,
    RegisterRequest,
    normalize_email_value,
)
from app.services.transformation_service import current_utc_timestamp


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class AuthContext:
    user: CommerceUser
    customer: CommerceCustomer | None


def get_customer_by_user_id(session: Session, user_id: uuid.UUID) -> CommerceCustomer | None:
    return session.scalar(select(CommerceCustomer).where(CommerceCustomer.user_id == user_id))


def get_customer_addresses(session: Session, customer_id: uuid.UUID) -> list[CommerceCustomerAddress]:
    return session.scalars(
        select(CommerceCustomerAddress)
        .where(CommerceCustomerAddress.customer_id == customer_id)
        .order_by(CommerceCustomerAddress.is_default.desc(), CommerceCustomerAddress.created_at.asc())
    ).all()


def serialize_customer_address(address: CommerceCustomerAddress) -> CustomerAddressResponse:
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
    )


def serialize_auth_user(
    session: Session,
    user: CommerceUser,
    customer: CommerceCustomer | None = None,
) -> AuthUserResponse:
    resolved_customer = customer or get_customer_by_user_id(session, user.id)
    profile = None
    if resolved_customer is not None:
        profile = CustomerProfileResponse(
            id=str(resolved_customer.id),
            first_name=resolved_customer.first_name,
            last_name=resolved_customer.last_name,
            phone=resolved_customer.phone,
            marketing_opt_in=resolved_customer.marketing_opt_in,
            addresses=[
                serialize_customer_address(address)
                for address in get_customer_addresses(session, resolved_customer.id)
            ],
        )

    return AuthUserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        customer=profile,
    )


def build_auth_response(
    session: Session,
    *,
    user: CommerceUser,
    customer: CommerceCustomer | None = None,
) -> AuthTokenResponse:
    return AuthTokenResponse(
        access_token=create_access_token(subject=str(user.id), role=user.role),
        user=serialize_auth_user(session, user, customer),
    )


def register_user(session: Session, payload: RegisterRequest) -> AuthTokenResponse:
    existing_user = session.scalar(select(CommerceUser).where(CommerceUser.email == payload.email))
    if existing_user is not None:
        raise ValueError("A user with this email already exists.")

    user = CommerceUser(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="customer",
        is_active=True,
    )
    session.add(user)
    session.flush()

    customer = CommerceCustomer(
        user_id=user.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        marketing_opt_in=payload.marketing_opt_in,
    )
    session.add(customer)
    session.commit()
    session.refresh(user)
    session.refresh(customer)
    return build_auth_response(session, user=user, customer=customer)


def authenticate_user(session: Session, payload: LoginRequest) -> AuthTokenResponse:
    user = session.scalar(select(CommerceUser).where(CommerceUser.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise ValueError("Incorrect email or password.")
    if not user.is_active:
        raise ValueError("Inactive users cannot login.")

    user.last_login_at = current_utc_timestamp()
    session.commit()
    session.refresh(user)
    return build_auth_response(session, user=user)


def get_current_auth_context(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AuthContext:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token.") from exc

    user = db.get(CommerceUser, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token.")

    customer = get_customer_by_user_id(db, user.id)
    return AuthContext(user=user, customer=customer)


def require_roles(*roles: str):
    def dependency(context: AuthContext = Depends(get_current_auth_context)) -> AuthContext:
        if context.user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")
        return context

    return dependency


def normalize_login_email(email: str) -> str:
    return normalize_email_value(email)
