"""Shared rate-limit helpers.

Provides a single source of truth for counting sent emails within time windows,
used by both the preflight check endpoint and the Celery send loop.
"""

from datetime import datetime
from sqlalchemy.orm import Session

from app.models import EmailLog


def sent_count_since(db: Session, since: datetime) -> int:
    """Count successful sends across ALL campaigns since the given datetime.

    Gmail imposes per-account limits, so we count globally rather than
    per-campaign.
    """
    return (
        db.query(EmailLog)
        .filter(EmailLog.status == "Sent", EmailLog.timestamp >= since)
        .count()
    )
