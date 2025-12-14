from __future__ import annotations

import threading
import time
from dataclasses import dataclass


@dataclass
class _Bucket:
    count: int
    reset_at_ms: int


class FixedWindowRateLimiter:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._buckets: dict[str, _Bucket] = {}

    def consume(self, *, key: str, limit: int, window_ms: int, now_ms: int | None = None) -> int | None:
        normalized_key = str(key or '').strip()
        if not normalized_key:
            normalized_key = 'unknown'

        normalized_limit = int(limit) if isinstance(limit, int) else 0
        normalized_window_ms = int(window_ms) if isinstance(window_ms, int) else 0

        if normalized_limit <= 0 or normalized_window_ms <= 0:
            return None

        now = int(now_ms) if isinstance(now_ms, int) else int(time.time() * 1000)

        with self._lock:
            bucket = self._buckets.get(normalized_key)
            if bucket is None or now > bucket.reset_at_ms:
                bucket = _Bucket(count=0, reset_at_ms=now + normalized_window_ms)

            if bucket.count >= normalized_limit:
                retry_after_ms = max(0, bucket.reset_at_ms - now)
                self._buckets[normalized_key] = bucket
                return retry_after_ms

            bucket.count += 1
            self._buckets[normalized_key] = bucket
            return None

