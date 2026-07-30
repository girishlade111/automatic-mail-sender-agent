"""Tests for the contacts API endpoints."""

from app.models import Contact, GeneratedEmail


def test_get_contacts_for_campaign(client):
    """GET /api/contacts/{campaign_id} returns contacts for a campaign."""
    # Create campaign and upload contacts
    create_resp = client.post("/api/campaigns/", json={"name": "Contacts Test"})
    campaign_id = create_resp.json()["id"]

    csv_content = "email,name,company\nalice@example.com,Alice,Acme\nbob@example.com,Bob,Widgets"
    client.post(
        f"/api/campaigns/{campaign_id}/upload",
        files={"file": ("test.csv", csv_content, "text/csv")},
    )

    response = client.get(f"/api/contacts/{campaign_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["email"] in ["alice@example.com", "bob@example.com"]


def test_approve_email(client, db_session):
    """PUT /api/contacts/emails/{id}/approve sets status to Approved."""
    # Create a campaign and contact first
    create_resp = client.post("/api/campaigns/", json={"name": "Approve Test"})
    campaign_id = create_resp.json()["id"]

    # Create a contact directly in DB
    contact = Contact(
        email="test@example.com",
        name="Test User",
        campaign_id=campaign_id,
        status="Valid",
    )
    db_session.add(contact)
    db_session.commit()
    db_session.refresh(contact)

    # Create a generated email
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


def test_approve_all_emails(client, db_session):
    """PUT /api/contacts/campaigns/{campaign_id}/approve-all approves all pending emails."""
    create_resp = client.post("/api/campaigns/", json={"name": "Approve All Test"})
    campaign_id = create_resp.json()["id"]

    # Create contacts with generated emails
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


def test_edit_email(client, db_session):
    """PUT /api/contacts/emails/{id} edits subject and body."""
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
