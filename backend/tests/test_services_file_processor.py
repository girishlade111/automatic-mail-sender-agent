import csv
import io
from app.services.file_processor import (
    process_file,
    parse_csv,
    parse_excel,
    parse_txt,
    parse_pdf,
    validate_contact,
)


class TestValidateContact:
    def test_valid_contact(self):
        is_valid, err, data = validate_contact({"email": "test@example.com", "name": "John"})
        assert is_valid is True
        assert err == ""
        assert data["email"] == "test@example.com"
        assert data["name"] == "John"

    def test_missing_email(self):
        is_valid, err, data = validate_contact({"name": "John"})
        assert is_valid is False
        assert "Missing email" in err

    def test_invalid_email(self):
        is_valid, err, data = validate_contact({"email": "not-an-email"})
        assert is_valid is False

    def test_nan_values(self):
        import pandas as pd
        is_valid, err, data = validate_contact({"email": "test@test.com", "name": pd.NA})
        assert is_valid is True
        assert data.get("name") is None


class TestParseCSV:
    def test_basic_csv(self):
        content = b"email,name\nx@y.com,Alice\nz@y.com,Bob"
        result = parse_csv(content)
        assert len(result) == 2
        assert result[0]["email"] == "x@y.com"
        assert result[1]["name"] == "Bob"

    def test_empty_csv(self):
        content = b"email,name\n"
        result = parse_csv(content)
        assert result == []


class TestParseTxt:
    def test_basic_txt(self):
        content = b"email: x@y.com\nname: Alice\n\nemail: z@y.com\nname: Bob\n"
        result = parse_txt(content)
        assert len(result) == 2
        assert result[0]["email"] == "x@y.com"
        assert result[1]["name"] == "Bob"

    def test_empty_txt(self):
        result = parse_txt(b"")
        assert result == []


class TestProcessFile:
    def test_csv_valid(self):
        content = b"email,name,company\ntest@example.com,John,Acme\n"
        valid, invalid = process_file(content, "contacts.csv")
        assert len(valid) == 1
        assert len(invalid) == 0
        assert valid[0]["email"] == "test@example.com"

    def test_csv_invalid_email(self):
        content = b"email,name\ninvalid,John\n"
        valid, invalid = process_file(content, "contacts.csv")
        assert len(valid) == 0
        assert len(invalid) == 1

    def test_duplicate_emails(self):
        content = b"email,name\ntest@test.com,Alice\ntest@test.com,Bob\n"
        valid, invalid = process_file(content, "contacts.csv")
        assert len(valid) == 1
        assert len(invalid) == 1
        assert invalid[0]["error"] == "Duplicate email"

    def test_unsupported_format(self):
        try:
            process_file(b"data", "file.xyz")
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Unsupported" in str(e)

    def test_txt_valid(self):
        content = b"email: test@example.com\nname: John\n"
        valid, invalid = process_file(content, "contacts.txt")
        assert len(valid) == 1
        assert valid[0]["email"] == "test@example.com"

    def test_empty_file_after_parsing(self):
        content = b"email,name\n"
        valid, invalid = process_file(content, "contacts.csv")
        assert len(valid) == 0
        assert len(invalid) == 0


class TestParsePdf:
    def test_no_tables(self):
        # Minimal PDF with no extractable tables
        pdf_bytes = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
        result = parse_pdf(pdf_bytes)
        assert result == []
