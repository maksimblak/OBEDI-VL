from __future__ import annotations

import base64
import hmac
import os
import re
from dataclasses import dataclass


def _timing_safe_equal_string(a: str, b: str) -> bool:
    if not isinstance(a, str) or not isinstance(b, str):
        return False
    return hmac.compare_digest(a, b)


@dataclass(frozen=True)
class BasicAuth:
    username: str
    password: str


class EvotorWebhookAuth:
    _basic_re = re.compile(r'^Basic\s+(.+)$', re.IGNORECASE)

    def _get_auth_token(self) -> str:
        return (os.getenv('EVOTOR_WEBHOOK_AUTH_TOKEN') or '').strip()

    def _get_basic_user(self) -> str:
        return (os.getenv('EVOTOR_WEBHOOK_BASIC_USER') or '').strip()

    def _get_basic_pass(self) -> str:
        return (os.getenv('EVOTOR_WEBHOOK_BASIC_PASS') or '').strip()

    def parse_basic_auth(self, authorization_header: str) -> BasicAuth | None:
        if not isinstance(authorization_header, str):
            return None
        header = authorization_header.strip()
        match = self._basic_re.match(header)
        if not match:
            return None

        encoded = match.group(1).strip()
        if not encoded:
            return None

        try:
            decoded = base64.b64decode(encoded).decode('utf-8')
        except Exception:
            return None

        if ':' not in decoded:
            return None

        username, password = decoded.split(':', 1)
        return BasicAuth(username=username, password=password)

    def is_authorized(self, authorization_header: str | None) -> bool:
        header = authorization_header.strip() if isinstance(authorization_header, str) else ''

        basic_user = self._get_basic_user()
        basic_pass = self._get_basic_pass()
        basic_configured = bool(basic_user or basic_pass)
        basic_ready = bool(basic_user and basic_pass)
        wants_basic = header.lower().startswith('basic ')

        if wants_basic:
            if basic_configured and not basic_ready:
                return False
            if not basic_ready:
                return False

            parsed = self.parse_basic_auth(header)
            if not parsed:
                return False

            if not _timing_safe_equal_string(parsed.username, basic_user):
                return False
            if not _timing_safe_equal_string(parsed.password, basic_pass):
                return False
            return True

        expected = self._get_auth_token()
        if not expected:
            if not basic_configured:
                return True
            return False

        variants = {expected, f'Bearer {expected}'}
        if expected.lower().startswith('bearer '):
            variants.add(expected[len('bearer ') :])

        return any(_timing_safe_equal_string(header, candidate) for candidate in variants)

