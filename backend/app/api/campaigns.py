from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import io
import csv
from app.database import get_db
from app.models import Campaign, Contact, EmailLog, GeneratedEmail
from app.schemas import CampaignCreate, CampaignResponse, CampaignStatsResponse, CampaignUpdate
from app.services.file_processor import process_file
from app.tasks import generate_campaign_emails_task, send_campaign_emails_task

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB (PRD §7)

@router.get("/", response_model=List[CampaignResponse])
def get_campaigns(db: Session = Depends(get_db)):
    return db.query(Campaign).order_by(Campaign.created_at.desc()).all()

@router.post("/", response_model=CampaignResponse)
def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    db_campaign = Campaign(**campaign.model_dump())
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(campaign_id: int, payload: CampaignUpdate, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(campaign, field, value)
    db.commit()
    db.refresh(campaign)
    return campaign

@router.post("/{campaign_id}/upload")
async def upload_contacts(campaign_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds the 25 MB limit")

    try:
        valid_contacts, invalid_contacts = process_file(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    for contact_data in valid_contacts:
        db_contact = Contact(**contact_data, campaign_id=campaign_id, status="Valid")
        db.add(db_contact)
        
    for invalid in invalid_contacts:
        email = invalid["data"].get("email", "")
        db_contact = Contact(
            email=str(email) if email else "invalid@missing",
            campaign_id=campaign_id,
            status="Invalid",
            validation_error=invalid["error"],
            notes=str(invalid["data"])
        )
        db.add(db_contact)
        
    db.commit()
    return {"message": "File processed", "valid": len(valid_contacts), "invalid": len(invalid_contacts)}

@router.post("/{campaign_id}/generate")
def generate_emails(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign.status = "Generating"
    db.commit()
    generate_campaign_emails_task.delay(campaign_id)
    return {"message": "Generation task started"}

@router.post("/{campaign_id}/send")
def start_sending(campaign_id: int, gmail_account_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Validate that at least one approved email exists
    approved_count = (
        db.query(GeneratedEmail)
        .join(Contact)
        .filter(Contact.campaign_id == campaign_id, GeneratedEmail.status == "Approved")
        .count()
    )
    if approved_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot send: no approved emails in this campaign. Approve at least one email before sending.",
        )

    campaign.status = "Sending"
    db.commit()
    send_campaign_emails_task.delay(campaign_id, gmail_account_id)
    return {"message": "Sending task started"}

@router.post("/{campaign_id}/pause")
def pause_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign.status = "Paused"
    db.commit()
    return {"message": "Campaign paused"}

@router.post("/{campaign_id}/resume")
def resume_campaign(campaign_id: int, gmail_account_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign.status = "Sending"
    db.commit()
    send_campaign_emails_task.delay(campaign_id, gmail_account_id)
    return {"message": "Campaign resumed"}

@router.post("/{campaign_id}/stop")
def stop_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign.status = "Stopped"
    db.commit()
    return {"message": "Campaign stopped"}

@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    db.delete(campaign)  # cascades to contacts -> generated_emails / logs
    db.commit()
    return {"message": "Campaign deleted"}

@router.get("/{campaign_id}/stats", response_model=CampaignStatsResponse)
def get_campaign_stats(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    contacts = db.query(Contact).filter(Contact.campaign_id == campaign_id)
    total = contacts.count()
    valid = contacts.filter(Contact.status == "Valid").count()
    invalid = contacts.filter(Contact.status == "Invalid").count()

    emails = db.query(GeneratedEmail).join(Contact).filter(Contact.campaign_id == campaign_id)
    generated = emails.count()
    approved = emails.filter(GeneratedEmail.status == "Approved").count()
    sent = emails.filter(GeneratedEmail.status == "Sent").count()
    failed = emails.filter(GeneratedEmail.status == "Failed").count()
    pending = emails.filter(GeneratedEmail.status == "Pending").count()

    return CampaignStatsResponse(
        total=total, valid=valid, invalid=invalid, generated=generated,
        approved=approved, sent=sent, failed=failed, pending=pending,
    )

@router.get("/{campaign_id}/logs")
def get_campaign_logs(campaign_id: int, db: Session = Depends(get_db)):
    logs = db.query(EmailLog).join(Contact).filter(Contact.campaign_id == campaign_id).order_by(EmailLog.timestamp.desc()).limit(100).all()
    return logs


@router.post("/{campaign_id}/duplicate", response_model=CampaignResponse)
def duplicate_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Clone a campaign configuration without contacts or emails."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    new_campaign = Campaign(
        name=f"{campaign.name} (Copy)",
        description=campaign.description,
        type=campaign.type,
        status="Draft",
        prompt_template=campaign.prompt_template,
        tone=campaign.tone,
        length=campaign.length,
        temperature=campaign.temperature,
        delay_seconds=campaign.delay_seconds,
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign


@router.get("/{campaign_id}/contacts/export")
def export_contacts_csv(campaign_id: int, db: Session = Depends(get_db)):
    """Export campaign contacts with their email generation/send status as CSV."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    contacts = db.query(Contact).filter(Contact.campaign_id == campaign_id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "email", "name", "company", "role", "industry", "city", "country",
        "status", "email_subject", "email_status",
    ])
    for c in contacts:
        email_subject = ""
        email_status = ""
        if c.generated_email:
            email_subject = c.generated_email.subject or ""
            email_status = c.generated_email.status or ""
        writer.writerow([
            c.email, c.name or "", c.company or "", c.role or "",
            c.industry or "", c.city or "", c.country or "",
            c.status, email_subject, email_status,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=campaign_{campaign_id}_contacts.csv"},
    )
