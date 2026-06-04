import smtplib
from email.message import EmailMessage
from app.config import settings

def send_email(to_email: str, subject: str, body: str, sender_email: str, app_password: str):
    """Sends an email using Gmail SMTP and standard Python libraries."""
    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email
    
    # Connect to Gmail SMTP server on port 587
    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
    try:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender_email, app_password)
        server.send_message(msg)
    finally:
        server.quit()
