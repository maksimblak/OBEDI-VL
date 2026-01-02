from __future__ import annotations

import time

from sqlalchemy import delete, update
from sqlalchemy.orm import Session

from ..db.models import RateLimit


class FixedWindowRateLimiter:
    """
    Database-backed rate limiter using SQLite.
    Thread-safe and works across multiple processes.
    """
    def __init__(self, db: Session) -> None:
        self._db = db

    def consume(self, *, key: str, limit: int, window_ms: int, now_ms: int | None = None) -> int | None:
        """
        Try to consume from rate limit bucket.
        Returns None if allowed, or retry_after_ms if rate limited.
        """
        normalized_key = str(key or '').strip()
        if not normalized_key:
            normalized_key = 'unknown'

        normalized_limit = int(limit) if isinstance(limit, int) else 0
        normalized_window_ms = int(window_ms) if isinstance(window_ms, int) else 0

        if normalized_limit <= 0 or normalized_window_ms <= 0:
            return None

        now = int(now_ms) if isinstance(now_ms, int) else int(time.time() * 1000)

        # Get or create bucket
        bucket = self._db.get(RateLimit, normalized_key)

        # Reset bucket if window expired
        if bucket is None or now > bucket.reset_at_ms:
            if bucket:
                # Update existing bucket
                bucket.count = 1
                bucket.reset_at_ms = now + normalized_window_ms
            else:
                # Create new bucket
                bucket = RateLimit(
                    key=normalized_key,
                    count=1,
                    reset_at_ms=now + normalized_window_ms
                )
                self._db.add(bucket)
            self._db.commit()
            return None

        # Check if over limit
        if bucket.count >= normalized_limit:
            retry_after_ms = max(0, bucket.reset_at_ms - now)
            return retry_after_ms

        # Increment count atomically
        stmt = (
            update(RateLimit)
            .where(RateLimit.key == normalized_key)
            .values(count=RateLimit.count + 1)
        )
        self._db.execute(stmt)
        self._db.commit()
        return None

    def cleanup_expired(self, *, now_ms: int | None = None) -> int:
        """Remove expired rate limit buckets"""
        now = int(now_ms) if isinstance(now_ms, int) else int(time.time() * 1000)
        result = self._db.execute(
            delete(RateLimit).where(RateLimit.reset_at_ms < now)
        )
        self._db.commit()
        return int(getattr(result, 'rowcount', 0) or 0)

