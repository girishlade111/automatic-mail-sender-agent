from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import Campaign, Contact, GeneratedEmail, EmailLog, GmailAccount
from app.services.ai_generator import generate_personalized_email
from app.services.email_sender import send_email
from app.services.retry import with_retries
from app.services.webhooks import fire_webhooks
from app.services.rate_limit import sent_count_since
from app.security import decrypt_password
from app.config import settings
from datetime import datetime, timedelta, timezone
import json
import random
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

        # Parse A/B variants if configured
        ab_variants = None
        if campaign.ab_variants:
            try:
                ab_variants = json.loads(campaign.ab_variants)
            except (json.JSONDecodeError, TypeError):
                ab_variants = None
        
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

            # Determine which prompt template to use (A/B variant or default)
            variant_label = None
            prompt_template = campaign.prompt_template or ""
            if ab_variants and len(ab_variants) > 0:
                chosen_variant = random.choice(ab_variants)
                variant_label = chosen_variant.get("label", "")
                prompt_template = chosen_variant.get("prompt_template", prompt_template)
            
            try:
                # Use default arguments to capture loop variables by value,
                # avoiding the closure-over-mutable-variable bug.
                result = with_retries(
                    lambda cd=contact_data, pt=prompt_template, t=campaign.tone, l=campaign.length, temp=campaign.temperature: generate_personalized_email(
                        contact_data=cd,
                        prompt_template=pt,
                        tone=t,
                        length=l,
                        temperature=temp,
                    ),
                    attempts=settings.AI_RETRY_ATTEMPTS,
                )
                
                gen_email = GeneratedEmail(
                    contact_id=contact.id,
                    subject=result["subject"],
                    body=result["body"],
                    status="Pending",
                    variant_label=variant_label,
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
                fire_webhooks(campaign.status.lower(), campaign_id, campaign.name)
                break

            # Rate limiting (PRD §22): pause automatically if hourly/daily caps are hit.
            now = datetime.now(timezone.utc)
            sent_last_hour = sent_count_since(db, now - timedelta(hours=1))
            sent_last_day = sent_count_since(db, now - timedelta(days=1))
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
                fire_webhooks("paused", campaign_id, campaign.name)
                break

            # Find next Approved email
            email_to_send = db.query(GeneratedEmail).join(Contact).filter(
                Contact.campaign_id == campaign_id,
                GeneratedEmail.status == "Approved"
            ).first()

            if not email_to_send:
                campaign.status = "Completed"
                db.commit()
                fire_webhooks("completed", campaign_id, campaign.name)
                break

            contact = email_to_send.contact
            log_queued = EmailLog(contact_id=contact.id, status="Sending", message="Starting SMTP transmission")
            db.add(log_queued)
            db.commit()

            try:
                with_retries(
                    lambda to=contact.email, subj=email_to_send.subject, bd=email_to_send.body, se=gmail_acc.email, ap=app_password: send_email(
                        to_email=to,
                        subject=subj,
                        body=bd,
                        sender_email=se,
                        app_password=ap,
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


@celery_app.task
def check_scheduled_campaigns():
    """Periodic task that picks up scheduled campaigns whose scheduled_at has arrived.

    This task should be triggered by Celery Beat (e.g., every 60 seconds). It finds
    campaigns with status 'Scheduled' whose scheduled_at datetime is in the past,
    and transitions them to 'Sending' if a Gmail account is available.
    """
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due_campaigns = (
            db.query(Campaign)
            .filter(Campaign.status == "Scheduled", Campaign.scheduled_at <= now)
            .all()
        )
        for campaign in due_campaigns:
            # Find the first available Gmail account to use for sending
            gmail_acc = db.query(GmailAccount).first()
            if not gmail_acc:
                # Cannot send without a Gmail account; leave scheduled
                continue

            # Verify at least one approved email exists
            approved_count = (
                db.query(GeneratedEmail)
                .join(Contact)
                .filter(Contact.campaign_id == campaign.id, GeneratedEmail.status == "Approved")
                .count()
            )
            if approved_count == 0:
                # Nothing to send yet; leave scheduled
                continue

            campaign.status = "Sending"
            db.commit()
            send_campaign_emails_task.delay(campaign.id, gmail_acc.id)
    finally:
        db.close()
