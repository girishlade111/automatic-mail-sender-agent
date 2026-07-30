"""Tests for the templates API endpoints."""


class TestTemplateCRUD:
    def test_create_template(self, client):
        response = client.post("/api/templates/", json={
            "name": "Welcome Template",
            "description": "For new contacts",
            "subject_template": "Hello {{name}}",
            "body_template": "Welcome to {{company}}!",
            "category": "Onboarding",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["id"] is not None
        assert data["name"] == "Welcome Template"
        assert data["category"] == "Onboarding"

    def test_list_templates(self, client):
        client.post("/api/templates/", json={
            "name": "Template 1",
            "subject_template": "Subject 1",
            "body_template": "Body 1",
        })
        client.post("/api/templates/", json={
            "name": "Template 2",
            "subject_template": "Subject 2",
            "body_template": "Body 2",
        })

        response = client.get("/api/templates/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2

    def test_get_single_template(self, client):
        create_resp = client.post("/api/templates/", json={
            "name": "Get Me",
            "subject_template": "Sub",
            "body_template": "Bod",
        })
        template_id = create_resp.json()["id"]

        response = client.get(f"/api/templates/{template_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Get Me"

    def test_get_template_not_found(self, client):
        response = client.get("/api/templates/9999")
        assert response.status_code == 404

    def test_update_template(self, client):
        create_resp = client.post("/api/templates/", json={
            "name": "Original",
            "subject_template": "Sub",
            "body_template": "Bod",
        })
        template_id = create_resp.json()["id"]

        response = client.put(f"/api/templates/{template_id}", json={
            "name": "Updated Name",
            "subject_template": "New Subject",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["subject_template"] == "New Subject"
        # body_template should remain unchanged
        assert data["body_template"] == "Bod"

    def test_update_template_not_found(self, client):
        response = client.put("/api/templates/9999", json={"name": "X"})
        assert response.status_code == 404

    def test_delete_template(self, client):
        create_resp = client.post("/api/templates/", json={
            "name": "To Delete",
            "subject_template": "Sub",
            "body_template": "Bod",
        })
        template_id = create_resp.json()["id"]

        response = client.delete(f"/api/templates/{template_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Template deleted"

        # Confirm deletion
        get_resp = client.get(f"/api/templates/{template_id}")
        assert get_resp.status_code == 404

    def test_delete_template_not_found(self, client):
        response = client.delete("/api/templates/9999")
        assert response.status_code == 404
