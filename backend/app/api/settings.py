from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from app.database import get_db
from app.models import GmailAccount, User, WebhookConfig
from app.schemas import (
    GmailAccountCreate, GmailAccountResponse, GmailTestResponse,
    WebhookConfigCreate, WebhookConfigUpdate, WebhookConfigResponse,
)
from app.security import encrypt_password, decrypt_password
from app.services.email_sender import verify_smtp_login

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/gmail", response_model=list[GmailAccountResponse])
def get_gmail_accounts(db: Session = Depends(get_db)):
    return db.query(GmailAccount).all()

@router.post("/gmail", response_model=GmailAccountResponse)
def add_gmail_account(account: GmailAccountCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(email="admin@local")
        db.add(user)
        db.commit()
        db.refresh(user)
        
    encrypted = encrypt_password(account.app_password)
    db_account = GmailAccount(user_id=user.id, email=account.email, encrypted_password=encrypted)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.post("/gmail/{account_id}/test", response_model=GmailTestResponse)
def test_gmail_account(account_id: int, db: Session = Depends(get_db)):
    """Test Connection button (PRD §19): authenticate against Gmail SMTP without sending."""
    account = db.query(GmailAccount).filter(GmailAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Gmail account not found")

    try:
        app_password = decrypt_password(account.encrypted_password)
        verify_smtp_login(account.email, app_password)
        return GmailTestResponse(ok=True, message="Connection successful")
    except Exception as e:
        return GmailTestResponse(ok=False, message=f"Connection failed: {e}")

@router.delete("/gmail/{account_id}")
def delete_gmail_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(GmailAccount).filter(GmailAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Gmail account not found")
    db.delete(account)
    db.commit()
    return {"message": "Disconnected"}


# --- Webhook Configuration ---

@router.get("/webhooks", response_model=list[WebhookConfigResponse])
def get_webhooks(db: Session = Depends(get_db)):
    """List all configured webhooks."""
    configs = db.query(WebhookConfig).order_by(WebhookConfig.created_at.desc()).all()
    # Convert the JSON events string to a list for the response
    results = []
    for config in configs:
        try:
            events_list = json.loads(config.events) if config.events else []
        except (json.JSONDecodeError, TypeError):
            events_list = []
        results.append(WebhookConfigResponse(
            id=config.id,
            url=config.url,
            events=events_list,
            active=config.active,
            created_at=config.created_at,
        ))
    return results


@router.post("/webhooks", response_model=WebhookConfigResponse)
def create_webhook(payload: WebhookConfigCreate, db: Session = Depends(get_db)):
    """Create a new webhook configuration."""
    config = WebhookConfig(
        url=payload.url,
        events=json.dumps(payload.events),
        active=payload.active,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return WebhookConfigResponse(
        id=config.id,
        url=config.url,
        events=payload.events,
        active=config.active,
        created_at=config.created_at,
    )


@router.put("/webhooks/{webhook_id}", response_model=WebhookConfigResponse)
def update_webhook(webhook_id: int, payload: WebhookConfigUpdate, db: Session = Depends(get_db)):
    """Update an existing webhook configuration."""
    config = db.query(WebhookConfig).filter(WebhookConfig.id == webhook_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Webhook not found")

    if payload.url is not None:
        config.url = payload.url
    if payload.events is not None:
        config.events = json.dumps(payload.events)
    if payload.active is not None:
        config.active = payload.active

    db.commit()
    db.refresh(config)

    try:
        events_list = json.loads(config.events) if config.events else []
    except (json.JSONDecodeError, TypeError):
        events_list = []

    return WebhookConfigResponse(
        id=config.id,
        url=config.url,
        events=events_list,
        active=config.active,
        created_at=config.created_at,
    )


@router.delete("/webhooks/{webhook_id}")
def delete_webhook(webhook_id: int, db: Session = Depends(get_db)):
    """Delete a webhook configuration."""
    config = db.query(WebhookConfig).filter(WebhookConfig.id == webhook_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Webhook not found")
    db.delete(config)
    db.commit()
    return {"message": "Webhook deleted"}
