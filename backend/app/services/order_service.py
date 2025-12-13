from __future__ import annotations

import secrets
import time
from typing import Any

from sqlalchemy.orm import Session

from ..db.models import Order
from ..repositories.orders import OrderRepository
from ..utils.time import utc_now
from .errors import EmptyOrderError


class OrderService:
    def __init__(self, *, db: Session) -> None:
        self._db = db
        self._orders = OrderRepository(db)

    def list_orders(self, *, user_id: str) -> list[Order]:
        return list(self._orders.list_for_user(user_id))

    def create_order(self, *, user_id: str, items: list[dict[str, Any]]) -> Order:
        normalized: list[dict[str, Any]] = []
        for raw in items[:100]:
            if not isinstance(raw, dict):
                continue

            item_id = str(raw.get('id') or '').strip()
            title = str(raw.get('title') or '').strip()

            try:
                price = float(raw.get('price') or 0)
            except (TypeError, ValueError):
                price = 0

            try:
                quantity = int(raw.get('quantity') or 1)
            except (TypeError, ValueError):
                quantity = 1

            quantity = max(1, min(99, quantity))
            if not item_id or not title or price < 0:
                continue

            normalized.append({**raw, 'id': item_id, 'title': title, 'price': price, 'quantity': quantity})

        if len(normalized) == 0:
            raise EmptyOrderError()

        total = sum(float(item.get('price', 0)) * int(item.get('quantity', 1)) for item in normalized)

        order = Order(
            id=f'{int(time.time() * 1000)}_{secrets.token_hex(4)}',
            user_id=user_id,
            date=utc_now(),
            items=normalized,
            total=total,
            status='pending',
        )

        self._orders.add(order)
        self._db.commit()
        self._db.refresh(order)

        deleted = self._orders.delete_stale(user_id, keep=50)
        if deleted:
            self._db.commit()

        return order

