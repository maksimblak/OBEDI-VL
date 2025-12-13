from __future__ import annotations

import base64
import hashlib
import hmac
import secrets


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

