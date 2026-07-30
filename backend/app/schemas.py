from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class ContactBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    linkedin: Optional[str] = None
    notes: Optional[str] = None


class ContactCreate(ContactBase):
    pass


class ContactResponse(ContactBase):
    id: int
    campaign_id: int
    status: str
    validation_error: Optional[str] = None

    class Config:
        from_attributes = True


class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "Cold Outreach"
    prompt_template: Optional[str] = None
    tone: Optional[str] = None
    length: Optional[str] = None
    temperature: float = 0.7
    delay_seconds: int = 20


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    prompt_template: Optional[str] = None
    tone: Optional[str] = None
    length: Optional[str] = None
    temperature: Optional[float] = None
    delay_seconds: Optional[int] = None


class CampaignResponse(CampaignBase):
    id: int
    status: str
    scheduled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignScheduleRequest(BaseModel):
    scheduled_at: datetime
    gmail_account_id: Optional[int] = None


class CampaignAnalyticsResponse(BaseModel):
    total_contacts: int
    valid_contacts: int
    emails_generated: int
    emails_approved: int
    emails_sent: int
    emails_failed: int
    delivery_rate: float
    open_rate: float
    avg_generation_time: float


class GmailAccountBase(BaseModel):
    email: EmailStr


class GmailAccountCreate(GmailAccountBase):
    app_password: str


class GmailAccountResponse(GmailAccountBase):
    id: int

    class Config:
        from_attributes = True


class GeneratedEmailResponse(BaseModel):
    id: int
    contact_id: int
    subject: str
    body: str
    status: str

    class Config:
        from_attributes = True


class GeneratedEmailUpdate(BaseModel):
    subject: str
    body: str


class ContactWithEmailResponse(ContactResponse):
    """Contact joined with its generated email so the preview table needs a single call."""
    email_id: Optional[int] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    email_status: Optional[str] = None


class EmailLogResponse(BaseModel):
    id: int
    contact_id: int
    contact_email: Optional[str] = None
    status: str
    message: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class PaginatedLogsResponse(BaseModel):
    total: int
    limit: int
    offset: int
    logs: List[EmailLogResponse]


class CampaignStatsResponse(BaseModel):
    total: int
    valid: int
    invalid: int
    generated: int
    approved: int
    sent: int
    failed: int
    pending: int


class RecentCampaign(BaseModel):
    id: int
    name: str
    status: str
    sent: int


class RecentLog(BaseModel):
    id: int
    contact_email: Optional[str] = None
    status: str
    message: Optional[str] = None
    timestamp: datetime


class DashboardStatsResponse(BaseModel):
    total_campaigns: int
    emails_sent: int
    failed: int
    pending: int
    success_rate: float
    recent_campaigns: List[RecentCampaign]
    recent_logs: List[RecentLog]


class GmailTestResponse(BaseModel):
    ok: bool
    message: str


# Email Template schemas
class EmailTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    subject_template: str
    body_template: str
    category: Optional[str] = None


class EmailTemplateCreate(EmailTemplateBase):
    pass


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    subject_template: Optional[str] = None
    body_template: Optional[str] = None
    category: Optional[str] = None


class EmailTemplateResponse(EmailTemplateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
