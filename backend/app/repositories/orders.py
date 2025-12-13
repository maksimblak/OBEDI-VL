from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..db.models import Order


class OrderRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_for_user(self, user_id: str, *, limit: int = 50) -> Sequence[Order]:
        stmt = select(Order).where(Order.user_id == user_id).order_by(Order.date.desc()).limit(limit)
        return self._db.execute(stmt).scalars().all()

    def add(self, order: Order) -> None:
        self._db.add(order)

    def delete_stale(self, user_id: str, *, keep: int = 50) -> int:
        stmt = select(Order.id).where(Order.user_id == user_id).order_by(Order.date.desc()).offset(keep).limit(500)
        stale_ids = [row[0] for row in self._db.execute(stmt).all()]
        if not stale_ids:
            return 0

        self._db.execute(delete(Order).where(Order.id.in_(stale_ids)))
        return len(stale_ids)

