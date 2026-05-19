from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def normalize_email_value(value: str) -> str:
    normalized = value.strip().lower()
    if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
        raise ValueError("A valid email address is required.")
    return normalized


class RegisterRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str
    password: str = Field(min_length=8, max_length=255)
    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    marketing_opt_in: bool = False

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return normalize_email_value(value)


class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str
    password: str = Field(min_length=8, max_length=255)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return normalize_email_value(value)


class CustomerAddressResponse(BaseModel):
    id: str
    type: str
    recipient_name: str
    phone: str | None
    line1: str
    line2: str | None
    city: str
    region: str
    postal_code: str
    country: str
    is_default: bool


class CustomerProfileResponse(BaseModel):
    id: str
    first_name: str | None
    last_name: str | None
    phone: str | None
    marketing_opt_in: bool
    addresses: list[CustomerAddressResponse]


class AuthUserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None
    customer: CustomerProfileResponse | None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class RoleCheckResponse(BaseModel):
    status: str
    role: str
