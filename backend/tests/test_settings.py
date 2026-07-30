"""Tests for the settings API endpoints."""


def test_add_gmail_account(client):
    """POST /api/settings/gmail adds a Gmail account."""
    response = client.post("/api/settings/gmail", json={
        "email": "test@gmail.com",
        "app_password": "test-app-password",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@gmail.com"
    assert data["id"] is not None


def test_list_gmail_accounts(client):
    """GET /api/settings/gmail returns all accounts."""
    # Add two accounts
    client.post("/api/settings/gmail", json={
        "email": "first@gmail.com",
        "app_password": "pass1",
    })
    client.post("/api/settings/gmail", json={
        "email": "second@gmail.com",
        "app_password": "pass2",
    })

    response = client.get("/api/settings/gmail")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_delete_gmail_account(client):
    """DELETE /api/settings/gmail/{id} removes the account."""
    create_resp = client.post("/api/settings/gmail", json={
        "email": "delete@gmail.com",
        "app_password": "pass",
    })
    account_id = create_resp.json()["id"]

    response = client.delete(f"/api/settings/gmail/{account_id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Disconnected"

    # Confirm deletion
    list_resp = client.get("/api/settings/gmail")
    assert len(list_resp.json()) == 0
