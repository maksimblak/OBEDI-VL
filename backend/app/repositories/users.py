from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_id(self, user_id: str) -> User | None:
        return self._db.get(User, user_id)

    def get_by_phone(self, phone: str) -> User | None:
        stmt = select(User).where(User.phone == phone).limit(1)
        return self._db.execute(stmt).scalars().first()

    def get_or_create_guest(self, phone: str, *, now: datetime) -> User:
        existing = self.get_by_id(phone)
        if existing:
            return existing

        user = User(
            id=phone,
            phone=phone,
            name='Гость',
            loyalty_points=150,
            joined_date=now,
        )
        self._db.add(user)
        self._db.flush()
        return user

