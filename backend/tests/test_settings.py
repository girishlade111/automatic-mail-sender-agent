"""Tests for the settings/gmail accounts API endpoints and top-level routes."""
from app.models import Campaign, Contact, EmailLog


class TestHealthEndpoint:
    def test_health_check(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["database"] == "connected"
        assert "app" in data


class TestTopLevelLogsEndpoint:
    def test_get_logs_empty(self, client):
        response = client.get("/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert data["logs"] == []
        assert data["total"] == 0

    def test_get_logs_with_pagination(self, client, db_session):
        campaign = Campaign(name="Top Log Test", status="Draft")
        db_session.add(campaign)
        db_session.commit()
        db_session.refresh(campaign)

        contact = Contact(campaign_id=campaign.id, email="top@test.com", status="Valid")
        db_session.add(contact)
        db_session.commit()
        db_session.refresh(contact)

        for i in range(5):
            db_session.add(EmailLog(contact_id=contact.id, status="Sent", message=f"msg{i}"))
        db_session.commit()

        response = client.get("/api/logs", params={"skip": 0, "limit": 2})
        assert response.status_code == 200
        data = response.json()
        assert len(data["logs"]) == 2
        assert data["total"] == 5

    def test_get_logs_filter_by_status(self, client, db_session):
        campaign = Campaign(name="Filter", status="Draft")
        db_session.add(campaign)
        db_session.commit()
        db_session.refresh(campaign)

        contact = Contact(campaign_id=campaign.id, email="f@t.com", status="Valid")
        db_session.add(contact)
        db_session.commit()
        db_session.refresh(contact)

        db_session.add(EmailLog(contact_id=contact.id, status="Sent", message="ok"))
        db_session.add(EmailLog(contact_id=contact.id, status="Failed", message="err"))
        db_session.commit()

        response = client.get("/api/logs", params={"status": "Failed"})
        assert response.status_code == 200
        data = response.json()
        assert len(data["logs"]) == 1
        assert data["logs"][0]["status"] == "Failed"
        assert data["total"] == 1

    def test_get_logs_includes_contact_email(self, client, db_session):
        campaign = Campaign(name="Email Test", status="Draft")
        db_session.add(campaign)
        db_session.commit()
        db_session.refresh(campaign)

        contact = Contact(campaign_id=campaign.id, email="visible@test.com", status="Valid")
        db_session.add(contact)
        db_session.commit()
        db_session.refresh(contact)

        db_session.add(EmailLog(contact_id=contact.id, status="Sent", message="ok"))
        db_session.commit()

        response = client.get("/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert data["logs"][0]["contact_email"] == "visible@test.com"


class TestGmailAccounts:
    def test_add_gmail_account(self, client):
        response = client.post("/api/settings/gmail", json={
            "email": "test@gmail.com",
            "app_password": "test-app-password",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@gmail.com"
        assert data["id"] is not None

    def test_list_gmail_accounts(self, client):
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

    def test_delete_gmail_account(self, client):
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
