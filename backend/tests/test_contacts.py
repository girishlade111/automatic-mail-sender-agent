"""Tests for the contacts API endpoints."""
from app.models import Contact, GeneratedEmail


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


class TestApproveEmails:
    def test_approve_email(self, client, db_session):
        create_resp = client.post("/api/campaigns/", json={"name": "Approve Test"})
        campaign_id = create_resp.json()["id"]

        contact = Contact(
            email="test@example.com",
            name="Test User",
            campaign_id=campaign_id,
            status="Valid",
        )
        db_session.add(contact)
        db_session.commit()
        db_session.refresh(contact)

        email = GeneratedEmail(
            contact_id=contact.id,
            subject="Hello",
            body="Test body",
            status="Pending",
        )
        db_session.add(email)
        db_session.commit()
        db_session.refresh(email)

        response = client.put(f"/api/contacts/emails/{email.id}/approve")
        assert response.status_code == 200
        assert response.json()["message"] == "Approved"

    def test_approve_all_emails(self, client, db_session):
        create_resp = client.post("/api/campaigns/", json={"name": "Approve All Test"})
        campaign_id = create_resp.json()["id"]

        for i in range(3):
            contact = Contact(
                email=f"user{i}@example.com",
                name=f"User {i}",
                campaign_id=campaign_id,
                status="Valid",
            )
            db_session.add(contact)
            db_session.commit()
            db_session.refresh(contact)

            email = GeneratedEmail(
                contact_id=contact.id,
                subject=f"Subject {i}",
                body=f"Body {i}",
                status="Pending",
            )
            db_session.add(email)

        db_session.commit()

        response = client.put(f"/api/contacts/campaigns/{campaign_id}/approve-all")
        assert response.status_code == 200
        data = response.json()
        assert "Approved 3 emails" in data["message"]

    def test_approve_all_no_emails(self, client):
        campaign_resp = client.post("/api/campaigns/", json={"name": "Approve Test"})
        campaign_id = campaign_resp.json()["id"]
        response = client.put(f"/api/contacts/campaigns/{campaign_id}/approve-all")
        assert response.status_code == 200
        assert "0" in response.json()["message"]


class TestEditEmail:
    def test_edit_email(self, client, db_session):
        create_resp = client.post("/api/campaigns/", json={"name": "Edit Test"})
        campaign_id = create_resp.json()["id"]

        contact = Contact(
            email="edit@example.com",
            name="Edit User",
            campaign_id=campaign_id,
            status="Valid",
        )
        db_session.add(contact)
        db_session.commit()
        db_session.refresh(contact)

        email = GeneratedEmail(
            contact_id=contact.id,
            subject="Original Subject",
            body="Original Body",
            status="Pending",
        )
        db_session.add(email)
        db_session.commit()
        db_session.refresh(email)

        response = client.put(f"/api/contacts/emails/{email.id}", json={
            "subject": "Updated Subject",
            "body": "Updated Body",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["subject"] == "Updated Subject"
        assert data["body"] == "Updated Body"
        assert data["status"] == "Pending"
