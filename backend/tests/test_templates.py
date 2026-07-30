"""Tests for the templates API endpoints."""
import pytest
from tests.conftest import client


class TestTemplateCRUD:
    def test_create_template(self, client):
        response = client.post("/api/templates/", json={
            "name": "Cold Email v1",
            "description": "First version of cold email template",
            "prompt_template": "Write a cold email to {{name}} at {{company}}",
            "tone": "professional",
            "length": "short",
            "temperature": 0.8,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Cold Email v1"
        assert data["tone"] == "professional"
        assert data["id"] is not None

    def test_list_templates(self, client):
        client.post("/api/templates/", json={"name": "Template A"})
        client.post("/api/templates/", json={"name": "Template B"})
        response = client.get("/api/templates/")
        assert response.status_code == 200
        templates = response.json()
        assert len(templates) == 2

    def test_get_template(self, client):
        create_resp = client.post("/api/templates/", json={"name": "Get Me"})
        template_id = create_resp.json()["id"]
        response = client.get(f"/api/templates/{template_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Get Me"

    def test_get_template_not_found(self, client):
        response = client.get("/api/templates/9999")
        assert response.status_code == 404

    def test_update_template(self, client):
        create_resp = client.post("/api/templates/", json={
            "name": "Original",
            "tone": "formal",
        })
        template_id = create_resp.json()["id"]
        response = client.put(f"/api/templates/{template_id}", json={
            "name": "Updated Template",
            "tone": "casual",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Template"
        assert data["tone"] == "casual"

    def test_update_template_not_found(self, client):
        response = client.put("/api/templates/9999", json={"name": "X"})
        assert response.status_code == 404

    def test_delete_template(self, client):
        create_resp = client.post("/api/templates/", json={"name": "To Delete"})
        template_id = create_resp.json()["id"]
        del_resp = client.delete(f"/api/templates/{template_id}")
        assert del_resp.status_code == 200
        assert del_resp.json()["message"] == "Template deleted"
        # Verify it's gone
        get_resp = client.get(f"/api/templates/{template_id}")
        assert get_resp.status_code == 404

    def test_delete_template_not_found(self, client):
        response = client.delete("/api/templates/9999")
        assert response.status_code == 404
