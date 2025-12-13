from __future__ import annotations

from fastapi import APIRouter

from ...core.settings import settings

router = APIRouter()


@router.get('/health')
def health() -> dict[str, object]:
    return {
        'ok': True,
        'geminiConfigured': bool(settings.gemini_api_key),
        'evotorConfigured': False,
        'auth': {
            'smsProvider': settings.sms_provider,
            'smsConfigured': settings.sms_provider == 'console' or bool(settings.sms_ru_api_id),
            'cookieSecure': settings.cookie_secure,
        },
    }

