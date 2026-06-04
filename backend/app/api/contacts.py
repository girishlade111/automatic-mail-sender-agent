from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Contact, GeneratedEmail
from app.schemas import ContactResponse, GeneratedEmailResponse

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.get("/{campaign_id}", response_model=List[ContactResponse])
def get_campaign_contacts(campaign_id: int, db: Session = Depends(get_db)):
    return db.query(Contact).filter(Contact.campaign_id == campaign_id).all()

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
