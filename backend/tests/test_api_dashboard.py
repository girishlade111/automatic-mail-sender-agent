from app.models import Campaign, Contact, GeneratedEmail, EmailLog


def test_dashboard_stats_empty(client):
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_campaigns"] == 0
    assert data["emails_sent"] == 0
    assert data["failed"] == 0
    assert data["pending"] == 0
    assert data["success_rate"] == 0.0
    assert data["recent_campaigns"] == []
    assert data["recent_logs"] == []


def test_dashboard_stats_with_data(client, db):
    c = Campaign(name="Campaign 1", status="Completed")
    db.add(c)
    db.commit()

    contact = Contact(email="a@b.com", campaign_id=c.id)
    db.add(contact)
    db.commit()

    gen = GeneratedEmail(contact_id=contact.id, subject="S", body="B", status="Sent")
    db.add(gen)
    db.commit()

    log = EmailLog(contact_id=contact.id, status="Sent", message="OK")
    db.add(log)
    db.commit()

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_campaigns"] == 1
    assert data["emails_sent"] == 1
    assert data["failed"] == 0
    assert data["success_rate"] == 100.0
    assert len(data["recent_campaigns"]) == 1
    assert data["recent_campaigns"][0]["name"] == "Campaign 1"
    assert len(data["recent_logs"]) == 1


def test_dashboard_stats_success_rate(client, db):
    c = Campaign(name="Test")
    db.add(c)
    db.commit()

    c1 = Contact(email="a@b.com", campaign_id=c.id)
    c2 = Contact(email="b@b.com", campaign_id=c.id)
    db.add_all([c1, c2])
    db.commit()

    db.add_all([
        GeneratedEmail(contact_id=c1.id, subject="S1", body="B1", status="Sent"),
        GeneratedEmail(contact_id=c2.id, subject="S2", body="B2", status="Failed"),
    ])
    db.commit()

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["emails_sent"] == 1
    assert data["failed"] == 1
    assert data["success_rate"] == 50.0
