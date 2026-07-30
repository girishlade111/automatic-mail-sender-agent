"""Webhook notification service.

Fires HTTP POST requests to configured webhook URLs when campaign events occur.
In production this should be done asynchronously (e.g., via Celery task).
Here we use a best-effort synchronous approach with a short timeout.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.database import SessionLocal
from app.models import WebhookConfig

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 5


def fire_webhooks(event: str, campaign_id: int, campaign_name: Optional[str] = None) -> None:
    """Send event payload to all active webhook configs subscribed to this event.

    Args:
        event: The event name, e.g. "completed", "failed", "paused".
        campaign_id: The campaign that triggered the event.
        campaign_name: Optional campaign name for context.
    """
    db = SessionLocal()
    try:
        configs = db.query(WebhookConfig).filter(WebhookConfig.active == True).all()
        for config in configs:
            try:
                events_list = json.loads(config.events) if config.events else []
            except (json.JSONDecodeError, TypeError):
                events_list = []

            if event not in events_list:
                continue

            payload = {
                "event": event,
                "campaign_id": campaign_id,
                "campaign_name": campaign_name or "",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            try:
                with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
                    client.post(config.url, json=payload)
            except Exception as e:
                logger.warning(f"Webhook delivery failed for {config.url}: {e}")
    finally:
        db.close()
