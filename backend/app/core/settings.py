from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_DIR = BACKEND_DIR.parent

_ENV_KEY_RE = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')


def _load_env_file(path: Path) -> None:
    try:
        content = path.read_text(encoding='utf-8')
    except FileNotFoundError:
        return

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#'):
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


def _load_env() -> None:
    for base in (REPO_DIR, BACKEND_DIR):
        _load_env_file(base / '.env')


_load_env()


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


def _allowed_hosts() -> list[str]:
    raw = os.getenv('ALLOWED_HOSTS', '')
    hosts = [host.strip() for host in raw.split(',') if host.strip()]
    return hosts


def _default_database_url() -> str:
    db_path = (BACKEND_DIR / 'app.db').resolve()
    return f'sqlite:///{db_path.as_posix()}'


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv('DATABASE_URL', _default_database_url())

    cookie_secure: bool = _bool_env('COOKIE_SECURE', False)
    session_cookie_name: str = os.getenv('SESSION_COOKIE_NAME', 'obedi_session')
    session_ttl_ms: int = _int_env('SESSION_TTL_MS', 7 * 24 * 60 * 60 * 1000)
    session_rotate_after_ms: int = _int_env('SESSION_ROTATE_AFTER_MS', 24 * 60 * 60 * 1000)
    session_single_active: bool = _bool_env('SESSION_SINGLE_ACTIVE', False)
    session_cleanup_interval_ms: int = _int_env('SESSION_CLEANUP_INTERVAL_MS', 5 * 60 * 1000)

    otp_ttl_ms: int = _int_env('OTP_TTL_MS', 5 * 60 * 1000)
    otp_resend_cooldown_ms: int = _int_env('OTP_RESEND_COOLDOWN_MS', 30 * 1000)
    otp_max_attempts: int = _int_env('OTP_MAX_ATTEMPTS', 5)
    otp_max_requests_per_hour_phone: int = _int_env('OTP_MAX_REQUESTS_PER_HOUR_PHONE', 5)
    otp_max_requests_per_hour_ip: int = _int_env('OTP_MAX_REQUESTS_PER_HOUR_IP', 20)

    ai_max_requests_per_minute_ip: int = _int_env('AI_MAX_REQUESTS_PER_MINUTE_IP', 10)
    ai_max_requests_per_hour_ip: int = _int_env('AI_MAX_REQUESTS_PER_HOUR_IP', 60)

    delivery_max_requests_per_minute_ip: int = _int_env('DELIVERY_MAX_REQUESTS_PER_MINUTE_IP', 30)
    delivery_max_requests_per_hour_ip: int = _int_env('DELIVERY_MAX_REQUESTS_PER_HOUR_IP', 600)

    sms_provider: str = os.getenv('SMS_PROVIDER', 'console').strip().lower()
    sms_ru_api_id: str = os.getenv('SMS_RU_API_ID', '').strip()
    sms_sender: str = os.getenv('SMS_SENDER', 'ObediVL').strip()

    gemini_api_key: str = os.getenv('GEMINI_API_KEY', '').strip()

    delivery_zone_cache_ttl_ms: int = _int_env('DELIVERY_ZONE_CACHE_TTL_MS', 24 * 60 * 60 * 1000)
    nominatim_user_agent: str = os.getenv('NOMINATIM_USER_AGENT', 'obedi-vl/1.0 (server)').strip()
    delivery_geocoder_provider: str = os.getenv('DELIVERY_GEOCODER_PROVIDER', 'photon').strip().lower()
    nominatim_base_url: str = os.getenv('NOMINATIM_BASE_URL', 'https://nominatim.openstreetmap.org').strip().rstrip('/')
    photon_base_url: str = os.getenv('PHOTON_BASE_URL', 'https://photon.komoot.io').strip().rstrip('/')

    sqlite_busy_timeout_ms: int = _int_env('SQLITE_BUSY_TIMEOUT_MS', 5000)
    sqlite_journal_mode: str = os.getenv('SQLITE_JOURNAL_MODE', 'WAL').strip().upper()
    sqlite_foreign_keys: bool = _bool_env('SQLITE_FOREIGN_KEYS', True)

    trust_proxy_headers: bool = _bool_env('TRUST_PROXY_HEADERS', False)
    trusted_proxy_ips: str = os.getenv('TRUSTED_PROXY_IPS', '').strip()

    csrf_origin_check: bool = _bool_env('CSRF_ORIGIN_CHECK', True)

    cors_origins: list[str] = field(default_factory=_cors_origins)
    allowed_hosts: list[str] = field(default_factory=_allowed_hosts)


settings = Settings()
