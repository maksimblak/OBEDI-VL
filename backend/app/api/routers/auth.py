from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response

from ...core.settings import settings
from ...db.models import User
from ...services.auth_service import AuthService
from ...utils.network import get_client_ip
from ...utils.time import isoformat_z
from ..deps import get_auth_service, require_user
from ..schemas import ProfilePatchIn, RequestOtpIn, VerifyOtpIn

router = APIRouter(prefix='/auth')


def _serialize_user(user: User) -> dict[str, object]:
    return {
        'id': user.id,
        'phone': user.phone,
        'name': user.name,
        'loyaltyPoints': user.loyalty_points,
        'joinedDate': isoformat_z(user.joined_date),
    }


@router.get('/me')
def me(request: Request, response: Response, auth_service: AuthService = Depends(get_auth_service)) -> dict[str, object]:
    token = request.cookies.get(settings.session_cookie_name)
    user, rotated_token = auth_service.authenticate_session(token)
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
    return {'user': _serialize_user(user) if user else None}


@router.post('/logout')
def logout(request: Request, response: Response, auth_service: AuthService = Depends(get_auth_service)) -> dict[str, object]:
    token = request.cookies.get(settings.session_cookie_name)
    auth_service.logout(token)
    response.delete_cookie(
        settings.session_cookie_name,
        path='/',
        secure=settings.cookie_secure,
        httponly=True,
        samesite='lax',
    )
    return {'ok': True}


@router.post('/request-otp')
def request_otp(payload: RequestOtpIn, request: Request, auth_service: AuthService = Depends(get_auth_service)) -> dict[str, object]:
    auth_service.request_otp(payload.phone, client_ip=get_client_ip(request))
    return {'ok': True}


@router.post('/verify-otp')
def verify_otp(payload: VerifyOtpIn, response: Response, auth_service: AuthService = Depends(get_auth_service)) -> dict[str, object]:
    user, token = auth_service.verify_otp(payload.phone, payload.code)
    response.set_cookie(
        settings.session_cookie_name,
        token,
        httponly=True,
        samesite='lax',
        secure=settings.cookie_secure,
        max_age=max(0, settings.session_ttl_ms // 1000),
        path='/',
    )
    return {'user': _serialize_user(user)}


@router.patch('/profile')
def profile(
    payload: ProfilePatchIn,
    user: User = Depends(require_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, object]:
    updated = auth_service.update_profile(user, name_raw=payload.name)
    return {'user': _serialize_user(updated)}
