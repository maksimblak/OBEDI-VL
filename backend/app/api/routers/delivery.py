from __future__ import annotations

from fastapi import APIRouter, Depends

from ...services.delivery_service import DeliveryService
from ...services.errors import ServiceError
from ..deps import get_delivery_service

router = APIRouter(prefix='/delivery')


@router.post('/address-zone')
def address_zone(payload: dict[str, object], delivery_service: DeliveryService = Depends(get_delivery_service)) -> dict[str, object]:
    address = payload.get('address')
    address_str = address.strip() if isinstance(address, str) else ''
    if not address_str:
        return {'found': False, 'formattedAddress': '', 'distance': 0, 'zone': None}

    if len(address_str) > 200:
        raise ServiceError('Invalid address', 400)

    return delivery_service.resolve_zone(address_str)

