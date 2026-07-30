"""Tests for the campaigns API endpoints."""
import pytest
from tests.conftest import client, db_session


class TestCampaignsCRUD:
    def test_create_campaign(self, client):
        response = client.post("/api/campaigns/", json={
            "name": "Test Campaign",
            "description": "A test campaign",
            "type": "Cold Outreach",
            "tone": "professional",
            "length": "medium",
            "temperature": 0.7,
            "delay_seconds": 15,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Campaign"
        assert data["status"] == "Draft"
        assert data["id"] is not None

    def test_list_campaigns(self, client):
        client.post("/api/campaigns/", json={"name": "Campaign A"})
        client.post("/api/campaigns/", json={"name": "Campaign B"})
        response = client.get("/api/campaigns/")
        assert response.status_code == 200
        campaigns = response.json()
        assert len(campaigns) == 2

    def test_get_campaign(self, client):
        create_resp = client.post("/api/campaigns/", json={"name": "My Campaign"})
        campaign_id = create_resp.json()["id"]
        response = client.get(f"/api/campaigns/{campaign_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "My Campaign"

    def test_get_campaign_not_found(self, client):
        response = client.get("/api/campaigns/9999")
        assert response.status_code == 404

    def test_update_campaign(self, client):
        create_resp = client.post("/api/campaigns/", json={"name": "Original"})
        campaign_id = create_resp.json()["id"]
        response = client.put(f"/api/campaigns/{campaign_id}", json={
            "name": "Updated Name",
            "tone": "casual",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["tone"] == "casual"

    def test_update_campaign_not_found(self, client):
        response = client.put("/api/campaigns/9999", json={"name": "X"})
        assert response.status_code == 404

    def test_delete_campaign(self, client):
        create_resp = client.post("/api/campaigns/", json={"name": "To Delete"})
        campaign_id = create_resp.json()["id"]
        del_resp = client.delete(f"/api/campaigns/{campaign_id}")
        assert del_resp.status_code == 200
        get_resp = client.get(f"/api/campaigns/{campaign_id}")
        assert get_resp.status_code == 404


class TestCampaignDuplicate:
    def test_duplicate_campaign(self, client):
        create_resp = client.post("/api/campaigns/", json={
            "name": "Original Campaign",
            "tone": "friendly",
            "temperature": 0.9,
        })
        campaign_id = create_resp.json()["id"]
        dup_resp = client.post(f"/api/campaigns/{campaign_id}/duplicate")
        assert dup_resp.status_code == 200
        data = dup_resp.json()
        assert data["name"] == "Original Campaign (Copy)"
        assert data["status"] == "Draft"
        assert data["tone"] == "friendly"
        assert data["temperature"] == 0.9
        assert data["id"] != campaign_id

    def test_duplicate_not_found(self, client):
        response = client.post("/api/campaigns/9999/duplicate")
        assert response.status_code == 404


class TestCampaignExport:
    def test_export_csv(self, client):
        create_resp = client.post("/api/campaigns/", json={"name": "Export Test"})
        campaign_id = create_resp.json()["id"]
        # Add a contact
        client.post("/api/contacts/manual", json={
            "campaign_id": campaign_id,
            "email": "export@test.com",
            "name": "Export User",
            "company": "ExportCo",
        })
        response = client.get(f"/api/campaigns/{campaign_id}/contacts/export")
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]
        content = response.text
        assert "export@test.com" in content
        assert "Export User" in content

    def test_export_not_found(self, client):
        response = client.get("/api/campaigns/9999/contacts/export")
        assert response.status_code == 404


class TestCampaignSendValidation:
    def test_send_without_approved_emails_fails(self, client):
        create_resp = client.post("/api/campaigns/", json={"name": "Send Test"})
        campaign_id = create_resp.json()["id"]
        response = client.post(
            f"/api/campaigns/{campaign_id}/send",
            params={"gmail_account_id": 1},
        )
        assert response.status_code == 400
        assert "no approved emails" in response.json()["detail"].lower()


class TestCampaignStats:
    def test_stats_empty_campaign(self, client):
        create_resp = client.post("/api/campaigns/", json={"name": "Stats Test"})
        campaign_id = create_resp.json()["id"]
        response = client.get(f"/api/campaigns/{campaign_id}/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["valid"] == 0


class TestCampaignPauseStopResume:
    def test_pause_campaign(self, client):
        create_resp = client.post("/api/campaigns/", json={"name": "Pause Test"})
        campaign_id = create_resp.json()["id"]
        response = client.post(f"/api/campaigns/{campaign_id}/pause")
        assert response.status_code == 200
        get_resp = client.get(f"/api/campaigns/{campaign_id}")
        assert get_resp.json()["status"] == "Paused"

    def test_stop_campaign(self, client):
        create_resp = client.post("/api/campaigns/", json={"name": "Stop Test"})
        campaign_id = create_resp.json()["id"]
        response = client.post(f"/api/campaigns/{campaign_id}/stop")
        assert response.status_code == 200
        get_resp = client.get(f"/api/campaigns/{campaign_id}")
        assert get_resp.json()["status"] == "Stopped"
