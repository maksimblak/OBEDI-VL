from __future__ import annotations

from fastapi import APIRouter, Depends

from ...db.models import Order, User
from ...services.order_service import OrderService
from ...utils.time import isoformat_z
from ..deps import get_order_service, require_user
from ..schemas import CreateOrderIn

router = APIRouter(prefix='/orders')


def _serialize_order(order: Order) -> dict[str, object]:
    return {
        'id': order.id,
        'userId': order.user_id,
        'date': isoformat_z(order.date),
        'items': order.items,
        'total': order.total,
        'status': order.status,
    }


@router.get('')
def list_orders(user: User = Depends(require_user), order_service: OrderService = Depends(get_order_service)) -> dict[str, object]:
    orders = order_service.list_orders(user_id=user.id)
    return {'orders': [_serialize_order(order) for order in orders]}


@router.post('')
def create_order(
    payload: CreateOrderIn,
    user: User = Depends(require_user),
    order_service: OrderService = Depends(get_order_service),
) -> dict[str, object]:
    order = order_service.create_order(user_id=user.id, items=[item.model_dump() for item in payload.items])
    return {'order': _serialize_order(order)}

