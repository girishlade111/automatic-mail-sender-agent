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

class CampaignResponse(CampaignBase):
    id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

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
        
class EmailLogResponse(BaseModel):
    id: int
    contact_id: int
    status: str
    message: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True
