from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete
from sqlalchemy.orm import Session

from ..db.models import Session as DbSession


class SessionRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get(self, token: str) -> DbSession | None:
        return self._db.get(DbSession, token)

    def create(self, *, token: str, user_id: str, created_at: datetime, expires_at: datetime) -> DbSession:
        session = DbSession(
            token=token,
            user_id=user_id,
            created_at=created_at,
            expires_at=expires_at,
        )
        self._db.add(session)
        self._db.flush()
        return session

    def delete(self, token: str) -> None:
        session = self.get(token)
        if session:
            self._db.delete(session)

    def delete_expired(self, *, now: datetime) -> int:
        result = self._db.execute(delete(DbSession).where(DbSession.expires_at < now))
        return int(getattr(result, 'rowcount', 0) or 0)

    def delete_for_user(self, *, user_id: str, except_token: str | None = None) -> int:
        stmt = delete(DbSession).where(DbSession.user_id == user_id)
        if except_token:
            stmt = stmt.where(DbSession.token != except_token)
        result = self._db.execute(stmt)
        return int(getattr(result, 'rowcount', 0) or 0)
