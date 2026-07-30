"""Tests for the dashboard and logs API endpoints."""
import pytest
from app.models import Contact, EmailLog, Campaign
from tests.conftest import client, db_session


class TestDashboardStats:
    def test_dashboard_stats_empty(self, client):
        response = client.get("/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["total_campaigns"] == 0
        assert data["emails_sent"] == 0
        assert data["success_rate"] == 0.0

    def test_dashboard_stats_with_campaign(self, client):
        client.post("/api/campaigns/", json={"name": "Stats Campaign"})
        response = client.get("/api/dashboard/stats")
        assert response.status_code == 200
        assert response.json()["total_campaigns"] == 1


class TestLogsEndpoint:
    def test_get_logs_empty(self, client):
        response = client.get("/api/dashboard/logs")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_logs_with_data(self, client, db_session):
        # Create campaign and contact directly in DB for log testing
        campaign = Campaign(name="Log Test", status="Draft")
        db_session.add(campaign)
        db_session.commit()
        db_session.refresh(campaign)

        contact = Contact(
            campaign_id=campaign.id,
            email="log@test.com",
            status="Valid",
        )
        db_session.add(contact)
        db_session.commit()
        db_session.refresh(contact)

        log1 = EmailLog(contact_id=contact.id, status="Sent", message="OK")
        log2 = EmailLog(contact_id=contact.id, status="Failed", message="Error")
        db_session.add_all([log1, log2])
        db_session.commit()

        response = client.get("/api/dashboard/logs")
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) == 2

    def test_get_logs_filter_by_status(self, client, db_session):
        campaign = Campaign(name="Filter Test", status="Draft")
        db_session.add(campaign)
        db_session.commit()
        db_session.refresh(campaign)

        contact = Contact(
            campaign_id=campaign.id,
            email="filter@test.com",
            status="Valid",
        )
        db_session.add(contact)
        db_session.commit()
        db_session.refresh(contact)

        db_session.add(EmailLog(contact_id=contact.id, status="Sent", message="OK"))
        db_session.add(EmailLog(contact_id=contact.id, status="Failed", message="Bad"))
        db_session.commit()

        response = client.get("/api/dashboard/logs", params={"status": "Sent"})
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) == 1
        assert logs[0]["status"] == "Sent"

    def test_get_logs_filter_by_campaign(self, client, db_session):
        c1 = Campaign(name="C1", status="Draft")
        c2 = Campaign(name="C2", status="Draft")
        db_session.add_all([c1, c2])
        db_session.commit()
        db_session.refresh(c1)
        db_session.refresh(c2)

        contact1 = Contact(campaign_id=c1.id, email="a@a.com", status="Valid")
        contact2 = Contact(campaign_id=c2.id, email="b@b.com", status="Valid")
        db_session.add_all([contact1, contact2])
        db_session.commit()
        db_session.refresh(contact1)
        db_session.refresh(contact2)

        db_session.add(EmailLog(contact_id=contact1.id, status="Sent", message="OK"))
        db_session.add(EmailLog(contact_id=contact2.id, status="Sent", message="OK"))
        db_session.commit()

        response = client.get("/api/dashboard/logs", params={"campaign_id": c1.id})
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) == 1

    def test_get_logs_pagination(self, client, db_session):
        campaign = Campaign(name="Page Test", status="Draft")
        db_session.add(campaign)
        db_session.commit()
        db_session.refresh(campaign)

        contact = Contact(campaign_id=campaign.id, email="page@test.com", status="Valid")
        db_session.add(contact)
        db_session.commit()
        db_session.refresh(contact)

        for i in range(10):
            db_session.add(EmailLog(contact_id=contact.id, status="Sent", message=f"msg{i}"))
        db_session.commit()

        response = client.get("/api/dashboard/logs", params={"skip": 0, "limit": 3})
        assert response.status_code == 200
        assert len(response.json()) == 3

        response = client.get("/api/dashboard/logs", params={"skip": 8, "limit": 5})
        assert response.status_code == 200
        assert len(response.json()) == 2
