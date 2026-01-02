from __future__ import annotations

import time
from typing import Any, Callable, TypeVar

T = TypeVar('T')


class SimpleCache:
    """
    Simple in-memory cache with TTL (Time-To-Live).
    Thread-safe for reads, writes may have race conditions but are safe for this use case.
    """
    def __init__(self, ttl_ms: int = 5 * 60 * 1000) -> None:
        """
        Initialize cache with TTL in milliseconds.
        Default: 5 minutes
        """
        self._ttl_ms = ttl_ms
        self._cache: dict[str, tuple[int, Any]] = {}

    def get(self, key: str) -> Any | None:
        """Get cached value if not expired, otherwise None"""
        normalized_key = str(key or '').strip()
        if not normalized_key:
            return None

        entry = self._cache.get(normalized_key)
        if entry is None:
            return None

        timestamp_ms, value = entry
        now_ms = int(time.time() * 1000)

        if now_ms - timestamp_ms > self._ttl_ms:
            # Expired - remove from cache
            self._cache.pop(normalized_key, None)
            return None

        return value

    def set(self, key: str, value: Any) -> None:
        """Set cached value with current timestamp"""
        normalized_key = str(key or '').strip()
        if not normalized_key:
            return

        now_ms = int(time.time() * 1000)
        self._cache[normalized_key] = (now_ms, value)

    def invalidate(self, key: str) -> None:
        """Remove cached value"""
        normalized_key = str(key or '').strip()
        if normalized_key:
            self._cache.pop(normalized_key, None)

    def clear(self) -> None:
        """Clear all cached values"""
        self._cache.clear()

    def cached(self, key: str, factory: Callable[[], T]) -> T:
        """
        Get cached value or compute and cache it.

        Example:
            cache = SimpleCache(ttl_ms=5*60*1000)
            result = cache.cached('products:store1', lambda: fetch_products())
        """
        cached_value = self.get(key)
        if cached_value is not None:
            return cached_value

        computed_value = factory()
        self.set(key, computed_value)
        return computed_value
