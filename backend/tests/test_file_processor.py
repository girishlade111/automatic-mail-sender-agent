"""Tests for the file_processor service."""

from app.services.file_processor import (
    parse_csv,
    parse_txt,
    process_file,
    validate_contact,
)


def test_parse_csv_valid():
    """parse_csv extracts rows from valid CSV content."""
    content = b"email,name,company\nalice@example.com,Alice,Acme\nbob@example.com,Bob,Widgets"
    rows = parse_csv(content)
    assert len(rows) == 2
    assert rows[0]["email"] == "alice@example.com"
    assert rows[0]["name"] == "Alice"
    assert rows[1]["company"] == "Widgets"


def test_parse_txt_valid():
    """parse_txt extracts contacts from key:value format."""
    content = b"email: alice@example.com\nname: Alice\ncompany: Acme\n\nemail: bob@example.com\nname: Bob\n"
    contacts = parse_txt(content)
    assert len(contacts) == 2
    assert contacts[0]["email"] == "alice@example.com"
    assert contacts[0]["name"] == "Alice"
    assert contacts[1]["email"] == "bob@example.com"


def test_process_file_handles_duplicates():
    """process_file marks duplicate emails as invalid."""
    content = b"email,name\nalice@example.com,Alice\nalice@example.com,Alice Dup"
    valid, invalid = process_file(content, "test.csv")
    assert len(valid) == 1
    assert len(invalid) == 1
    assert invalid[0]["error"] == "Duplicate email"


def test_process_file_marks_missing_email():
    """process_file marks contacts without email as invalid."""
    content = b"email,name\n,NoEmail\nalice@example.com,Alice"
    valid, invalid = process_file(content, "test.csv")
    assert len(valid) == 1
    assert len(invalid) == 1
    assert "Missing email" in invalid[0]["error"] or "email" in invalid[0]["error"].lower()


def test_validate_contact_valid():
    """validate_contact returns (True, '', data) for a valid contact."""
    data = {"email": "test@example.com", "name": "Test User", "company": "TestCo"}
    is_valid, error, cleaned = validate_contact(data)
    assert is_valid is True
    assert error == ""
    assert cleaned["email"] == "test@example.com"


def test_validate_contact_missing_email():
    """validate_contact returns (False, error, data) for contact without email."""
    data = {"name": "No Email User", "company": "NoCo"}
    is_valid, error, cleaned = validate_contact(data)
    assert is_valid is False
    assert "email" in error.lower() or "Missing" in error


def test_validate_contact_invalid_email_format():
    """validate_contact returns (False, error, data) for invalid email format."""
    data = {"email": "not-an-email", "name": "Bad Email"}
    is_valid, error, cleaned = validate_contact(data)
    assert is_valid is False
    assert error != ""


def test_process_file_unsupported_format():
    """process_file raises ValueError for unsupported file format."""
    import pytest
    with pytest.raises(ValueError, match="Unsupported"):
        process_file(b"some content", "file.docx")
