from __future__ import annotations

from fastapi import APIRouter, Depends

from ...services.ai_service import AiService
from ...services.errors import ServiceError
from ..deps import get_ai_service

router = APIRouter(prefix='/ai')


@router.post('/recommendation')
def recommendation(payload: dict, ai_service: AiService = Depends(get_ai_service)) -> dict[str, str]:
    message = payload.get('message') if isinstance(payload, dict) else ''
    if not isinstance(message, str) or not message.strip():
        raise ServiceError('message is required', 400)

    history = payload.get('history') if isinstance(payload, dict) else []
    menu_items = payload.get('menuItems') if isinstance(payload, dict) else []

    text = ai_service.recommendation(
        message=message,
        history=history if isinstance(history, list) else [],
        menu_items=menu_items if isinstance(menu_items, list) else [],
    )
    return {'text': text or ''}


@router.post('/address-zone')
def ai_address_zone(payload: dict, ai_service: AiService = Depends(get_ai_service)) -> dict:
    address = payload.get('address') if isinstance(payload, dict) else ''
    address_str = address.strip() if isinstance(address, str) else ''
    return ai_service.address_zone(address=address_str)

