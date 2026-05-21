from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.account import (
    CustomerAccountProfileResponse,
    CustomerAddressInput,
    CustomerAddressResponse,
    CustomerOrderListResponse,
)
from app.schemas.checkout import OrderResponse
from app.services.account_service import (
    create_customer_address,
    delete_customer_address,
    get_customer_order_detail,
    get_customer_profile,
    list_customer_addresses,
    list_customer_orders,
    update_customer_address,
)
from app.services.auth_service import AuthContext, get_current_auth_context

router = APIRouter(prefix="/account", tags=["account"])


def _raise_account_error(exc: ValueError) -> None:
    message = str(exc)
    if "not found" in message.lower():
        raise HTTPException(status_code=404, detail=message) from exc
    if "require a customer profile" in message.lower():
        raise HTTPException(status_code=403, detail=message) from exc
    raise HTTPException(status_code=400, detail=message) from exc


@router.get("/profile", response_model=CustomerAccountProfileResponse)
def account_profile(
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> CustomerAccountProfileResponse:
    try:
        return get_customer_profile(db, auth_context=auth_context)
    except ValueError as exc:
        _raise_account_error(exc)


@router.get("/addresses", response_model=list[CustomerAddressResponse])
def account_list_addresses(
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> list[CustomerAddressResponse]:
    try:
        return list_customer_addresses(db, auth_context=auth_context)
    except ValueError as exc:
        _raise_account_error(exc)


@router.post("/addresses", response_model=CustomerAddressResponse, status_code=status.HTTP_201_CREATED)
def account_create_address(
    payload: CustomerAddressInput,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> CustomerAddressResponse:
    try:
        return create_customer_address(db, auth_context=auth_context, payload=payload)
    except ValueError as exc:
        _raise_account_error(exc)


@router.put("/addresses/{address_id}", response_model=CustomerAddressResponse)
def account_update_address(
    address_id: str,
    payload: CustomerAddressInput,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> CustomerAddressResponse:
    try:
        return update_customer_address(db, auth_context=auth_context, address_id=address_id, payload=payload)
    except ValueError as exc:
        _raise_account_error(exc)


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def account_delete_address(
    address_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> Response:
    try:
        delete_customer_address(db, auth_context=auth_context, address_id=address_id)
    except ValueError as exc:
        _raise_account_error(exc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/orders", response_model=CustomerOrderListResponse)
def account_list_orders(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> CustomerOrderListResponse:
    try:
        return list_customer_orders(db, auth_context=auth_context, limit=limit, offset=offset)
    except ValueError as exc:
        _raise_account_error(exc)


@router.get("/orders/{order_id}", response_model=OrderResponse)
def account_get_order(
    order_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> OrderResponse:
    try:
        return get_customer_order_detail(db, auth_context=auth_context, order_id=order_id)
    except ValueError as exc:
        _raise_account_error(exc)
