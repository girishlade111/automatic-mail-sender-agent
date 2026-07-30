from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
from app.config import settings
from app.database import engine, Base, get_db
from app.models import Contact, EmailLog
from app.schemas import EmailLogResponse

from app.api import campaigns, contacts, settings as app_settings, dashboard, templates

# Create tables automatically for local development
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI Personalized Email Outreach Agent",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns.router, prefix="/api")
app.include_router(contacts.router, prefix="/api")
app.include_router(app_settings.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(templates.router, prefix="/api")


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Health check that also verifies database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {"status": "ok", "app": settings.PROJECT_NAME, "database": db_status}


@app.get("/api/logs", response_model=List[EmailLogResponse])
def get_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    campaign_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Dedicated paginated logs endpoint with optional filtering by campaign_id and status."""
    query = db.query(EmailLog).join(Contact)

    if campaign_id is not None:
        query = query.filter(Contact.campaign_id == campaign_id)
    if status is not None:
        query = query.filter(EmailLog.status == status)

    logs = query.order_by(EmailLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs
