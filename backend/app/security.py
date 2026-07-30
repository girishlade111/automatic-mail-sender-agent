import logging

from cryptography.fernet import Fernet
from app.config import settings

logger = logging.getLogger(__name__)

_key = settings.ENCRYPTION_KEY
if not _key:
    # Use a temporary key for development if missing to prevent crashes
    _key = Fernet.generate_key().decode()
    logger.warning(
        "ENCRYPTION_KEY is not set. A randomly generated key is being used. "
        "Any encrypted data (e.g., Gmail app passwords) will become unreadable "
        "after a restart. Set ENCRYPTION_KEY in your environment or .env file "
        "for persistent encryption."
    )


def get_fernet() -> Fernet:
    return Fernet(_key.encode())


def encrypt_password(password: str) -> str:
    f = get_fernet()
    return f.encrypt(password.encode()).decode()


def decrypt_password(encrypted_password: str) -> str:
    f = get_fernet()
    return f.decrypt(encrypted_password.encode()).decode()
