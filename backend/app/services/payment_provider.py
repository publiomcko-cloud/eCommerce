from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Protocol

from app.models.commerce_order import CommerceOrder
from app.models.commerce_payment import CommercePayment


@dataclass(frozen=True)
class PaymentProviderSession:
    provider_payment_id: str
    provider_session_token: str
    provider_payload: dict[str, object]


@dataclass(frozen=True)
class PaymentProviderEvent:
    event_id: str
    provider_payment_id: str
    status: str
    failure_reason: str | None
    provider_payload: dict[str, object]


class PaymentProviderAdapter(Protocol):
    provider_name: str

    def create_payment(self, *, order: CommerceOrder, payment: CommercePayment) -> PaymentProviderSession:
        ...

    def build_success_event(self, *, payment: CommercePayment) -> PaymentProviderEvent:
        ...

    def build_failure_event(
        self,
        *,
        payment: CommercePayment,
        failure_reason: str | None = None,
    ) -> PaymentProviderEvent:
        ...


class MockPaymentProvider:
    provider_name = "mock"

    def create_payment(self, *, order: CommerceOrder, payment: CommercePayment) -> PaymentProviderSession:
        provider_payment_id = f"mockpay_{secrets.token_hex(8)}"
        provider_session_token = f"mocksession_{secrets.token_hex(8)}"
        return PaymentProviderSession(
            provider_payment_id=provider_payment_id,
            provider_session_token=provider_session_token,
            provider_payload={
                "provider": self.provider_name,
                "order_number": order.order_number,
                "mode": "demo",
            },
        )

    def build_success_event(self, *, payment: CommercePayment) -> PaymentProviderEvent:
        return PaymentProviderEvent(
            event_id=f"mockevt_{secrets.token_hex(8)}",
            provider_payment_id=payment.provider_payment_id,
            status="succeeded",
            failure_reason=None,
            provider_payload={
                "provider": self.provider_name,
                "event_type": "payment.succeeded",
            },
        )

    def build_failure_event(
        self,
        *,
        payment: CommercePayment,
        failure_reason: str | None = None,
    ) -> PaymentProviderEvent:
        return PaymentProviderEvent(
            event_id=f"mockevt_{secrets.token_hex(8)}",
            provider_payment_id=payment.provider_payment_id,
            status="failed",
            failure_reason=failure_reason or "Mock payment was declined.",
            provider_payload={
                "provider": self.provider_name,
                "event_type": "payment.failed",
            },
        )
