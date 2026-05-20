from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.cart import AddCartItemRequest, CartResponse, UpdateCartItemRequest
from app.services.auth_service import AuthContext, get_optional_auth_context
from app.services.cart_service import add_cart_item, get_cart, remove_cart_item, update_cart_item

router = APIRouter(prefix="/cart", tags=["cart"])


def _raise_cart_http_error(exc: ValueError) -> None:
    message = str(exc)
    lower_message = message.lower()
    if "customer profile" in lower_message:
        raise HTTPException(status_code=403, detail=message) from exc
    if "not found" in lower_message:
        raise HTTPException(status_code=404, detail=message) from exc
    raise HTTPException(status_code=400, detail=message) from exc


@router.get("", response_model=CartResponse)
def cart_get(
    cart_token: str | None = Header(default=None, alias="X-Cart-Token"),
    auth_context: AuthContext | None = Depends(get_optional_auth_context),
    db: Session = Depends(get_db),
) -> CartResponse:
    try:
        return get_cart(db, auth_context=auth_context, cart_token=cart_token)
    except ValueError as exc:
        _raise_cart_http_error(exc)


@router.post("/items", response_model=CartResponse)
def cart_add_item(
    payload: AddCartItemRequest,
    cart_token: str | None = Header(default=None, alias="X-Cart-Token"),
    auth_context: AuthContext | None = Depends(get_optional_auth_context),
    db: Session = Depends(get_db),
) -> CartResponse:
    try:
        return add_cart_item(db, auth_context=auth_context, cart_token=cart_token, payload=payload)
    except ValueError as exc:
        _raise_cart_http_error(exc)


@router.put("/items/{item_id}", response_model=CartResponse)
def cart_update_item(
    item_id: str,
    payload: UpdateCartItemRequest,
    cart_token: str | None = Header(default=None, alias="X-Cart-Token"),
    auth_context: AuthContext | None = Depends(get_optional_auth_context),
    db: Session = Depends(get_db),
) -> CartResponse:
    try:
        return update_cart_item(db, auth_context=auth_context, cart_token=cart_token, item_id=item_id, payload=payload)
    except ValueError as exc:
        _raise_cart_http_error(exc)


@router.delete("/items/{item_id}", response_model=CartResponse)
def cart_delete_item(
    item_id: str,
    cart_token: str | None = Header(default=None, alias="X-Cart-Token"),
    auth_context: AuthContext | None = Depends(get_optional_auth_context),
    db: Session = Depends(get_db),
) -> CartResponse:
    try:
        return remove_cart_item(db, auth_context=auth_context, cart_token=cart_token, item_id=item_id)
    except ValueError as exc:
        _raise_cart_http_error(exc)
