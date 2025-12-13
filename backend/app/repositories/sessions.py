from __future__ import annotations

from datetime import datetime

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

