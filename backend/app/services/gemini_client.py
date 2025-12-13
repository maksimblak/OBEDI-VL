from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


class GeminiClient:
    def __init__(self, *, api_key: str, timeout_sec: int = 12, user_agent: str = 'obedi-vl/1.0 (server)') -> None:
        self._api_key = api_key.strip()
        self._timeout_sec = timeout_sec
        self._user_agent = user_agent

    def _url(self, model: str) -> str:
        encoded_key = urllib.parse.quote(self._api_key, safe='')
        encoded_model = urllib.parse.quote(model, safe='-._')
        return f'https://generativelanguage.googleapis.com/v1beta/models/{encoded_model}:generateContent?key={encoded_key}'

    def generate_content(
        self,
        *,
        model: str,
        contents: list[dict[str, Any]],
        system_instruction: str | None = None,
        generation_config: dict[str, Any] | None = None,
    ) -> str:
        if not self._api_key:
            raise RuntimeError('GEMINI_API_KEY is not configured')

        payload: dict[str, Any] = {'contents': contents}
        if isinstance(system_instruction, str) and system_instruction.strip():
            payload['systemInstruction'] = {'parts': [{'text': system_instruction.strip()}]}
        if isinstance(generation_config, dict) and generation_config:
            payload['generationConfig'] = generation_config

        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        request = urllib.request.Request(
            self._url(model),
            data=body,
            method='POST',
            headers={
                'Content-Type': 'application/json',
                'User-Agent': self._user_agent,
            },
        )

        try:
            with urllib.request.urlopen(request, timeout=self._timeout_sec) as response:
                raw = response.read().decode('utf-8', errors='replace')
        except urllib.error.HTTPError as error:
            raw = error.read().decode('utf-8', errors='replace')
            raise RuntimeError(f'Gemini request failed ({error.code}): {raw[:300]}') from error

        try:
            data = json.loads(raw) if raw else {}
        except Exception as exc:
            raise RuntimeError('Gemini returned invalid JSON') from exc

        candidates = data.get('candidates')
        if not isinstance(candidates, list) or not candidates:
            return ''

        first = candidates[0] if isinstance(candidates[0], dict) else {}
        content = first.get('content') if isinstance(first, dict) else None
        if not isinstance(content, dict):
            return ''

        parts = content.get('parts')
        if isinstance(parts, list) and parts:
            part0 = parts[0] if isinstance(parts[0], dict) else {}
            text = part0.get('text')
            return text if isinstance(text, str) else ''

        return ''

