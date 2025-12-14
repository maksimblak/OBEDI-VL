from __future__ import annotations

import time

from fastapi import APIRouter, Depends, Request

from ...core.settings import settings
from ...services.delivery_service import DeliveryService
from ...services.errors import ServiceError, TooManyRequestsError
from ...services.rate_limiter import FixedWindowRateLimiter
from ...utils.network import get_client_ip
from ..deps import get_delivery_service, get_rate_limiter

router = APIRouter(prefix='/delivery')


@router.post('/address-zone')
def address_zone(
    payload: dict[str, object],
    request: Request,
    delivery_service: DeliveryService = Depends(get_delivery_service),
    limiter: FixedWindowRateLimiter = Depends(get_rate_limiter),
) -> dict[str, object]:
    address = payload.get('address')
    address_str = address.strip() if isinstance(address, str) else ''
    if not address_str:
        return {'found': False, 'formattedAddress': '', 'distance': 0, 'zone': None}

    if len(address_str) > 200:
        raise ServiceError('Invalid address', 400)

    client_ip = get_client_ip(request)
    now_ms = int(time.time() * 1000)

    retry_after = limiter.consume(
        key=f'delivery:address-zone:minute:{client_ip}',
        limit=settings.delivery_max_requests_per_minute_ip,
        window_ms=60 * 1000,
        now_ms=now_ms,
    )
    if retry_after is not None:
        raise TooManyRequestsError(retry_after_ms=retry_after)

    retry_after = limiter.consume(
        key=f'delivery:address-zone:hour:{client_ip}',
        limit=settings.delivery_max_requests_per_hour_ip,
        window_ms=60 * 60 * 1000,
        now_ms=now_ms,
    )
    if retry_after is not None:
        raise TooManyRequestsError(retry_after_ms=retry_after)

    return delivery_service.resolve_zone(address_str)
