from app.models import Campaign, Contact, GeneratedEmail


def test_get_campaign_contacts(client, db):
    c = Campaign(name="Test")
    db.add(c)
    db.commit()

    contact = Contact(email="a@b.com", name="Alice", campaign_id=c.id, status="Valid")
    db.add(contact)
    db.commit()

    resp = client.get(f"/api/contacts/{c.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["email"] == "a@b.com"
    assert data[0]["name"] == "Alice"


def test_get_generated_email(client, db):
    c = Campaign(name="Test")
    db.add(c)
    db.commit()

    contact = Contact(email="a@b.com", campaign_id=c.id)
    db.add(contact)
    db.commit()

    gen = GeneratedEmail(contact_id=contact.id, subject="Hello", body="World", status="Pending")
    db.add(gen)
    db.commit()

    resp = client.get(f"/api/contacts/{contact.id}/email")
    assert resp.status_code == 200
    assert resp.json()["subject"] == "Hello"
    assert resp.json()["body"] == "World"


def test_get_generated_email_not_found(client):
    resp = client.get("/api/contacts/999/email")
    assert resp.status_code == 404


def test_approve_email(client, db):
    c = Campaign(name="Test")
    db.add(c)
    db.commit()

    contact = Contact(email="a@b.com", campaign_id=c.id)
    db.add(contact)
    db.commit()

    gen = GeneratedEmail(contact_id=contact.id, subject="S", body="B", status="Pending")
    db.add(gen)
    db.commit()

    resp = client.put(f"/api/contacts/emails/{gen.id}/approve")
    assert resp.status_code == 200
    db.refresh(gen)
    assert gen.status == "Approved"


def test_approve_email_not_found(client):
    resp = client.put("/api/contacts/emails/999/approve")
    assert resp.status_code == 404


def test_edit_email(client, db):
    c = Campaign(name="Test")
    db.add(c)
    db.commit()

    contact = Contact(email="a@b.com", campaign_id=c.id)
    db.add(contact)
    db.commit()

    gen = GeneratedEmail(contact_id=contact.id, subject="Old", body="Old body", status="Approved")
    db.add(gen)
    db.commit()

    resp = client.put(f"/api/contacts/emails/{gen.id}", json={
        "subject": "New Subject",
        "body": "New body",
    })
    assert resp.status_code == 200
    assert resp.json()["subject"] == "New Subject"
    assert resp.json()["body"] == "New body"
    assert resp.json()["status"] == "Pending"


def test_edit_email_not_found(client):
    resp = client.put("/api/contacts/emails/999", json={"subject": "S", "body": "B"})
    assert resp.status_code == 404


def test_approve_all_emails(client, db):
    c = Campaign(name="Test")
    db.add(c)
    db.commit()

    c1 = Contact(email="a@b.com", campaign_id=c.id)
    c2 = Contact(email="b@b.com", campaign_id=c.id)
    db.add_all([c1, c2])
    db.commit()

    gen1 = GeneratedEmail(contact_id=c1.id, subject="S1", body="B1", status="Pending")
    gen2 = GeneratedEmail(contact_id=c2.id, subject="S2", body="B2", status="Pending")
    db.add_all([gen1, gen2])
    db.commit()

    resp = client.put(f"/api/contacts/campaigns/{c.id}/approve-all")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Approved 2 emails"

    db.refresh(gen1)
    db.refresh(gen2)
    assert gen1.status == "Approved"
    assert gen2.status == "Approved"
