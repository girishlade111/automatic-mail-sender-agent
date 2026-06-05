import time
from typing import Callable, TypeVar

T = TypeVar("T")


def with_retries(fn: Callable[[], T], attempts: int = 3, base_delay: float = 2.0) -> T:
    """Run ``fn`` up to ``attempts`` times with linear backoff.

    The long-running send loop in ``tasks.py`` can't rely on Celery's per-task
    ``max_retries`` (it never returns until the whole campaign finishes), so transient
    SMTP / NIM failures are retried in-process here instead (PRD §26).
    Re-raises the last exception if every attempt fails.
    """
    last_exc: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001 - caller decides how to handle
            last_exc = exc
            if attempt < attempts:
                time.sleep(base_delay * attempt)
    assert last_exc is not None
    raise last_exc
