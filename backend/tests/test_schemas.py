import pytest
from pydantic import ValidationError
from app.schemas import (
    CampaignCreate,
    ContactCreate,
    GmailAccountCreate,
    GeneratedEmailUpdate,
)


class TestCampaignCreate:
    def test_minimal_valid(self):
        data = CampaignCreate(name="Test Campaign")
        assert data.name == "Test Campaign"
        assert data.type == "Cold Outreach"
        assert data.temperature == 0.7

    def test_all_fields(self):
        data = CampaignCreate(
            name="Test",
            description="Desc",
            type="Sales",
            prompt_template="Hello {{name}}",
            tone="Friendly",
            length="Short",
            temperature=0.5,
            delay_seconds=30,
        )
        assert data.description == "Desc"
        assert data.tone == "Friendly"

    def test_missing_name(self):
        with pytest.raises(ValidationError):
            CampaignCreate()


class TestContactCreate:
    def test_valid_email(self):
        data = ContactCreate(email="test@example.com")
        assert data.email == "test@example.com"

    def test_invalid_email(self):
        with pytest.raises(ValidationError):
            ContactCreate(email="not-an-email")

    def test_missing_email(self):
        with pytest.raises(ValidationError):
            ContactCreate()


class TestGmailAccountCreate:
    def test_valid(self):
        data = GmailAccountCreate(email="test@gmail.com", app_password="secret")
        assert data.email == "test@gmail.com"
        assert data.app_password == "secret"

    def test_invalid_email(self):
        with pytest.raises(ValidationError):
            GmailAccountCreate(email="bad", app_password="secret")


class TestGeneratedEmailUpdate:
    def test_valid(self):
        data = GeneratedEmailUpdate(subject="Hello", body="World")
        assert data.subject == "Hello"
        assert data.body == "World"
