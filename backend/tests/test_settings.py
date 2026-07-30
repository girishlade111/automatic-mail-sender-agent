"""Tests for the settings/gmail accounts API endpoints and top-level routes."""
import pytest
from app.models import Campaign, Contact, EmailLog
from tests.conftest import client, db_session


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
        assert response.json() == []

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
        assert len(response.json()) == 2

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
        logs = response.json()
        assert len(logs) == 1
        assert logs[0]["status"] == "Failed"
