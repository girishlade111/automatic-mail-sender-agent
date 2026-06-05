from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import GmailAccount, User
from app.schemas import GmailAccountCreate, GmailAccountResponse, GmailTestResponse
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
