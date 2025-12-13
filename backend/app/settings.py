from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]

_ENV_KEY_RE = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')


def _load_env_file(path: Path) -> None:
  try:
    content = path.read_text(encoding='utf-8')
  except FileNotFoundError:
    return

  for raw_line in content.splitlines():
    line = raw_line.strip()
    if not line:
      continue
    if line.startswith('#'):
      continue
    if '=' not in line:
      continue

    key, value = line.split('=', 1)
    key = key.strip()
    if not _ENV_KEY_RE.match(key):
      continue

    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
      value = value[1:-1]

    os.environ.setdefault(key, value)


_load_env_file(ROOT_DIR / '.env.local')
_load_env_file(ROOT_DIR / '.env')


def _bool_env(name: str, default: bool = False) -> bool:
  raw = os.getenv(name)
  if raw is None:
    return default
  return raw.strip().lower() == 'true'


def _int_env(name: str, default: int) -> int:
  raw = os.getenv(name)
  if raw is None:
    return default
  try:
    return int(raw)
  except ValueError:
    return default


def _cors_origins() -> list[str]:
  raw = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
  return [origin.strip() for origin in raw.split(',') if origin.strip()]


@dataclass(frozen=True)
class Settings:
  database_url: str = os.getenv('DATABASE_URL', 'sqlite:///./backend/app.db')

  cookie_secure: bool = _bool_env('COOKIE_SECURE', False)
  session_cookie_name: str = os.getenv('SESSION_COOKIE_NAME', 'obedi_session')
  session_ttl_ms: int = _int_env('SESSION_TTL_MS', 7 * 24 * 60 * 60 * 1000)

  otp_ttl_ms: int = _int_env('OTP_TTL_MS', 5 * 60 * 1000)
  otp_resend_cooldown_ms: int = _int_env('OTP_RESEND_COOLDOWN_MS', 30 * 1000)
  otp_max_attempts: int = _int_env('OTP_MAX_ATTEMPTS', 5)
  otp_max_requests_per_hour_phone: int = _int_env('OTP_MAX_REQUESTS_PER_HOUR_PHONE', 5)
  otp_max_requests_per_hour_ip: int = _int_env('OTP_MAX_REQUESTS_PER_HOUR_IP', 20)

  sms_provider: str = os.getenv('SMS_PROVIDER', 'console').strip().lower()
  sms_ru_api_id: str = os.getenv('SMS_RU_API_ID', '').strip()
  sms_sender: str = os.getenv('SMS_SENDER', 'ObediVL').strip()

  gemini_api_key: str = os.getenv('GEMINI_API_KEY', '').strip()

  cors_origins: list[str] = field(default_factory=_cors_origins)


settings = Settings()
