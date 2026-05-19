from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time

from app.core.config import get_settings

SCRYPT_PREFIX = "scrypt"
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SALT_BYTES = 16


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))


def hash_password(password: str) -> str:
    salt = os.urandom(SALT_BYTES)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P)
    return "$".join(
        [
            SCRYPT_PREFIX,
            str(SCRYPT_N),
            str(SCRYPT_R),
            str(SCRYPT_P),
            _b64encode(salt),
            _b64encode(digest),
        ]
    )


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        prefix, n_value, r_value, p_value, salt_encoded, digest_encoded = hashed_password.split("$")
    except ValueError:
        return False

    if prefix != SCRYPT_PREFIX:
        return False

    try:
        n_value_int = int(n_value)
        r_value_int = int(r_value)
        p_value_int = int(p_value)
        salt = _b64decode(salt_encoded)
        expected_digest = _b64decode(digest_encoded)
    except (ValueError, TypeError):
        return False

    candidate_digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n_value_int,
        r=r_value_int,
        p=p_value_int,
        dklen=len(expected_digest),
    )
    return hmac.compare_digest(candidate_digest, expected_digest)


def create_access_token(*, subject: str, role: str, expires_in_minutes: int | None = None) -> str:
    settings = get_settings()
    expires_in_seconds = (expires_in_minutes or settings.access_token_expire_minutes) * 60
    payload = {
        "sub": subject,
        "role": role,
        "exp": int(time.time()) + expires_in_seconds,
    }
    encoded_payload = _b64encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = hmac.new(
        settings.secret_key.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return f"{encoded_payload}.{_b64encode(signature)}"


def decode_access_token(token: str) -> dict[str, str | int]:
    try:
        encoded_payload, encoded_signature = token.split(".")
    except ValueError as exc:
        raise ValueError("Malformed token.") from exc

    settings = get_settings()
    expected_signature = hmac.new(
        settings.secret_key.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    if not hmac.compare_digest(expected_signature, _b64decode(encoded_signature)):
        raise ValueError("Invalid token signature.")

    try:
        payload = json.loads(_b64decode(encoded_payload))
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid token payload.") from exc

    if not isinstance(payload, dict):
        raise ValueError("Invalid token payload.")

    expiration = payload.get("exp")
    subject = payload.get("sub")
    role = payload.get("role")
    if not isinstance(expiration, int) or not isinstance(subject, str) or not isinstance(role, str):
        raise ValueError("Incomplete token payload.")
    if expiration < int(time.time()):
        raise ValueError("Token has expired.")

    return {"sub": subject, "role": role, "exp": expiration}
