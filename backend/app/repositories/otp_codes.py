from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, update
from sqlalchemy.orm import Session

from ..db.models import OtpCode


class OtpCodeRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get(self, phone: str) -> OtpCode | None:
        return self._db.get(OtpCode, phone)

    def upsert(
        self,
        phone: str,
        *,
        code_hash: str,
        created_at: datetime,
        expires_at: datetime,
        attempts_left: int,
        blocked_until: datetime | None = None,
    ) -> OtpCode:
        existing = self.get(phone)
        if existing:
            existing.code_hash = code_hash
            existing.created_at = created_at
            existing.expires_at = expires_at
            existing.attempts_left = attempts_left
            existing.blocked_until = blocked_until
            self._db.flush()
            return existing

        record = OtpCode(
            phone=phone,
            code_hash=code_hash,
            created_at=created_at,
            expires_at=expires_at,
            attempts_left=attempts_left,
            blocked_until=blocked_until,
        )
        self._db.add(record)
        self._db.flush()
        return record

    def delete(self, phone: str) -> None:
        existing = self.get(phone)
        if existing:
            self._db.delete(existing)

    def delete_expired(self, *, now: datetime) -> int:
        result = self._db.execute(delete(OtpCode).where(OtpCode.expires_at < now))
        return int(getattr(result, 'rowcount', 0) or 0)

    def decrement_attempts(self, phone: str) -> bool:
        """
        Atomically decrement attempts_left for given phone.
        Returns True if decrement was successful (attempts_left > 0 before decrement).
        """
        stmt = (
            update(OtpCode)
            .where(OtpCode.phone == phone, OtpCode.attempts_left > 0)
            .values(attempts_left=OtpCode.attempts_left - 1)
        )
        result = self._db.execute(stmt)
        return int(getattr(result, 'rowcount', 0) or 0) > 0

    def block_phone(self, phone: str, blocked_until: datetime) -> None:
        """
        Block phone from requesting OTP until specified time.
        """
        stmt = (
            update(OtpCode)
            .where(OtpCode.phone == phone)
            .values(attempts_left=0, blocked_until=blocked_until)
        )
        self._db.execute(stmt)
