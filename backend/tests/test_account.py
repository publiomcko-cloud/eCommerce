from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.commerce_customer import CommerceCustomer
from app.models.commerce_customer_address import CommerceCustomerAddress
from app.models.commerce_user import CommerceUser
from tests.test_payments import create_order_for_payment_flow


def create_customer_user(*, email: str) -> str:
    client = TestClient(app)
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "supersecret123",
            "first_name": "Casey",
            "last_name": "Customer",
            "phone": "+55 11 90000-0000",
            "marketing_opt_in": True,
        },
    )
    assert response.status_code == 201
    return response.json()["access_token"]


def test_account_profile_and_address_crud_flow() -> None:
    client = TestClient(app)
    token = create_customer_user(email="account-owner@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    profile_response = client.get("/account/profile", headers=headers)
    assert profile_response.status_code == 200
    assert profile_response.json()["email"] == "account-owner@example.com"
    assert profile_response.json()["address_count"] == 0

    create_response = client.post(
        "/account/addresses",
        headers=headers,
        json={
            "type": "both",
            "recipient_name": "Casey Customer",
            "phone": "+55 11 90000-0000",
            "line1": "Rua das Flores, 10",
            "line2": "Apto 12",
            "city": "Sao Paulo",
            "region": "SP",
            "postal_code": "01000-000",
            "country": "br",
            "is_default": True,
        },
    )
    assert create_response.status_code == 201
    created_address = create_response.json()
    assert created_address["type"] == "both"
    assert created_address["country"] == "BR"
    assert created_address["is_default"] is True

    update_response = client.put(
        f"/account/addresses/{created_address['id']}",
        headers=headers,
        json={
            "type": "shipping",
            "recipient_name": "Casey Updated",
            "phone": "+55 11 91111-1111",
            "line1": "Rua Nova, 55",
            "line2": "",
            "city": "Campinas",
            "region": "SP",
            "postal_code": "13000-000",
            "country": "BR",
            "is_default": True,
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["recipient_name"] == "Casey Updated"
    assert update_response.json()["city"] == "Campinas"

    list_response = client.get("/account/addresses", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["recipient_name"] == "Casey Updated"

    delete_response = client.delete(f"/account/addresses/{created_address['id']}", headers=headers)
    assert delete_response.status_code == 204

    profile_after_delete = client.get("/account/profile", headers=headers)
    assert profile_after_delete.status_code == 200
    assert profile_after_delete.json()["address_count"] == 0


def test_account_orders_respect_customer_ownership() -> None:
    client = TestClient(app)
    owner_token, order_id, _ = create_order_for_payment_flow(quantity=2, stock_on_hand=6)
    intruder_token = create_customer_user(email="intruder@example.com")

    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    intruder_headers = {"Authorization": f"Bearer {intruder_token}"}

    owner_list_response = client.get("/account/orders", headers=owner_headers)
    assert owner_list_response.status_code == 200
    assert owner_list_response.json()["total"] == 1
    assert owner_list_response.json()["items"][0]["id"] == order_id
    assert owner_list_response.json()["items"][0]["payment_status"] is None

    owner_detail_response = client.get(f"/account/orders/{order_id}", headers=owner_headers)
    assert owner_detail_response.status_code == 200
    assert owner_detail_response.json()["id"] == order_id

    intruder_detail_response = client.get(f"/account/orders/{order_id}", headers=intruder_headers)
    assert intruder_detail_response.status_code == 404
    assert intruder_detail_response.json()["detail"] == "Order not found."


def test_account_address_updates_are_scoped_to_owner() -> None:
    owner_token = create_customer_user(email="address-owner@example.com")
    intruder_token = create_customer_user(email="address-intruder@example.com")

    with SessionLocal() as session:
        owner_user = session.query(CommerceUser).filter(CommerceUser.email == "address-owner@example.com").one()
        owner_customer = session.query(CommerceCustomer).filter(CommerceCustomer.user_id == owner_user.id).one()
        address = CommerceCustomerAddress(
            customer_id=owner_customer.id,
            type="shipping",
            recipient_name="Owner Recipient",
            phone=None,
            line1="Rua A, 1",
            line2=None,
            city="Sao Paulo",
            region="SP",
            postal_code="01000-000",
            country="BR",
            is_default=False,
        )
        session.add(address)
        session.commit()
        session.refresh(address)
        address_id = str(address.id)

    client = TestClient(app)
    intruder_headers = {"Authorization": f"Bearer {intruder_token}"}
    response = client.put(
        f"/account/addresses/{address_id}",
        headers=intruder_headers,
        json={
            "type": "billing",
            "recipient_name": "Nope",
            "phone": None,
            "line1": "Rua X, 9",
            "line2": None,
            "city": "Rio de Janeiro",
            "region": "RJ",
            "postal_code": "20000-000",
            "country": "BR",
            "is_default": False,
        },
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Address not found."
