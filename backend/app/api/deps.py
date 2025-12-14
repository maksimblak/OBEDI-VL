from __future__ import annotations

from fastapi import Depends, Request, Response
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.settings import settings
from ..db.models import User
from ..services.ai_service import AiService
from ..services.auth_service import AuthService, OtpRateLimiter
from ..services.delivery_service import DeliveryService
from ..services.evotor_auth import EvotorWebhookAuth
from ..services.evotor_service import EvotorService
from ..services.errors import UnauthorizedError
from ..services.order_service import OrderService
from ..services.rate_limiter import FixedWindowRateLimiter
from ..services.sms import SmsSender


def get_sms_sender(request: Request) -> SmsSender:
    return request.app.state.sms_sender


def get_otp_rate_limiter(request: Request) -> OtpRateLimiter:
    return request.app.state.otp_rate_limiter


def get_delivery_service(request: Request) -> DeliveryService:
    return request.app.state.delivery_service


def get_ai_service(request: Request) -> AiService:
    return request.app.state.ai_service


def get_evotor_auth(request: Request) -> EvotorWebhookAuth:
    return request.app.state.evotor_auth


def get_evotor_service(request: Request) -> EvotorService:
    return request.app.state.evotor_service


def get_rate_limiter(request: Request) -> FixedWindowRateLimiter:
    return request.app.state.rate_limiter


def get_auth_service(
    db: Session = Depends(get_db),
    sms_sender: SmsSender = Depends(get_sms_sender),
    rate_limiter: OtpRateLimiter = Depends(get_otp_rate_limiter),
) -> AuthService:
    return AuthService(db=db, sms_sender=sms_sender, rate_limiter=rate_limiter)


def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(db=db)


def require_user(request: Request, response: Response, auth_service: AuthService = Depends(get_auth_service)) -> User:
    token = request.cookies.get(settings.session_cookie_name)
    user, rotated_token = auth_service.authenticate_session(token)
    if not user:
        raise UnauthorizedError()

    if rotated_token:
        response.set_cookie(
            settings.session_cookie_name,
            rotated_token,
            httponly=True,
            samesite='lax',
            secure=settings.cookie_secure,
            max_age=max(0, settings.session_ttl_ms // 1000),
            path='/',
        )
    return user


def require_evotor_webhook_auth(
    request: Request,
    auth: EvotorWebhookAuth = Depends(get_evotor_auth),
) -> None:
    if not auth.is_authorized(request.headers.get('authorization')):
        raise UnauthorizedError()
