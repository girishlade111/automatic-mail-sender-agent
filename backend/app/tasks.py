import logging
import json
import random
import time
from functools import partial
from datetime import datetime, timedelta, timezone

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

logger = logging.getLogger(__name__)


def _generate_email_for_contact(contact_data: dict, campaign_prompt: str, tone: str, length: str, temperature: float) -> dict:
    """Helper to generate email for a specific contact, avoiding closure bugs in loops."""
    return generate_personalized_email(
        contact_data=contact_data,
        prompt_template=campaign_prompt,
        tone=tone,
        length=length,
        temperature=temperature,
    )


def _send_email_for_contact(to_email: str, subject: str, body: str, sender_email: str, app_password: str) -> None:
    """Helper to send email for a specific contact, avoiding closure bugs in loops."""
    send_email(
        to_email=to_email,
        subject=subject,
        body=body,
        sender_email=sender_email,
        app_password=app_password,
    )


@celery_app.task(bind=True, max_retries=3)
def generate_campaign_emails_task(self, campaign_id: int):
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            logger.warning("Campaign %d not found, aborting generation task.", campaign_id)
            return

        campaign.status = "Generating"
        db.commit()
        logger.info("Starting email generation for campaign %d", campaign_id)

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
                "notes": contact.notes,
            }

            # Determine which prompt template to use (A/B variant or default)
            variant_label = None
            prompt_template = campaign.prompt_template or ""
            if ab_variants and len(ab_variants) > 0:
                chosen_variant = random.choice(ab_variants)
                variant_label = chosen_variant.get("label", "")
                prompt_template = chosen_variant.get("prompt_template", prompt_template)

            # Use partial to bind current values and avoid closure-over-loop-variable bug
            gen_fn = partial(
                _generate_email_for_contact,
                contact_data=contact_data,
                campaign_prompt=prompt_template,
                tone=campaign.tone,
                length=campaign.length,
                temperature=campaign.temperature,
            )

            try:
                result = with_retries(gen_fn, attempts=settings.AI_RETRY_ATTEMPTS)

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
                logger.info("Generated email for contact %d", contact.id)

            except Exception as e:
                log = EmailLog(contact_id=contact.id, status="Failed", message=f"Generation failed: {str(e)}")
                db.add(log)
                db.commit()
                logger.error("Generation failed for contact %d: %s", contact.id, str(e))

        campaign.status = "Generated"
        db.commit()
        logger.info("Completed email generation for campaign %d", campaign_id)

    except Exception as e:
        logger.exception("Unexpected error in generate_campaign_emails_task for campaign %d", campaign_id)
        raise
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3)
def send_campaign_emails_task(self, campaign_id: int, gmail_account_id: int):
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        gmail_acc = db.query(GmailAccount).filter(GmailAccount.id == gmail_account_id).first()

        if not campaign or not gmail_acc:
            logger.warning("Campaign %d or Gmail account %d not found, aborting send task.", campaign_id, gmail_account_id)
            return

        app_password = decrypt_password(gmail_acc.encrypted_password)
        logger.info("Starting send task for campaign %d", campaign_id)

        while True:
            db.refresh(campaign)
            if campaign.status in ["Paused", "Stopped"]:
                logger.info("Campaign %d is %s, stopping send loop.", campaign_id, campaign.status)
                fire_webhooks(campaign.status.lower(), campaign_id, campaign.name)
                break

            # Rate limiting (PRD SS22): pause automatically if hourly/daily caps are hit.
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
                logger.warning("Campaign %d paused due to %s rate limit.", campaign_id, limit)
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
                logger.info("Campaign %d completed - no more approved emails.", campaign_id)
                fire_webhooks("completed", campaign_id, campaign.name)
                break

            contact = email_to_send.contact
            log_queued = EmailLog(contact_id=contact.id, status="Sending", message="Starting SMTP transmission")
            db.add(log_queued)
            db.commit()

            # Use partial to bind current values and avoid closure-over-loop-variable bug
            send_fn = partial(
                _send_email_for_contact,
                to_email=contact.email,
                subject=email_to_send.subject,
                body=email_to_send.body,
                sender_email=gmail_acc.email,
                app_password=app_password,
            )

            try:
                with_retries(send_fn, attempts=settings.SMTP_RETRY_ATTEMPTS)

                email_to_send.status = "Sent"
                log_success = EmailLog(contact_id=contact.id, status="Sent", message="Email delivered successfully")
                db.add(log_success)
                db.commit()
                logger.info("Sent email to %s for campaign %d", contact.email, campaign_id)

            except Exception as e:
                email_to_send.status = "Failed"
                log_fail = EmailLog(contact_id=contact.id, status="Failed", message=str(e))
                db.add(log_fail)
                db.commit()
                logger.error("Failed to send email to %s: %s", contact.email, str(e))

            # Delay sequentially to prevent spam detection
            delay = campaign.delay_seconds or 20
            time.sleep(delay)

    except Exception as e:
        logger.exception("Unexpected error in send_campaign_emails_task for campaign %d", campaign_id)
        raise
    finally:
        db.close()


@celery_app.task
def check_scheduled_campaigns_task():
    """Periodic task that checks for campaigns with status 'Scheduled' and scheduled_at <= now.

    When a due campaign is found, it picks the first available Gmail account and triggers
    the send_campaign_emails_task.
    """
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due_campaigns = (
            db.query(Campaign)
            .filter(
                Campaign.status == "Scheduled",
                Campaign.scheduled_at <= now,
            )
            .all()
        )

        if not due_campaigns:
            return

        for campaign in due_campaigns:
            # Use the campaign's stored gmail_account_id if set, fall back to first available
            if campaign.gmail_account_id:
                gmail_account = db.query(GmailAccount).filter(GmailAccount.id == campaign.gmail_account_id).first()
            else:
                gmail_account = None

            if not gmail_account:
                gmail_account = db.query(GmailAccount).first()

            if not gmail_account:
                logger.warning("No Gmail account configured; cannot trigger scheduled campaign %d.", campaign.id)
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
            logger.info(
                "Triggering scheduled campaign %d (scheduled_at=%s) with Gmail account %d",
                campaign.id,
                campaign.scheduled_at,
                gmail_account.id,
            )
            send_campaign_emails_task.delay(campaign.id, gmail_account.id)

    except Exception as e:
        logger.exception("Error in check_scheduled_campaigns_task: %s", str(e))
    finally:
        db.close()
