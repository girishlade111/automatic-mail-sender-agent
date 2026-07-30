"""Campaign scheduling service.

Provides functions for managing scheduled campaign sends.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Campaign

logger = logging.getLogger(__name__)


def schedule_campaign(db: Session, campaign_id: int, scheduled_at: datetime) -> Campaign:
    """Schedule a campaign to be sent at a specific time.

    Args:
        db: Database session
        campaign_id: ID of the campaign to schedule
        scheduled_at: When to send the campaign (must be in the future)

    Returns:
        The updated campaign object

    Raises:
        ValueError: If the scheduled time is in the past or campaign is not found
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise ValueError(f"Campaign {campaign_id} not found")

    now = datetime.now(timezone.utc)
    # Normalize scheduled_at to UTC if naive
    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)

    if scheduled_at <= now:
        raise ValueError("Scheduled time must be in the future")

    campaign.scheduled_at = scheduled_at
    campaign.status = "Scheduled"
    db.commit()
    db.refresh(campaign)

    logger.info("Campaign %d scheduled for %s", campaign_id, scheduled_at.isoformat())
    return campaign


def cancel_schedule(db: Session, campaign_id: int) -> Campaign:
    """Cancel a scheduled campaign, returning it to Draft status.

    Args:
        db: Database session
        campaign_id: ID of the campaign

    Returns:
        The updated campaign object
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise ValueError(f"Campaign {campaign_id} not found")

    campaign.scheduled_at = None
    campaign.status = "Draft"
    db.commit()
    db.refresh(campaign)

    logger.info("Schedule cancelled for campaign %d", campaign_id)
    return campaign
