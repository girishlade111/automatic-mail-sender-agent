from app.models import Campaign, Contact, GeneratedEmail, EmailLog


def test_create_campaign(client):
    resp = client.post("/api/campaigns/", json={
        "name": "Test Campaign",
        "type": "Cold Outreach",
        "prompt_template": "Hello {{name}}",
        "tone": "Professional",
        "length": "Medium",
        "temperature": 0.7,
        "delay_seconds": 20,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Test Campaign"
    assert data["status"] == "Draft"
    assert data["id"] > 0


def test_get_campaigns(client, db):
    db.add(Campaign(name="C1"))
    db.add(Campaign(name="C2"))
    db.commit()

    resp = client.get("/api/campaigns/")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    names = {c["name"] for c in data}
    assert names == {"C1", "C2"}


def test_get_campaign_not_found(client):
    resp = client.get("/api/campaigns/999")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Campaign not found"


def test_get_campaign(client, db):
    c = Campaign(name="My Campaign", status="Draft")
    db.add(c)
    db.commit()

    resp = client.get(f"/api/campaigns/{c.id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "My Campaign"


def test_delete_campaign(client, db):
    c = Campaign(name="To Delete")
    db.add(c)
    db.commit()

    resp = client.delete(f"/api/campaigns/{c.id}")
    assert resp.status_code == 200
    assert db.query(Campaign).count() == 0


def test_delete_campaign_not_found(client):
    resp = client.delete("/api/campaigns/999")
    assert resp.status_code == 404


def test_pause_campaign(client, db):
    c = Campaign(name="Test", status="Sending")
    db.add(c)
    db.commit()

    resp = client.post(f"/api/campaigns/{c.id}/pause")
    assert resp.status_code == 200
    db.refresh(c)
    assert c.status == "Paused"


def test_resume_campaign(client, db):
    c = Campaign(name="Test", status="Paused")
    db.add(c)
    db.commit()

    resp = client.post(f"/api/campaigns/{c.id}/resume?gmail_account_id=1")
    assert resp.status_code == 200


def test_stop_campaign(client, db):
    c = Campaign(name="Test", status="Sending")
    db.add(c)
    db.commit()

    resp = client.post(f"/api/campaigns/{c.id}/stop")
    assert resp.status_code == 200
    db.refresh(c)
    assert c.status == "Stopped"


def test_generate_emails(client, db):
    c = Campaign(name="Test", status="Draft")
    db.add(c)
    db.commit()

    resp = client.post(f"/api/campaigns/{c.id}/generate")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Generation task started"
    db.refresh(c)
    assert c.status == "Generating"


def test_upload_contacts_csv(client, db):
    c = Campaign(name="Test")
    db.add(c)
    db.commit()

    csv_content = b"email,name,company\ntest@example.com,John,Acme\n"
    resp = client.post(
        f"/api/campaigns/{c.id}/upload",
        files={"file": ("contacts.csv", csv_content, "text/csv")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] == 1
    assert data["invalid"] == 0


def test_upload_contacts_invalid_file_type(client, db):
    c = Campaign(name="Test")
    db.add(c)
    db.commit()

    resp = client.post(
        f"/api/campaigns/{c.id}/upload",
        files={"file": ("contacts.xyz", b"data", "application/octet-stream")},
    )
    assert resp.status_code == 400


def test_upload_contacts_campaign_not_found(client):
    resp = client.post(
        "/api/campaigns/999/upload",
        files={"file": ("contacts.csv", b"email\nx@y.com", "text/csv")},
    )
    assert resp.status_code == 404


def test_campaign_stats(client, db):
    c = Campaign(name="Stats Test")
    db.add(c)
    db.commit()

    contact = Contact(email="a@b.com", campaign_id=c.id, status="Valid")
    db.add(contact)
    db.commit()

    gen = GeneratedEmail(contact_id=contact.id, subject="Hi", body="Body", status="Approved")
    db.add(gen)
    db.commit()

    resp = client.get(f"/api/campaigns/{c.id}/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["valid"] == 1
    assert data["generated"] == 1
    assert data["approved"] == 1


def test_campaign_logs(client, db):
    c = Campaign(name="Log Test")
    db.add(c)
    db.commit()

    contact = Contact(email="a@b.com", campaign_id=c.id)
    db.add(contact)
    db.commit()

    log = EmailLog(contact_id=contact.id, status="Sent", message="OK")
    db.add(log)
    db.commit()

    resp = client.get(f"/api/campaigns/{c.id}/logs")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["status"] == "Sent"
