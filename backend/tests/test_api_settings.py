from app.models import GmailAccount


def test_get_gmail_accounts_empty(client):
    resp = client.get("/api/settings/gmail")
    assert resp.status_code == 200
    assert resp.json() == []


def test_add_gmail_account(client, db):
    resp = client.post("/api/settings/gmail", json={
        "email": "test@gmail.com",
        "app_password": "fake_app_password",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@gmail.com"
    assert data["id"] > 0


def test_get_gmail_accounts(client, db):
    resp = client.post("/api/settings/gmail", json={
        "email": "test@gmail.com",
        "app_password": "fake_pass",
    })
    assert resp.status_code == 200

    resp = client.get("/api/settings/gmail")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["email"] == "test@gmail.com"


def test_test_gmail_account(client, db):
    acc = GmailAccount(email="test@gmail.com", encrypted_password="dGVzdF9rZXk=", user_id=1)
    db.add(acc)
    db.commit()

    resp = client.post(f"/api/settings/gmail/{acc.id}/test")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is False


def test_test_gmail_account_not_found(client):
    resp = client.post("/api/settings/gmail/999/test")
    assert resp.status_code == 404


def test_delete_gmail_account(client, db):
    acc = GmailAccount(email="test@gmail.com", encrypted_password="dGVzdA==", user_id=1)
    db.add(acc)
    db.commit()

    resp = client.delete(f"/api/settings/gmail/{acc.id}")
    assert resp.status_code == 200
    assert db.query(GmailAccount).count() == 0


def test_delete_gmail_account_not_found(client):
    resp = client.delete("/api/settings/gmail/999")
    assert resp.status_code == 404
