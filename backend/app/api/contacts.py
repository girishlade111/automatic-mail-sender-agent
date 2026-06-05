from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Campaign, Contact, GeneratedEmail, EmailLog
from app.schemas import (
    ContactResponse,
    ContactWithEmailResponse,
    GeneratedEmailResponse,
    GeneratedEmailUpdate,
)
from app.services.ai_generator import generate_personalized_email

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.get("/{campaign_id}", response_model=List[ContactWithEmailResponse])
def get_campaign_contacts(campaign_id: int, db: Session = Depends(get_db)):
    """Contacts joined with their generated email so the preview table needs one call."""
    contacts = db.query(Contact).filter(Contact.campaign_id == campaign_id).all()
    result = []
    for c in contacts:
        data = ContactWithEmailResponse.model_validate(c)
        if c.generated_email:
            data.email_id = c.generated_email.id
            data.subject = c.generated_email.subject
            data.body = c.generated_email.body
            data.email_status = c.generated_email.status
        result.append(data)
    return result

@router.get("/{contact_id}/email", response_model=GeneratedEmailResponse)
def get_generated_email(contact_id: int, db: Session = Depends(get_db)):
    email = db.query(GeneratedEmail).filter(GeneratedEmail.contact_id == contact_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email

@router.put("/emails/{email_id}/approve")
def approve_email(email_id: int, db: Session = Depends(get_db)):
    email = db.query(GeneratedEmail).filter(GeneratedEmail.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    email.status = "Approved"
    db.commit()
    return {"message": "Approved"}
    
@router.put("/campaigns/{campaign_id}/approve-all")
def approve_all_emails(campaign_id: int, db: Session = Depends(get_db)):
    emails = db.query(GeneratedEmail).join(Contact).filter(
        Contact.campaign_id == campaign_id,
        GeneratedEmail.status == "Pending"
    ).all()
    
    for email in emails:
        email.status = "Approved"
    db.commit()
    return {"message": f"Approved {len(emails)} emails"}
