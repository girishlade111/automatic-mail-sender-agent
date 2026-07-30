from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import Campaign, Contact, GeneratedEmail, EmailLog
from app.schemas import DashboardStatsResponse, RecentCampaign, RecentLog, EmailLogResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Aggregate counters for the dashboard cards (PRD §23, §31)."""
    total_campaigns = db.query(Campaign).count()

    emails = db.query(GeneratedEmail)
    emails_sent = emails.filter(GeneratedEmail.status == "Sent").count()
    failed = emails.filter(GeneratedEmail.status == "Failed").count()
    pending = emails.filter(GeneratedEmail.status.in_(["Pending", "Approved"])).count()

    attempted = emails_sent + failed
    success_rate = round((emails_sent / attempted) * 100, 1) if attempted else 0.0

    recent_campaigns = []
    for c in db.query(Campaign).order_by(Campaign.created_at.desc()).limit(5).all():
        sent = (
            db.query(GeneratedEmail)
            .join(Contact)
            .filter(Contact.campaign_id == c.id, GeneratedEmail.status == "Sent")
            .count()
        )
        recent_campaigns.append(RecentCampaign(id=c.id, name=c.name, status=c.status, sent=sent))

    recent_logs = []
    for log in db.query(EmailLog).order_by(EmailLog.timestamp.desc()).limit(8).all():
        contact = db.query(Contact).filter(Contact.id == log.contact_id).first()
        recent_logs.append(
            RecentLog(
                id=log.id,
                contact_email=contact.email if contact else None,
                status=log.status,
                message=log.message,
                timestamp=log.timestamp,
            )
        )

    return DashboardStatsResponse(
        total_campaigns=total_campaigns,
        emails_sent=emails_sent,
        failed=failed,
        pending=pending,
        success_rate=success_rate,
        recent_campaigns=recent_campaigns,
        recent_logs=recent_logs,
    )


@router.get("/logs", response_model=List[EmailLogResponse])
def get_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    campaign_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Dedicated paginated logs endpoint with optional filtering."""
    query = db.query(EmailLog).join(Contact)

    if campaign_id is not None:
        query = query.filter(Contact.campaign_id == campaign_id)
    if status is not None:
        query = query.filter(EmailLog.status == status)

    logs = query.order_by(EmailLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs
