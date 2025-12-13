from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.settings import settings
from ..db.models import User
from ..services.auth_service import AuthService, OtpRateLimiter
from ..services.delivery_service import DeliveryService
from ..services.errors import UnauthorizedError
from ..services.order_service import OrderService
from ..services.sms import SmsSender


def get_sms_sender(request: Request) -> SmsSender:
    return request.app.state.sms_sender


def get_otp_rate_limiter(request: Request) -> OtpRateLimiter:
    return request.app.state.otp_rate_limiter


def get_delivery_service(request: Request) -> DeliveryService:
    return request.app.state.delivery_service


def get_auth_service(
    db: Session = Depends(get_db),
    sms_sender: SmsSender = Depends(get_sms_sender),
    rate_limiter: OtpRateLimiter = Depends(get_otp_rate_limiter),
) -> AuthService:
    return AuthService(db=db, sms_sender=sms_sender, rate_limiter=rate_limiter)


def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(db=db)


def require_user(request: Request, auth_service: AuthService = Depends(get_auth_service)) -> User:
    token = request.cookies.get(settings.session_cookie_name)
    user = auth_service.get_user_by_session_token(token)
    if not user:
        raise UnauthorizedError()
    return user

