from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import Campaign, Contact, GeneratedEmail, EmailLog, GmailAccount
from app.services.ai_generator import generate_personalized_email
from app.services.email_sender import send_email
from app.security import decrypt_password
import time

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
                result = generate_personalized_email(
                    contact_data=contact_data,
                    prompt_template=campaign.prompt_template or "",
                    tone=campaign.tone,
                    length=campaign.length,
                    temperature=campaign.temperature
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
                send_email(
                    to_email=contact.email,
                    subject=email_to_send.subject,
                    body=email_to_send.body,
                    sender_email=gmail_acc.email,
                    app_password=app_password
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
