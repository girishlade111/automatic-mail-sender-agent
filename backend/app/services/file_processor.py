import csv
import io
import pandas as pd
import pdfplumber
from typing import List, Dict, Any, Tuple
from pydantic import ValidationError
from app.schemas import ContactCreate

def validate_contact(data: dict) -> Tuple[bool, str, dict]:
    """Validates contact dictionary. Returns (is_valid, error_message, cleaned_data)."""
    try:
        # Check if email is present
        if 'email' not in data or not data['email']:
            return False, "Missing email field", data
            
        # Clean data: trim whitespace, convert pandas NaN to None
        clean_data = {}
        for k, v in data.items():
            if pd.isna(v) or v == '':
                clean_data[k] = None
            else:
                clean_data[k] = str(v).strip()
        
        # Pydantic validation
        contact = ContactCreate(**clean_data)
        return True, "", contact.model_dump(exclude_none=True)
    except ValidationError as e:
        # Extract first error message
        err_msg = str(e.errors()[0]['msg'])
        return False, err_msg, data
    except Exception as e:
        return False, str(e), data

def parse_csv(content: bytes) -> List[Dict[str, Any]]:
    text = content.decode('utf-8', errors='ignore')
    reader = csv.DictReader(io.StringIO(text))
    return [row for row in reader]

def parse_excel(content: bytes) -> List[Dict[str, Any]]:
    excel_file = pd.ExcelFile(io.BytesIO(content))
    all_data = []
    for sheet_name in excel_file.sheet_names:
        df = pd.read_excel(excel_file, sheet_name=sheet_name)
        df = df.where(pd.notna(df), None)
        all_data.extend(df.to_dict('records'))
    return all_data

def parse_pdf(content: bytes) -> List[Dict[str, Any]]:
    contacts = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if len(table) > 1:
                    headers = [str(h).lower().strip() if h else "" for h in table[0]]
                    for row in table[1:]:
                        if len(row) == len(headers):
                            contacts.append(dict(zip(headers, row)))
    return contacts

def parse_txt(content: bytes) -> List[Dict[str, Any]]:
    text = content.decode('utf-8', errors='ignore')
    contacts = []
    current_contact = {}
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            if current_contact:
                contacts.append(current_contact)
                current_contact = {}
            continue
            
        if ':' in line:
            key, val = line.split(':', 1)
            current_contact[key.strip().lower()] = val.strip()
            
    if current_contact:
        contacts.append(current_contact)
    return contacts

def process_file(content: bytes, filename: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Returns valid_contacts and invalid_contacts."""
    raw_contacts = []
    
    if filename.endswith('.csv'):
        raw_contacts = parse_csv(content)
    elif filename.endswith('.xlsx') or filename.endswith('.xls'):
        raw_contacts = parse_excel(content)
    elif filename.endswith('.pdf'):
        raw_contacts = parse_pdf(content)
    elif filename.endswith('.txt'):
        raw_contacts = parse_txt(content)
    else:
        raise ValueError("Unsupported file format")

    valid_contacts = []
    invalid_contacts = []
    seen_emails = set()
    
    for row in raw_contacts:
        # Ensure all keys are lower case
        row_normalized = {str(k).lower().strip(): v for k, v in row.items() if k}
        
        is_valid, err_msg, cleaned_data = validate_contact(row_normalized)
        
        email = cleaned_data.get('email', '') if is_valid else row_normalized.get('email', '')
        if email:
            email = str(email).lower().strip()
            if email in seen_emails:
                is_valid = False
                err_msg = "Duplicate email"
            else:
                seen_emails.add(email)
                
        if is_valid:
            valid_contacts.append(cleaned_data)
        else:
            invalid_contacts.append({
                "data": row_normalized,
                "error": err_msg
            })
            
    return valid_contacts, invalid_contacts
