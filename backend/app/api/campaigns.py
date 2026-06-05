from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Campaign, Contact, EmailLog, GeneratedEmail
from app.schemas import CampaignCreate, CampaignResponse, CampaignStatsResponse
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

@router.get("/{campaign_id}/logs")
def get_campaign_logs(campaign_id: int, db: Session = Depends(get_db)):
    logs = db.query(EmailLog).join(Contact).filter(Contact.campaign_id == campaign_id).order_by(EmailLog.timestamp.desc()).limit(100).all()
    return logs
