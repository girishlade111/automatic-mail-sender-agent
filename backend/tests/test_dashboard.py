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
