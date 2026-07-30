from celery import Celery
from app.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    # Celery Beat schedule: check for due scheduled campaigns every 60 seconds.
    # Start Celery Beat with: celery -A app.celery_app beat --loglevel=info
    beat_schedule={
        "check-scheduled-campaigns-every-60s": {
            "task": "app.tasks.check_scheduled_campaigns_task",
            "schedule": 60.0,
        },
    },
)

import app.tasks
