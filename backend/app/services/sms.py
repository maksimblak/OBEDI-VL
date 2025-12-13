from __future__ import annotations

import json
import urllib.parse
import urllib.request
from typing import Protocol

from ..core.settings import Settings


class SmsSender(Protocol):
    def send_otp(self, phone: str, code: str) -> None: ...


class ConsoleSmsSender:
    def send_otp(self, phone: str, code: str) -> None:
        print(f'[OTP][console] {phone}: {code}')


class SmsRuSender:
    def __init__(self, *, api_id: str, sender: str, user_agent: str) -> None:
        self._api_id = api_id
        self._sender = sender
        self._user_agent = user_agent

    def send_otp(self, phone: str, code: str) -> None:
        text = f'Obedi VL: код {code}. Никому не сообщайте.'
        params = urllib.parse.urlencode(
            {
                'api_id': self._api_id,
                'to': ''.join(ch for ch in phone if ch.isdigit()),
                'msg': text,
                'json': '1',
                'from': self._sender,
            }
        )
        url = f'https://sms.ru/sms/send?{params}'
        request = urllib.request.Request(url, headers={'User-Agent': self._user_agent})
        with urllib.request.urlopen(request, timeout=8) as response:
            payload = response.read().decode('utf-8', errors='replace')
            data = json.loads(payload or '{}')
            if data.get('status') != 'OK':
                raise RuntimeError(f'SMS.RU error: {payload}')


def create_sms_sender(settings: Settings) -> SmsSender:
    if settings.sms_provider == 'console':
        return ConsoleSmsSender()

    if settings.sms_provider == 'smsru':
        if not settings.sms_ru_api_id:
            raise RuntimeError('SMS_RU_API_ID is not configured')
        return SmsRuSender(
            api_id=settings.sms_ru_api_id,
            sender=settings.sms_sender,
            user_agent='obedi-vl/1.0 (server)',
        )

    raise RuntimeError(f'Unknown SMS_PROVIDER: {settings.sms_provider}')

