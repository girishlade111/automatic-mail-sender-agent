"""Webhook notification service.

Fires HTTP POST requests to configured webhook URLs when campaign events occur.
Delivery runs in a background daemon thread so the Celery send loop is never
blocked by webhook latency or timeouts.
"""

import json
import logging
import threading
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.database import SessionLocal
from app.models import WebhookConfig

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 5


def _deliver_webhooks(event: str, campaign_id: int, campaign_name: str) -> None:
    """Internal: synchronous webhook delivery meant to run in a background thread."""
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
                "campaign_name": campaign_name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            try:
                with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
                    client.post(config.url, json=payload)
            except Exception as e:
                logger.warning(f"Webhook delivery failed for {config.url}: {e}")
    except Exception as e:
        logger.error(f"Webhook delivery error: {e}")
    finally:
        db.close()


def fire_webhooks(event: str, campaign_id: int, campaign_name: Optional[str] = None) -> None:
    """Send event payload to all active webhook configs subscribed to this event.

    Delivery happens in a fire-and-forget daemon thread so the caller (typically
    the Celery send loop) is not blocked by network I/O.

    Args:
        event: The event name, e.g. "completed", "failed", "paused".
        campaign_id: The campaign that triggered the event.
        campaign_name: Optional campaign name for context.
    """
    thread = threading.Thread(
        target=_deliver_webhooks,
        args=(event, campaign_id, campaign_name or ""),
        daemon=True,
    )
    thread.start()
