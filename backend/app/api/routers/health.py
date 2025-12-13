from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from ...core.database import get_db
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


@router.get('/ready')
def ready(db: Session = Depends(get_db)) -> JSONResponse:
    try:
        db.execute(text('SELECT 1')).scalar()
    except Exception:
        return JSONResponse(status_code=503, content={'ok': False, 'db': {'ok': False}})

    try:
        inspector = inspect(db.get_bind())
        tables = set(inspector.get_table_names())
        required = {'users', 'sessions', 'otp_codes', 'orders'}
        missing = sorted(required - tables)
        if missing:
            return JSONResponse(
                status_code=503,
                content={'ok': False, 'db': {'ok': True}, 'schema': {'ok': False, 'missingTables': missing}},
            )
    except Exception:
        return JSONResponse(status_code=503, content={'ok': False, 'db': {'ok': True}, 'schema': {'ok': False}})

    return JSONResponse(status_code=200, content={'ok': True, 'db': {'ok': True}, 'schema': {'ok': True}})
