from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy.orm import Session

from ..core.settings import settings
from ..db.models import User
from ..repositories.otp_codes import OtpCodeRepository
from ..repositories.sessions import SessionRepository
from ..repositories.users import UserRepository
from ..utils.phone import normalize_phone
from ..utils.security import random_otp_code, random_session_token, sha256_hex, timing_safe_equal_hex
from ..utils.time import utc_now
from .errors import (
    InvalidCodeError,
    InvalidInputError,
    InvalidNameError,
    InvalidPhoneError,
    SmsSendError,
    TooManyAttemptsError,
    TooManyRequestsError,
)
from .sms import SmsSender


@dataclass
class _PhoneRate:
    count: int
    reset_at_ms: int
    last_sent_at_ms: int


@dataclass
class _IpRate:
    count: int
    reset_at_ms: int


class OtpRateLimiter:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._rate_by_phone: dict[str, _PhoneRate] = {}
        self._rate_by_ip: dict[str, _IpRate] = {}

    def consume(self, *, phone: str, ip: str, now_ms: int) -> None:
        with self._lock:
            phone_rate = self._rate_by_phone.get(phone) or _PhoneRate(
                count=0, reset_at_ms=now_ms + 60 * 60 * 1000, last_sent_at_ms=0
            )
            if now_ms > phone_rate.reset_at_ms:
                phone_rate.count = 0
                phone_rate.reset_at_ms = now_ms + 60 * 60 * 1000

            ip_rate = self._rate_by_ip.get(ip) or _IpRate(count=0, reset_at_ms=now_ms + 60 * 60 * 1000)
            if now_ms > ip_rate.reset_at_ms:
                ip_rate.count = 0
                ip_rate.reset_at_ms = now_ms + 60 * 60 * 1000

            cooldown_left = settings.otp_resend_cooldown_ms - (now_ms - phone_rate.last_sent_at_ms)
            if cooldown_left > 0:
                raise TooManyRequestsError(retry_after_ms=cooldown_left)

            if (
                phone_rate.count >= settings.otp_max_requests_per_hour_phone
                or ip_rate.count >= settings.otp_max_requests_per_hour_ip
            ):
                raise TooManyRequestsError()

            phone_rate.count += 1
            phone_rate.last_sent_at_ms = now_ms
            self._rate_by_phone[phone] = phone_rate

            ip_rate.count += 1
            self._rate_by_ip[ip] = ip_rate


class AuthService:
    def __init__(self, *, db: Session, sms_sender: SmsSender, rate_limiter: OtpRateLimiter) -> None:
        self._db = db
        self._sms_sender = sms_sender
        self._rate_limiter = rate_limiter
        self._users = UserRepository(db)
        self._sessions = SessionRepository(db)
        self._otp_codes = OtpCodeRepository(db)

    def request_otp(self, phone_raw: str, *, client_ip: str) -> None:
        phone = normalize_phone(phone_raw)
        if not phone:
            raise InvalidPhoneError()

        now_ms = int(time.time() * 1000)
        self._rate_limiter.consume(phone=phone, ip=client_ip, now_ms=now_ms)

        code = random_otp_code()
        code_hash = sha256_hex(f'{phone}:{code}')

        created_at = utc_now()
        expires_at = created_at + timedelta(milliseconds=settings.otp_ttl_ms)

        self._otp_codes.upsert(
            phone,
            code_hash=code_hash,
            created_at=created_at,
            expires_at=expires_at,
            attempts_left=settings.otp_max_attempts,
        )
        self._db.commit()

        try:
            self._sms_sender.send_otp(phone, code)
        except Exception as exc:
            raise SmsSendError() from exc

    def verify_otp(self, phone_raw: str, code_raw: str) -> tuple[User, str]:
        phone = normalize_phone(phone_raw)
        code = ''.join(ch for ch in code_raw if ch.isdigit())[:6] if isinstance(code_raw, str) else ''

        if not phone or len(code) != 6:
            raise InvalidInputError()

        record = self._otp_codes.get(phone)
        now = utc_now()

        if not record or now > record.expires_at:
            if record:
                self._otp_codes.delete(phone)
                self._db.commit()
            raise InvalidCodeError()

        if record.attempts_left <= 0:
            raise TooManyAttemptsError()

        incoming_hash = sha256_hex(f'{phone}:{code}')
        ok = timing_safe_equal_hex(incoming_hash, record.code_hash)
        if not ok:
            record.attempts_left -= 1
            self._db.commit()
            raise InvalidCodeError()

        self._otp_codes.delete(phone)

        user = self._users.get_or_create_guest(phone, now=now)
        if settings.session_single_active:
            self._sessions.delete_for_user(user_id=user.id)
        token = random_session_token()
        expires_at = now + timedelta(milliseconds=settings.session_ttl_ms)
        self._sessions.create(token=token, user_id=user.id, created_at=now, expires_at=expires_at)

        self._db.commit()
        self._db.refresh(user)
        return user, token

    def authenticate_session(self, token: str | None) -> tuple[User | None, str | None]:
        if not token:
            return None, None

        session = self._sessions.get(token)
        if not session:
            return None, None

        now = utc_now()
        if now > session.expires_at:
            self._sessions.delete(token)
            self._db.commit()
            return None, None

        user = self._users.get_by_id(session.user_id)
        if not user:
            self._sessions.delete(token)
            self._db.commit()
            return None, None

        rotate_after_ms = settings.session_rotate_after_ms
        if rotate_after_ms > 0:
            age_ms = int((now - session.created_at).total_seconds() * 1000)
            if age_ms >= rotate_after_ms:
                new_token = random_session_token()
                expires_at = now + timedelta(milliseconds=settings.session_ttl_ms)
                self._sessions.create(token=new_token, user_id=session.user_id, created_at=now, expires_at=expires_at)
                self._sessions.delete(token)
                self._db.commit()
                return user, new_token

        return user, None

    def get_user_by_session_token(self, token: str | None) -> User | None:
        user, _rotated = self.authenticate_session(token)
        return user

    def logout(self, token: str | None) -> None:
        if not token:
            return
        self._sessions.delete(token)
        self._db.commit()

    def update_profile(self, user: User, *, name_raw: str) -> User:
        name = name_raw.strip() if isinstance(name_raw, str) else ''
        if not name or len(name) > 50:
            raise InvalidNameError()

        user.name = name
        self._db.commit()
        self._db.refresh(user)
        return user
