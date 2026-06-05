from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import Campaign, Contact, GeneratedEmail, EmailLog, GmailAccount
from app.services.ai_generator import generate_personalized_email
from app.services.email_sender import send_email
from app.services.retry import with_retries
from app.security import decrypt_password
from app.config import settings
from datetime import datetime, timedelta, timezone
import time


def _sent_count_since(db, campaign_id: int, since) -> int:
    """Count successful sends across ALL campaigns since ``since`` (Gmail limits are per account)."""
    return (
        db.query(EmailLog)
        .filter(EmailLog.status == "Sent", EmailLog.timestamp >= since)
        .count()
    )

@celery_app.task(bind=True, max_retries=3)
def generate_campaign_emails_task(self, campaign_id: int):
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return
            
        campaign.status = "Generating"
        db.commit()
        
        contacts = db.query(Contact).filter(
            Contact.campaign_id == campaign_id,
            Contact.status == "Valid"
        ).all()
        
        for contact in contacts:
            if contact.generated_email:
                continue
                
            contact_data = {
                "name": contact.name,
                "company": contact.company,
                "role": contact.role,
                "industry": contact.industry,
                "city": contact.city,
                "country": contact.country,
                "website": contact.website,
                "notes": contact.notes
            }
            
            try:
                result = with_retries(
                    lambda: generate_personalized_email(
                        contact_data=contact_data,
                        prompt_template=campaign.prompt_template or "",
                        tone=campaign.tone,
                        length=campaign.length,
                        temperature=campaign.temperature
                    ),
                    attempts=settings.AI_RETRY_ATTEMPTS,
                )
                
                gen_email = GeneratedEmail(
                    contact_id=contact.id,
                    subject=result["subject"],
                    body=result["body"],
                    status="Pending"
                )
                db.add(gen_email)
                
                log = EmailLog(contact_id=contact.id, status="Generated", message="AI generation successful")
                db.add(log)
                db.commit()
                
            except Exception as e:
                log = EmailLog(contact_id=contact.id, status="Failed", message=f"Generation failed: {str(e)}")
                db.add(log)
                db.commit()
                
        campaign.status = "Generated"
        db.commit()
        
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3)
def send_campaign_emails_task(self, campaign_id: int, gmail_account_id: int):
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        gmail_acc = db.query(GmailAccount).filter(GmailAccount.id == gmail_account_id).first()
        
        if not campaign or not gmail_acc:
            return
            
        app_password = decrypt_password(gmail_acc.encrypted_password)
        
        while True:
            db.refresh(campaign)
            if campaign.status in ["Paused", "Stopped"]:
                break

            # Rate limiting (PRD §22): pause automatically if hourly/daily caps are hit.
            now = datetime.now(timezone.utc)
            sent_last_hour = _sent_count_since(db, campaign_id, now - timedelta(hours=1))
            sent_last_day = _sent_count_since(db, campaign_id, now - timedelta(days=1))
            if sent_last_hour >= settings.MAX_EMAILS_PER_HOUR or sent_last_day >= settings.MAX_EMAILS_PER_DAY:
                campaign.status = "Paused"
                limit = "hourly" if sent_last_hour >= settings.MAX_EMAILS_PER_HOUR else "daily"
                # Attach the notice to the next pending contact for log visibility.
                next_contact = db.query(Contact).filter(Contact.campaign_id == campaign_id).first()
                if next_contact:
                    db.add(EmailLog(
                        contact_id=next_contact.id,
                        status="RateLimited",
                        message=f"Paused: {limit} sending limit reached",
                    ))
                db.commit()
                break

            # Find next Approved email
            email_to_send = db.query(GeneratedEmail).join(Contact).filter(
                Contact.campaign_id == campaign_id,
                GeneratedEmail.status == "Approved"
            ).first()

            if not email_to_send:
                campaign.status = "Completed"
                db.commit()
                break

            contact = email_to_send.contact
            log_queued = EmailLog(contact_id=contact.id, status="Sending", message="Starting SMTP transmission")
            db.add(log_queued)
            db.commit()

            try:
                with_retries(
                    lambda: send_email(
                        to_email=contact.email,
                        subject=email_to_send.subject,
                        body=email_to_send.body,
                        sender_email=gmail_acc.email,
                        app_password=app_password
                    ),
                    attempts=settings.SMTP_RETRY_ATTEMPTS,
                )

                email_to_send.status = "Sent"
                log_success = EmailLog(contact_id=contact.id, status="Sent", message="Email delivered successfully")
                db.add(log_success)
                db.commit()

            except Exception as e:
                email_to_send.status = "Failed"
                log_fail = EmailLog(contact_id=contact.id, status="Failed", message=str(e))
                db.add(log_fail)
                db.commit()

            # Delay sequentially to prevent spam detection
            delay = campaign.delay_seconds or 20
            time.sleep(delay)
            
    finally:
        db.close()
