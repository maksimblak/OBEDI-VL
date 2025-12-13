from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from .api.errors import install_exception_handlers
from .api.router import api_router
from .core.database import init_db
import os
from pathlib import Path

from .core.settings import REPO_DIR, settings
from .services.ai_service import AiService
from .services.auth_service import OtpRateLimiter
from .services.delivery_service import DeliveryService
from .services.evotor_auth import EvotorWebhookAuth
from .services.evotor_client import EvotorClient
from .services.evotor_service import EvotorService
from .services.evotor_token_store import EvotorTokenStore
from .services.sms import create_sms_sender


def _install_spa_routes(app: FastAPI) -> None:
    dist_dir = (REPO_DIR / 'dist').resolve()
    index_file = dist_dir / 'index.html'
    if not index_file.is_file():
        return

    def resolve_dist_file(relative_path: str) -> Path | None:
        if not relative_path:
            return None

        candidate = (dist_dir / relative_path).resolve()
        if not candidate.is_file():
            return None
        if not candidate.is_relative_to(dist_dir):
            return None
        return candidate

    @app.get('/', include_in_schema=False)
    def spa_root():
        return FileResponse(index_file)

    @app.get('/{full_path:path}', include_in_schema=False)
    def spa_fallback(full_path: str):
        if full_path == 'api' or full_path.startswith('api/'):
            return JSONResponse({'error': 'Not Found'}, status_code=404)

        file_path = resolve_dist_file(full_path)
        if file_path is not None:
            return FileResponse(file_path)

        return FileResponse(index_file)


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
    app.state.ai_service = AiService()
    app.state.delivery_service = DeliveryService(
        cache_ttl_ms=settings.delivery_zone_cache_ttl_ms,
        user_agent=settings.nominatim_user_agent,
    )
    evotor_auth = EvotorWebhookAuth()
    raw_token_store_path = (os.getenv('EVOTOR_TOKEN_STORE_PATH') or '').strip()
    token_store_path = (
        (Path(raw_token_store_path) if Path(raw_token_store_path).is_absolute() else (REPO_DIR / raw_token_store_path))
        if raw_token_store_path
        else (REPO_DIR / '.evotor' / 'tokens.json')
    )
    app.state.evotor_auth = evotor_auth
    app.state.evotor_service = EvotorService(
        auth=evotor_auth,
        token_store=EvotorTokenStore(token_store_path),
        client=EvotorClient(),
    )

    app.include_router(api_router, prefix='/api')
    _install_spa_routes(app)
    return app


app = create_app()
