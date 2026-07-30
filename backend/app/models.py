from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class GmailAccount(Base):
    __tablename__ = "gmail_accounts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    email = Column(String, unique=True, index=True)
    encrypted_password = Column(String)


class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    type = Column(String, default="Cold Outreach")
    status = Column(String, default="Draft")  # Draft, Pending, Generating, Generated, Sending, Paused, Stopped, Completed

    prompt_template = Column(Text, nullable=True)
    tone = Column(String, nullable=True)
    length = Column(String, nullable=True)
    temperature = Column(Float, default=0.7)
    delay_seconds = Column(Integer, default=20)

    scheduled_at = Column(DateTime, nullable=True)
    gmail_account_id = Column(Integer, ForeignKey("gmail_accounts.id"), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    contacts = relationship("Contact", back_populates="campaign", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))

    email = Column(String, index=True)
    name = Column(String, nullable=True)
    company = Column(String, nullable=True)
    role = Column(String, nullable=True)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    status = Column(String, default="Pending")  # Pending, Valid, Invalid, Excluded
    validation_error = Column(String, nullable=True)

    campaign = relationship("Campaign", back_populates="contacts")
    generated_email = relationship("GeneratedEmail", back_populates="contact", uselist=False, cascade="all, delete-orphan")
    logs = relationship("EmailLog", back_populates="contact", cascade="all, delete-orphan")


class GeneratedEmail(Base):
    __tablename__ = "generated_emails"
    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"))

    subject = Column(String)
    body = Column(Text)
    status = Column(String, default="Pending")  # Pending, Approved, Rejected, Sent, Failed

    contact = relationship("Contact", back_populates="generated_email")


class EmailLog(Base):
    __tablename__ = "email_logs"
    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"))

    status = Column(String)  # Generating, Queued, Sent, Failed, RateLimited
    message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    contact = relationship("Contact", back_populates="logs")


class EmailTemplate(Base):
    __tablename__ = "email_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    subject_template = Column(String)
    body_template = Column(Text)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
