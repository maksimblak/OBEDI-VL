from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.errors import install_exception_handlers
from .api.router import api_router
from .core.database import init_db
from .core.settings import settings
from .services.auth_service import OtpRateLimiter
from .services.delivery_service import DeliveryService
from .services.sms import create_sms_sender


def create_app() -> FastAPI:
    app = FastAPI(title='Obedi VL API (Python)')

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=['GET', 'POST', 'PATCH', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization'],
    )

    install_exception_handlers(app)

    @app.on_event('startup')
    def _startup() -> None:
        init_db()

    app.state.sms_sender = create_sms_sender(settings)
    app.state.otp_rate_limiter = OtpRateLimiter()
    app.state.delivery_service = DeliveryService(
        cache_ttl_ms=settings.delivery_zone_cache_ttl_ms,
        user_agent=settings.nominatim_user_agent,
    )

    app.include_router(api_router, prefix='/api')
    return app


app = create_app()

