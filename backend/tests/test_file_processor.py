"""Tests for the file processor service (CSV parsing and validation)."""
import pytest
from app.services.file_processor import process_file, validate_contact, parse_csv, parse_txt


class TestValidateContact:
    def test_valid_contact(self):
        data = {"email": "test@example.com", "name": "Test User", "company": "Corp"}
        is_valid, error, cleaned = validate_contact(data)
        assert is_valid is True
        assert error == ""
        assert cleaned["email"] == "test@example.com"

    def test_missing_email(self):
        data = {"name": "No Email"}
        is_valid, error, cleaned = validate_contact(data)
        assert is_valid is False
        assert "email" in error.lower() or "Missing" in error

    def test_invalid_email_format(self):
        data = {"email": "not-an-email"}
        is_valid, error, cleaned = validate_contact(data)
        assert is_valid is False

    def test_empty_email_string(self):
        data = {"email": ""}
        is_valid, error, cleaned = validate_contact(data)
        assert is_valid is False


class TestParseCSV:
    def test_parse_simple_csv(self):
        content = b"email,name,company\njohn@example.com,John,Acme\njane@example.com,Jane,Corp\n"
        rows = parse_csv(content)
        assert len(rows) == 2
        assert rows[0]["email"] == "john@example.com"
        assert rows[1]["name"] == "Jane"


class TestParseTxt:
    def test_parse_txt_format(self):
        content = b"email: alice@test.com\nname: Alice\ncompany: TestCo\n\nemail: bob@test.com\nname: Bob\n"
        rows = parse_txt(content)
        assert len(rows) == 2
        assert rows[0]["email"] == "alice@test.com"
        assert rows[1]["name"] == "Bob"


class TestProcessFile:
    def test_process_csv_file(self):
        content = b"email,name,company\nvalid@example.com,Valid,Corp\n"
        valid, invalid = process_file(content, "contacts.csv")
        assert len(valid) == 1
        assert len(invalid) == 0
        assert valid[0]["email"] == "valid@example.com"

    def test_process_csv_with_invalid(self):
        content = b"email,name\nvalid@example.com,Valid\nnot-email,Bad\n"
        valid, invalid = process_file(content, "data.csv")
        assert len(valid) == 1
        assert len(invalid) == 1

    def test_duplicate_emails(self):
        content = b"email,name\na@b.com,First\na@b.com,Duplicate\n"
        valid, invalid = process_file(content, "dupes.csv")
        assert len(valid) == 1
        assert len(invalid) == 1
        assert invalid[0]["error"] == "Duplicate email"

    def test_unsupported_format(self):
        with pytest.raises(ValueError, match="Unsupported"):
            process_file(b"data", "file.json")

    def test_process_txt_file(self):
        content = b"email: user@company.com\nname: User\n"
        valid, invalid = process_file(content, "contacts.txt")
        assert len(valid) == 1
        assert valid[0]["email"] == "user@company.com"
