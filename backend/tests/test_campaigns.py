"""Tests for the campaigns API endpoints."""

import io


def test_create_campaign(client):
    """POST /api/campaigns/ creates a campaign with Draft status."""
    response = client.post("/api/campaigns/", json={
        "name": "Test Campaign",
        "description": "A test campaign",
        "type": "Cold Outreach",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["id"] is not None
    assert data["status"] == "Draft"
    assert data["name"] == "Test Campaign"


def test_get_campaigns_list(client):
    """GET /api/campaigns/ returns a list of campaigns."""
    # Create two campaigns
    client.post("/api/campaigns/", json={"name": "Campaign 1"})
    client.post("/api/campaigns/", json={"name": "Campaign 2"})

    response = client.get("/api/campaigns/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_get_single_campaign(client):
    """GET /api/campaigns/{id} returns a single campaign."""
    create_resp = client.post("/api/campaigns/", json={"name": "My Campaign"})
    campaign_id = create_resp.json()["id"]

    response = client.get(f"/api/campaigns/{campaign_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == campaign_id
    assert data["name"] == "My Campaign"


def test_get_nonexistent_campaign(client):
    """GET /api/campaigns/9999 returns 404."""
    response = client.get("/api/campaigns/9999")
    assert response.status_code == 404


def test_delete_campaign(client):
    """DELETE /api/campaigns/{id} deletes the campaign."""
    create_resp = client.post("/api/campaigns/", json={"name": "To Delete"})
    campaign_id = create_resp.json()["id"]

    response = client.delete(f"/api/campaigns/{campaign_id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Campaign deleted"

    # Confirm deletion
    get_resp = client.get(f"/api/campaigns/{campaign_id}")
    assert get_resp.status_code == 404


def test_upload_contacts_csv(client):
    """POST /api/campaigns/{id}/upload processes a CSV file with valid contacts."""
    create_resp = client.post("/api/campaigns/", json={"name": "Upload Test"})
    campaign_id = create_resp.json()["id"]

    csv_content = "email,name,company\nalice@example.com,Alice,Acme\nbob@example.com,Bob,Widgets"
    response = client.post(
        f"/api/campaigns/{campaign_id}/upload",
        files={"file": ("test.csv", csv_content, "text/csv")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] == 2
    assert data["invalid"] == 0


def test_get_campaign_stats(client):
    """GET /api/campaigns/{id}/stats returns correct counts."""
    create_resp = client.post("/api/campaigns/", json={"name": "Stats Test"})
    campaign_id = create_resp.json()["id"]

    # Upload contacts
    csv_content = "email,name,company\nalice@example.com,Alice,Acme\nbob@example.com,Bob,Widgets"
    client.post(
        f"/api/campaigns/{campaign_id}/upload",
        files={"file": ("test.csv", csv_content, "text/csv")},
    )

    response = client.get(f"/api/campaigns/{campaign_id}/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["valid"] == 2
    assert data["invalid"] == 0
    assert data["generated"] == 0


def test_duplicate_campaign(client):
    """POST /api/campaigns/{id}/duplicate creates a copy."""
    create_resp = client.post("/api/campaigns/", json={
        "name": "Original",
        "description": "Original desc",
    })
    campaign_id = create_resp.json()["id"]

    response = client.post(f"/api/campaigns/{campaign_id}/duplicate")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Copy of Original"
    assert data["status"] == "Draft"
    assert data["id"] != campaign_id


def test_update_campaign(client):
    """PUT /api/campaigns/{id} updates campaign name."""
    create_resp = client.post("/api/campaigns/", json={"name": "Old Name"})
    campaign_id = create_resp.json()["id"]

    response = client.put(f"/api/campaigns/{campaign_id}", json={"name": "New Name"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"


def test_get_campaign_analytics(client):
    """GET /api/campaigns/{id}/analytics returns analytics shape."""
    create_resp = client.post("/api/campaigns/", json={"name": "Analytics Test"})
    campaign_id = create_resp.json()["id"]

    response = client.get(f"/api/campaigns/{campaign_id}/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "total_contacts" in data
    assert "valid_contacts" in data
    assert "emails_generated" in data
    assert "emails_approved" in data
    assert "emails_sent" in data
    assert "emails_failed" in data
    assert "delivery_rate" in data
    assert "open_rate" in data
    assert "avg_generation_time" in data
