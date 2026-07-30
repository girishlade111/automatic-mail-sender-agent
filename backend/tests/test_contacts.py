"""Tests for the contacts API endpoints."""
import pytest
from tests.conftest import client, db_session


class TestManualContactAdd:
    def test_add_manual_contact(self, client):
        # Create campaign first
        campaign_resp = client.post("/api/campaigns/", json={"name": "Contact Test"})
        campaign_id = campaign_resp.json()["id"]

        response = client.post("/api/contacts/manual", json={
            "campaign_id": campaign_id,
            "email": "john@example.com",
            "name": "John Doe",
            "company": "Acme Inc",
            "role": "Engineer",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "john@example.com"
        assert data["name"] == "John Doe"
        assert data["status"] == "Valid"
        assert data["campaign_id"] == campaign_id

    def test_add_manual_contact_invalid_email(self, client):
        campaign_resp = client.post("/api/campaigns/", json={"name": "C"})
        campaign_id = campaign_resp.json()["id"]
        response = client.post("/api/contacts/manual", json={
            "campaign_id": campaign_id,
            "email": "not-an-email",
        })
        assert response.status_code == 422

    def test_add_manual_contact_campaign_not_found(self, client):
        response = client.post("/api/contacts/manual", json={
            "campaign_id": 9999,
            "email": "test@example.com",
        })
        assert response.status_code == 404


class TestGetContacts:
    def test_get_campaign_contacts(self, client):
        campaign_resp = client.post("/api/campaigns/", json={"name": "List Contacts"})
        campaign_id = campaign_resp.json()["id"]

        client.post("/api/contacts/manual", json={
            "campaign_id": campaign_id,
            "email": "a@example.com",
            "name": "Alice",
        })
        client.post("/api/contacts/manual", json={
            "campaign_id": campaign_id,
            "email": "b@example.com",
            "name": "Bob",
        })

        response = client.get(f"/api/contacts/{campaign_id}")
        assert response.status_code == 200
        contacts = response.json()
        assert len(contacts) == 2


class TestApproveAll:
    def test_approve_all_no_emails(self, client):
        campaign_resp = client.post("/api/campaigns/", json={"name": "Approve Test"})
        campaign_id = campaign_resp.json()["id"]
        response = client.put(f"/api/contacts/campaigns/{campaign_id}/approve-all")
        assert response.status_code == 200
        assert "0" in response.json()["message"]
