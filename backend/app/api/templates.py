"""Email Templates CRUD router.

Provides endpoints for managing reusable email templates.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EmailTemplate
from app.schemas import (
    EmailTemplateCreate,
    EmailTemplateResponse,
    EmailTemplateUpdate,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/", response_model=List[EmailTemplateResponse])
def list_templates(db: Session = Depends(get_db)):
    """List all email templates, ordered by most recently created."""
    templates = db.query(EmailTemplate).order_by(EmailTemplate.created_at.desc()).all()
    return templates


@router.post("/", response_model=EmailTemplateResponse, status_code=201)
def create_template(payload: EmailTemplateCreate, db: Session = Depends(get_db)):
    """Create a new email template."""
    template = EmailTemplate(**payload.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    logger.info("Created email template: %s (id=%d)", template.name, template.id)
    return template


@router.get("/{template_id}", response_model=EmailTemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db)):
    """Get a single email template by ID."""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/{template_id}", response_model=EmailTemplateResponse)
def update_template(template_id: int, payload: EmailTemplateUpdate, db: Session = Depends(get_db)):
    """Update an existing email template."""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)
    logger.info("Updated email template: %s (id=%d)", template.name, template.id)
    return template


@router.delete("/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    """Delete an email template."""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()
    logger.info("Deleted email template id=%d", template_id)
    return {"message": "Template deleted"}
