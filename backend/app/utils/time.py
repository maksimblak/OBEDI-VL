from __future__ import annotations

from datetime import datetime, timezone


def utc_now() -> datetime:
    return datetime.utcnow()


def isoformat_z(value: datetime) -> str:
    dt = value
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return dt.isoformat(timespec='milliseconds').replace('+00:00', 'Z')

