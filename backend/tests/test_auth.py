from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.commerce_customer import CommerceCustomer
from app.models.commerce_user import CommerceUser


def test_register_creates_customer_profile_and_returns_token() -> None:
    client = TestClient(app)

    response = client.post(
        "/auth/register",
        json={
            "email": "Customer@Example.com",
            "password": "supersecret123",
            "first_name": "Casey",
            "last_name": "Nguyen",
            "phone": "+55 11 99999-9999",
            "marketing_opt_in": True,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]
    assert payload["user"]["email"] == "customer@example.com"
    assert payload["user"]["role"] == "customer"
    assert payload["user"]["customer"]["first_name"] == "Casey"
    assert payload["user"]["customer"]["marketing_opt_in"] is True

    with SessionLocal() as session:
        user = session.scalar(select(CommerceUser).where(CommerceUser.email == "customer@example.com"))
        customer = session.scalar(select(CommerceCustomer).where(CommerceCustomer.user_id == user.id))
        assert user is not None
        assert customer is not None


def test_login_me_and_logout_flow() -> None:
    client = TestClient(app)

    register_response = client.post(
        "/auth/register",
        json={
            "email": "member@example.com",
            "password": "supersecret123",
            "first_name": "Member",
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={"email": "member@example.com", "password": "supersecret123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "member@example.com"

    logout_response = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_response.status_code == 204


def test_inactive_user_cannot_login() -> None:
    with SessionLocal() as session:
        user = CommerceUser(
            email="inactive@example.com",
            password_hash=hash_password("supersecret123"),
            role="customer",
            is_active=False,
        )
        session.add(user)
        session.commit()

    client = TestClient(app)
    response = client.post(
        "/auth/login",
        json={"email": "inactive@example.com", "password": "supersecret123"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Inactive users cannot login."


def test_protected_routes_require_authentication_and_admin_role() -> None:
    client = TestClient(app)

    anonymous_me = client.get("/auth/me")
    anonymous_admin = client.get("/auth/admin/check")
    assert anonymous_me.status_code == 401
    assert anonymous_admin.status_code == 401

    with SessionLocal() as session:
        customer_user = CommerceUser(
            email="customer@example.com",
            password_hash=hash_password("supersecret123"),
            role="customer",
            is_active=True,
        )
        admin_user = CommerceUser(
            email="admin@example.com",
            password_hash=hash_password("supersecret123"),
            role="admin",
            is_active=True,
        )
        session.add_all([customer_user, admin_user])
        session.commit()
        session.refresh(customer_user)
        session.refresh(admin_user)

        customer_token = create_access_token(subject=str(customer_user.id), role=customer_user.role)
        admin_token = create_access_token(subject=str(admin_user.id), role=admin_user.role)

    customer_admin_response = client.get(
        "/auth/admin/check",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    admin_response = client.get(
        "/auth/admin/check",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert customer_admin_response.status_code == 403
    assert admin_response.status_code == 200
    assert admin_response.json() == {"status": "ok", "role": "admin"}
