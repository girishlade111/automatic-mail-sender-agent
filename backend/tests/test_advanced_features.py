"""Tests for FEAT-003: scheduling, A/B testing, contact scoring, preflight, webhooks."""
import json
import pytest
from tests.conftest import client, db_session, setup_database
from app.models import Campaign, Contact, GeneratedEmail, GmailAccount, WebhookConfig
from app.security import encrypt_password


# ======================== Scheduling ========================

class TestScheduling:
    def test_schedule_campaign(self, client, db_session):
        campaign = Campaign(name="Test Schedule", status="Draft")
        db_session.add(campaign)
        db_session.commit()

        resp = client.post(f"/api/campaigns/{campaign.id}/schedule", json={
            "scheduled_at": "2099-12-25T10:00:00"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "Scheduled"
        assert data["scheduled_at"] is not None

    def test_schedule_campaign_not_found(self, client):
        resp = client.post("/api/campaigns/9999/schedule", json={
            "scheduled_at": "2025-12-25T10:00:00"
        })
        assert resp.status_code == 404


# ======================== A/B Testing ========================

class TestABTesting:
    def test_setup_ab_test(self, client, db_session):
        campaign = Campaign(name="AB Test", status="Draft")
        db_session.add(campaign)
        db_session.commit()

        resp = client.post(f"/api/campaigns/{campaign.id}/ab-test", json={
            "variants": [
                {"label": "Variant A", "prompt_template": "Hello {{name}}, try our product"},
                {"label": "Variant B", "prompt_template": "Hi {{name}}, check this out"},
            ]
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["ab_variants"] is not None
        variants = json.loads(data["ab_variants"])
        assert len(variants) == 2
        assert variants[0]["label"] == "Variant A"

    def test_ab_test_requires_two_variants(self, client, db_session):
        campaign = Campaign(name="AB Single", status="Draft")
        db_session.add(campaign)
        db_session.commit()

        resp = client.post(f"/api/campaigns/{campaign.id}/ab-test", json={
            "variants": [{"label": "Only A", "prompt_template": "hello"}]
        })
        assert resp.status_code == 400

    def test_ab_results_empty(self, client, db_session):
        campaign = Campaign(name="AB Results", status="Draft")
        db_session.add(campaign)
        db_session.commit()

        resp = client.get(f"/api/campaigns/{campaign.id}/ab-results")
        assert resp.status_code == 200
        data = resp.json()
        assert data["campaign_id"] == campaign.id
        assert data["variants"] == []

    def test_ab_results_with_data(self, client, db_session):
        campaign = Campaign(name="AB Results2", status="Generated")
        db_session.add(campaign)
        db_session.commit()

        c1 = Contact(campaign_id=campaign.id, email="a@test.com", status="Valid")
        c2 = Contact(campaign_id=campaign.id, email="b@test.com", status="Valid")
        db_session.add_all([c1, c2])
        db_session.commit()

        e1 = GeneratedEmail(contact_id=c1.id, subject="Hi", body="body", status="Sent", variant_label="A")
        e2 = GeneratedEmail(contact_id=c2.id, subject="Hey", body="body2", status="Failed", variant_label="B")
        db_session.add_all([e1, e2])
        db_session.commit()

        resp = client.get(f"/api/campaigns/{campaign.id}/ab-results")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["variants"]) == 2
        labels = {v["label"] for v in data["variants"]}
        assert "A" in labels
        assert "B" in labels

    def test_ab_test_not_found(self, client):
        resp = client.post("/api/campaigns/9999/ab-test", json={
            "variants": [
                {"label": "A", "prompt_template": "a"},
                {"label": "B", "prompt_template": "b"},
            ]
        })
        assert resp.status_code == 404


# ======================== Contact Scoring ========================

class TestContactScoring:
    def test_update_contact_score(self, client, db_session):
        campaign = Campaign(name="Score Test", status="Draft")
        db_session.add(campaign)
        db_session.commit()

        contact = Contact(campaign_id=campaign.id, email="test@example.com", status="Valid", name="John")
        db_session.add(contact)
        db_session.commit()

        resp = client.put(f"/api/contacts/{contact.id}/score", json={"score": 5})
        assert resp.status_code == 200
        assert resp.json()["score"] == 5

    def test_update_contact_score_not_found(self, client):
        resp = client.put("/api/contacts/9999/score", json={"score": 3})
        assert resp.status_code == 404

    def test_auto_score_on_manual_add(self, client, db_session):
        campaign = Campaign(name="Auto Score", status="Draft")
        db_session.add(campaign)
        db_session.commit()

        resp = client.post("/api/contacts/manual", json={
            "email": "scored@test.com",
            "name": "John Doe",
            "company": "Acme",
            "role": "CTO",
            "campaign_id": campaign.id,
        })
        assert resp.status_code == 200
        # name, company, role = 3 points
        assert resp.json()["score"] == 3


# ======================== Preflight Check ========================

class TestPreflightCheck:
    def test_preflight_no_approved_no_gmail(self, client, db_session):
        campaign = Campaign(name="Preflight Test", status="Generated")
        db_session.add(campaign)
        db_session.commit()

        resp = client.post(f"/api/campaigns/{campaign.id}/preflight")
        assert resp.status_code == 200
        data = resp.json()
        assert data["can_proceed"] is False
        # Should have failed checks
        names = [c["name"] for c in data["checks"]]
        assert "Approved Emails" in names
        assert "Gmail Account" in names

    def test_preflight_with_approved_emails_no_gmail(self, client, db_session):
        campaign = Campaign(name="Preflight2", status="Generated")
        db_session.add(campaign)
        db_session.commit()

        contact = Contact(campaign_id=campaign.id, email="a@test.com", status="Valid")
        db_session.add(contact)
        db_session.commit()

        email = GeneratedEmail(contact_id=contact.id, subject="Test", body="body", status="Approved")
        db_session.add(email)
        db_session.commit()

        resp = client.post(f"/api/campaigns/{campaign.id}/preflight")
        assert resp.status_code == 200
        data = resp.json()
        # Approved passes, but no Gmail => still can't proceed
        assert data["can_proceed"] is False
        approved_check = next(c for c in data["checks"] if c["name"] == "Approved Emails")
        assert approved_check["status"] == "pass"

    def test_preflight_not_found(self, client):
        resp = client.post("/api/campaigns/9999/preflight")
        assert resp.status_code == 404


# ======================== Webhooks ========================

class TestWebhooks:
    def test_create_webhook(self, client, db_session):
        resp = client.post("/api/settings/webhooks", json={
            "url": "https://example.com/hook",
            "events": ["completed", "failed"],
            "active": True,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["url"] == "https://example.com/hook"
        assert data["events"] == ["completed", "failed"]
        assert data["active"] is True
        assert "id" in data

    def test_list_webhooks(self, client, db_session):
        # Create two webhooks
        client.post("/api/settings/webhooks", json={
            "url": "https://a.com/hook", "events": ["completed"], "active": True
        })
        client.post("/api/settings/webhooks", json={
            "url": "https://b.com/hook", "events": ["failed"], "active": False
        })

        resp = client.get("/api/settings/webhooks")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_update_webhook(self, client, db_session):
        create_resp = client.post("/api/settings/webhooks", json={
            "url": "https://old.com/hook", "events": ["completed"], "active": True
        })
        wh_id = create_resp.json()["id"]

        resp = client.put(f"/api/settings/webhooks/{wh_id}", json={
            "url": "https://new.com/hook",
            "events": ["completed", "paused"],
            "active": False,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["url"] == "https://new.com/hook"
        assert data["events"] == ["completed", "paused"]
        assert data["active"] is False

    def test_update_webhook_not_found(self, client):
        resp = client.put("/api/settings/webhooks/9999", json={"url": "https://x.com"})
        assert resp.status_code == 404

    def test_delete_webhook(self, client, db_session):
        create_resp = client.post("/api/settings/webhooks", json={
            "url": "https://del.com/hook", "events": ["failed"], "active": True
        })
        wh_id = create_resp.json()["id"]

        resp = client.delete(f"/api/settings/webhooks/{wh_id}")
        assert resp.status_code == 200

        # Verify gone
        list_resp = client.get("/api/settings/webhooks")
        assert all(w["id"] != wh_id for w in list_resp.json())

    def test_delete_webhook_not_found(self, client):
        resp = client.delete("/api/settings/webhooks/9999")
        assert resp.status_code == 404
