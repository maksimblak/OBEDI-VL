from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timezone

from fastapi import Request


def utc_now() -> datetime:
  return datetime.now(timezone.utc)


def isoformat_z(value: datetime) -> str:
  dt = value
  if dt.tzinfo is None:
    dt = dt.replace(tzinfo=timezone.utc)
  dt = dt.astimezone(timezone.utc)
  return dt.isoformat().replace('+00:00', 'Z')


def normalize_phone(raw: object) -> str | None:
  if not isinstance(raw, str):
    return None

  digits = ''.join(ch for ch in raw if ch.isdigit())
  if len(digits) == 0:
    return None

  if len(digits) == 10:
    return f'+7{digits}'

  if len(digits) == 11 and (digits.startswith('8') or digits.startswith('7')):
    return f'+7{digits[1:]}'

  if 11 <= len(digits) <= 15:
    return f'+{digits}'

  return None


def sha256_hex(value: str) -> str:
  return hashlib.sha256(value.encode('utf-8')).hexdigest()


def timing_safe_equal_hex(a_hex: str, b_hex: str) -> bool:
  if not isinstance(a_hex, str) or not isinstance(b_hex, str):
    return False
  if len(a_hex) != len(b_hex):
    return False
  return hmac.compare_digest(a_hex, b_hex)


def random_otp_code() -> str:
  return str(secrets.randbelow(1_000_000)).zfill(6)


def random_session_token() -> str:
  token = secrets.token_bytes(32)
  return base64.urlsafe_b64encode(token).rstrip(b'=').decode('ascii')


def get_client_ip(request: Request) -> str:
  forwarded = request.headers.get('x-forwarded-for')
  if forwarded:
    return forwarded.split(',')[0].strip()
  return request.client.host if request.client else 'unknown'

