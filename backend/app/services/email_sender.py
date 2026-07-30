"""Email sending service.

Supports both plain text and HTML emails via Gmail SMTP.
"""

import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def _is_html(content: str) -> bool:
    """Detect if content is HTML based on common HTML tags."""
    html_indicators = ["<html", "<body", "<div", "<p>", "<br", "<table", "<h1", "<h2", "<h3", "<span"]
    content_lower = content.lower().strip()
    return any(indicator in content_lower for indicator in html_indicators)


def send_email(
    to_email: str,
    subject: str,
    body: str,
    sender_email: str,
    app_password: str,
    sender_name: str = "",
) -> None:
    """Sends an email using Gmail SMTP and standard Python libraries.

    Supports both plain text and HTML content. HTML is auto-detected based
    on the presence of HTML tags in the body.

    Args:
        to_email: Recipient email address
        subject: Email subject line
        body: Email body (plain text or HTML)
        sender_email: Gmail address to send from
        app_password: Gmail app password
        sender_name: Optional display name for the From header
    """
    msg = EmailMessage()

    # Set content with appropriate type
    if _is_html(body):
        msg.set_content(body, subtype="html")
    else:
        msg.set_content(body)

    msg["Subject"] = subject
    if sender_name:
        msg["From"] = f"{sender_name} <{sender_email}>"
    else:
        msg["From"] = sender_email
    msg["To"] = to_email

    # Connect to Gmail SMTP server on port 587
    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30)
    try:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender_email, app_password)
        server.send_message(msg)
        logger.info("Email sent successfully to %s", to_email)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, str(e))
        raise
    finally:
        try:
            server.quit()
        except Exception:
            pass


def verify_smtp_login(sender_email: str, app_password: str) -> None:
    """Authenticates against Gmail SMTP without sending an email.

    Raises an smtplib exception on failure (e.g. bad credentials); returns None on success.
    Used by the "Test Connection" endpoint (PRD SS19).
    """
    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30)
    try:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender_email, app_password)
        logger.info("SMTP login verified for %s", sender_email)
    finally:
        try:
            server.quit()
        except Exception:
            pass
