from __future__ import annotations

import time

from fastapi import APIRouter, Depends, Request

from ...core.settings import settings
from ...services.ai_service import AiService
from ...services.errors import ServiceError, TooManyRequestsError
from ...services.rate_limiter import FixedWindowRateLimiter
from ...utils.network import get_client_ip
from ..deps import get_ai_service, get_rate_limiter

router = APIRouter(prefix='/ai')


@router.post('/recommendation')
def recommendation(
    payload: dict,
    request: Request,
    ai_service: AiService = Depends(get_ai_service),
    limiter: FixedWindowRateLimiter = Depends(get_rate_limiter),
) -> dict[str, str]:
    message = payload.get('message') if isinstance(payload, dict) else ''
    if not isinstance(message, str) or not message.strip():
        raise ServiceError('message is required', 400)
    if len(message) > 800:
        raise ServiceError('message is too long', 400)

    client_ip = get_client_ip(request)
    now_ms = int(time.time() * 1000)

    retry_after = limiter.consume(
        key=f'ai:recommendation:minute:{client_ip}',
        limit=settings.ai_max_requests_per_minute_ip,
        window_ms=60 * 1000,
        now_ms=now_ms,
    )
    if retry_after is not None:
        raise TooManyRequestsError(retry_after_ms=retry_after)

    retry_after = limiter.consume(
        key=f'ai:recommendation:hour:{client_ip}',
        limit=settings.ai_max_requests_per_hour_ip,
        window_ms=60 * 60 * 1000,
        now_ms=now_ms,
    )
    if retry_after is not None:
        raise TooManyRequestsError(retry_after_ms=retry_after)

    history = payload.get('history') if isinstance(payload, dict) else []
    menu_items = payload.get('menuItems') if isinstance(payload, dict) else []

    text = ai_service.recommendation(
        message=message,
        history=history if isinstance(history, list) else [],
        menu_items=menu_items if isinstance(menu_items, list) else [],
    )
    return {'text': text or ''}


@router.post('/address-zone')
def ai_address_zone(
    payload: dict,
    request: Request,
    ai_service: AiService = Depends(get_ai_service),
    limiter: FixedWindowRateLimiter = Depends(get_rate_limiter),
) -> dict:
    address = payload.get('address') if isinstance(payload, dict) else ''
    address_str = address.strip() if isinstance(address, str) else ''

    if len(address_str) > 200:
        raise ServiceError('Invalid address', 400)

    client_ip = get_client_ip(request)
    now_ms = int(time.time() * 1000)

    retry_after = limiter.consume(
        key=f'ai:address-zone:minute:{client_ip}',
        limit=settings.ai_max_requests_per_minute_ip,
        window_ms=60 * 1000,
        now_ms=now_ms,
    )
    if retry_after is not None:
        raise TooManyRequestsError(retry_after_ms=retry_after)

    retry_after = limiter.consume(
        key=f'ai:address-zone:hour:{client_ip}',
        limit=settings.ai_max_requests_per_hour_ip,
        window_ms=60 * 60 * 1000,
        now_ms=now_ms,
    )
    if retry_after is not None:
        raise TooManyRequestsError(retry_after_ms=retry_after)

    return ai_service.address_zone(address=address_str)
