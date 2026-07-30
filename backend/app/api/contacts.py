from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Campaign, Contact, GeneratedEmail, EmailLog
from app.schemas import (
    ContactResponse,
    ContactWithEmailResponse,
    ContactScoreUpdate,
    GeneratedEmailResponse,
    GeneratedEmailUpdate,
    ManualContactCreate,
)
from app.services.ai_generator import generate_personalized_email
from app.services.scoring import apply_auto_score

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("/manual", response_model=ContactResponse)
def add_manual_contact(payload: ManualContactCreate, db: Session = Depends(get_db)):
    """Add an individual contact to a campaign without file upload."""
    campaign = db.query(Campaign).filter(Campaign.id == payload.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    contact = Contact(
        campaign_id=payload.campaign_id,
        email=payload.email,
        name=payload.name,
        company=payload.company,
        role=payload.role,
        website=payload.website,
        industry=payload.industry,
        city=payload.city,
        country=payload.country,
        linkedin=payload.linkedin,
        notes=payload.notes,
        status="Valid",
    )
    apply_auto_score(contact)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.put("/{contact_id}/score", response_model=ContactResponse)
def update_contact_score(contact_id: int, payload: ContactScoreUpdate, db: Session = Depends(get_db)):
    """Manually update a contact's score."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact.score = payload.score
    db.commit()
    db.refresh(contact)
    return contact

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
            data.variant_label = c.generated_email.variant_label
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

@router.put("/emails/{email_id}", response_model=GeneratedEmailResponse)
def edit_email(email_id: int, payload: GeneratedEmailUpdate, db: Session = Depends(get_db)):
    """Manual edit of a generated email (PRD §18). Resets status to Pending for re-approval."""
    email = db.query(GeneratedEmail).filter(GeneratedEmail.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    email.subject = payload.subject
    email.body = payload.body
    email.status = "Pending"
    db.commit()
    db.refresh(email)
    return email

@router.post("/{contact_id}/regenerate", response_model=GeneratedEmailResponse)
def regenerate_email(contact_id: int, db: Session = Depends(get_db)):
    """Re-run AI generation for a single contact (PRD §18)."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    campaign = db.query(Campaign).filter(Campaign.id == contact.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    contact_data = {
        "name": contact.name,
        "company": contact.company,
        "role": contact.role,
        "industry": contact.industry,
        "city": contact.city,
        "country": contact.country,
        "website": contact.website,
        "notes": contact.notes,
    }

    try:
        result = generate_personalized_email(
            contact_data=contact_data,
            prompt_template=campaign.prompt_template or "",
            tone=campaign.tone,
            length=campaign.length,
            temperature=campaign.temperature,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Generation failed: {e}")

    email = contact.generated_email
    if email:
        email.subject = result["subject"]
        email.body = result["body"]
        email.status = "Pending"
    else:
        email = GeneratedEmail(
            contact_id=contact.id,
            subject=result["subject"],
            body=result["body"],
            status="Pending",
        )
        db.add(email)

    db.add(EmailLog(contact_id=contact.id, status="Generated", message="Regenerated via AI"))
    db.commit()
    db.refresh(email)
    return email
    
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
