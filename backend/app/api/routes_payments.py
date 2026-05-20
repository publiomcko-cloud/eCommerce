from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.payment import MockWebhookRequest, PaymentResponse
from app.services.auth_service import AuthContext, get_current_auth_context
from app.services.payment_service import (
    create_order_payment,
    process_mock_webhook,
    simulate_payment_failure,
    simulate_payment_success,
)

router = APIRouter(prefix="/payments", tags=["payments"])


def _raise_payment_error(exc: ValueError) -> None:
    message = str(exc)
    if "not found" in message.lower():
        raise HTTPException(status_code=404, detail=message) from exc
    if "require a customer profile" in message.lower():
        raise HTTPException(status_code=403, detail=message) from exc
    raise HTTPException(status_code=400, detail=message) from exc


@router.post("/orders/{order_id}", response_model=PaymentResponse)
def payment_create_order_payment(
    order_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> PaymentResponse:
    try:
        return create_order_payment(db, auth_context=auth_context, order_id=order_id)
    except ValueError as exc:
        _raise_payment_error(exc)


@router.post("/{payment_id}/simulate-success", response_model=PaymentResponse)
def payment_simulate_success(
    payment_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> PaymentResponse:
    try:
        return simulate_payment_success(db, auth_context=auth_context, payment_id=payment_id)
    except ValueError as exc:
        _raise_payment_error(exc)


@router.post("/{payment_id}/simulate-failure", response_model=PaymentResponse)
def payment_simulate_failure(
    payment_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> PaymentResponse:
    try:
        return simulate_payment_failure(db, auth_context=auth_context, payment_id=payment_id)
    except ValueError as exc:
        _raise_payment_error(exc)


@router.post("/webhooks/mock", response_model=PaymentResponse)
def payment_mock_webhook(
    payload: MockWebhookRequest,
    db: Session = Depends(get_db),
) -> PaymentResponse:
    try:
        return process_mock_webhook(db, payload=payload)
    except ValueError as exc:
        _raise_payment_error(exc)
