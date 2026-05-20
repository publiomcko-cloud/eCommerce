from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.checkout import CheckoutSessionResponse, CreateCheckoutSessionRequest, OrderResponse, PlaceOrderRequest
from app.services.auth_service import AuthContext, get_current_auth_context
from app.services.checkout_service import create_checkout_session, get_order, place_order

router = APIRouter(prefix="/checkout", tags=["checkout"])


def _raise_checkout_error(exc: ValueError) -> None:
    message = str(exc)
    if "not found" in message.lower():
        raise HTTPException(status_code=404, detail=message) from exc
    if "requires a customer profile" in message.lower():
        raise HTTPException(status_code=403, detail=message) from exc
    raise HTTPException(status_code=400, detail=message) from exc


@router.post("/sessions", response_model=CheckoutSessionResponse)
def checkout_create_session(
    payload: CreateCheckoutSessionRequest,
    cart_token: str | None = Header(default=None, alias="X-Cart-Token"),
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> CheckoutSessionResponse:
    try:
        return create_checkout_session(db, auth_context=auth_context, cart_token=cart_token, payload=payload)
    except ValueError as exc:
        _raise_checkout_error(exc)


@router.post("/orders", response_model=OrderResponse)
def checkout_place_order(
    payload: PlaceOrderRequest,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> OrderResponse:
    try:
        return place_order(db, auth_context=auth_context, payload=payload)
    except ValueError as exc:
        _raise_checkout_error(exc)


@router.get("/orders/{order_id}", response_model=OrderResponse)
def checkout_get_order(
    order_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> OrderResponse:
    try:
        return get_order(db, auth_context=auth_context, order_id=order_id)
    except ValueError as exc:
        _raise_checkout_error(exc)
