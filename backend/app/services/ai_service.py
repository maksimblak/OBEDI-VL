from __future__ import annotations

import json
import os
import re
from typing import Any

from .errors import ServiceError
from .gemini_client import GeminiClient

MODEL_DEFAULT = 'gemini-2.5-flash'

_REC_TAG_RE = re.compile(r'\|\|REC_ID:.*?\|\|')

BASE_INSTRUCTION = """
You are "Chef Alex", the AI culinary assistant for "Obedi VL", a premium food delivery service in Vladivostok.
Your tone is warm, appetizing, and helpful. You speak Russian.

RULES:
1. Use the provided MENU CONTEXT to answer questions. Do not invent dishes.
2. If the user asks for a recommendation or specific dish that exists in the menu, you MUST append a hidden tag at the very end of your response: "||REC_ID:item_id||".
3. Only tag ONE item per response (the most relevant one).
4. Keep text responses concise (under 50 words).
5. Suggest specific items based on their ingredients (calories, protein, etc).

MENU CONTEXT:
""".strip()


def _api_key() -> str:
    return (os.getenv('GEMINI_API_KEY') or '').strip()


def _normalize_zone_result(input_value: Any) -> dict[str, Any]:
    fallback = {'found': False, 'formattedAddress': '', 'distance': 0, 'zone': None}
    if not isinstance(input_value, dict):
        return fallback

    found = input_value.get('found')
    formatted_address = input_value.get('formattedAddress')
    distance_raw = input_value.get('distance')
    zone_raw = input_value.get('zone')

    found_bool = bool(found) if isinstance(found, bool) else False
    formatted = formatted_address if isinstance(formatted_address, str) else ''

    try:
        distance_num = float(distance_raw)
    except (TypeError, ValueError):
        distance_num = 0.0

    distance = max(0.0, round(distance_num * 10) / 10)
    zone_from_distance = 'green' if distance <= 4 else 'yellow' if distance <= 8 else 'red' if distance <= 15 else None

    if not found_bool:
        return {'found': False, 'formattedAddress': formatted, 'distance': 0, 'zone': None}

    zone = zone_raw if zone_raw in ('green', 'yellow', 'red') else zone_from_distance
    return {'found': True, 'formattedAddress': formatted, 'distance': distance, 'zone': zone}


class AiService:
    def __init__(self, *, user_agent: str = 'obedi-vl/1.0 (server)') -> None:
        self._user_agent = user_agent

    def _client(self) -> GeminiClient:
        key = _api_key()
        if not key:
            raise ServiceError('GEMINI_API_KEY is not configured', 501)
        return GeminiClient(api_key=key, user_agent=self._user_agent)

    def recommendation(self, *, message: str, history: list[dict[str, Any]], menu_items: list[dict[str, Any]]) -> str:
        if not isinstance(message, str) or not message.strip():
            raise ServiceError('message is required', 400)

        sanitized_history: list[dict[str, Any]] = []
        for raw in (history or [])[-20:]:
            if not isinstance(raw, dict):
                continue
            role = 'user' if raw.get('role') == 'user' else 'model'
            text = str(raw.get('text') or '')
            text = _REC_TAG_RE.sub('', text)
            if not text.strip():
                continue
            sanitized_history.append({'role': role, 'parts': [{'text': text}]})

        menu_context_lines: list[str] = []
        for item in (menu_items or [])[:300]:
            if not isinstance(item, dict):
                continue
            item_id = str(item.get('id') or '')
            title = str(item.get('title') or '')
            try:
                price = float(item.get('price') or 0)
            except (TypeError, ValueError):
                price = 0.0
            try:
                calories = float(item.get('calories') or 0)
            except (TypeError, ValueError):
                calories = 0.0
            category = str(item.get('category') or '')
            description = str(item.get('description') or '')[:160]
            menu_context_lines.append(
                f'ID:{item_id} | {title} | {price}₽ | {calories}kcal | Tags: {category} | Ingred: {description}'
            )

        system_instruction = f'{BASE_INSTRUCTION}\n' + '\n'.join(menu_context_lines)
        contents = sanitized_history + [{'role': 'user', 'parts': [{'text': message}]}]

        return self._client().generate_content(
            model=MODEL_DEFAULT,
            contents=contents,
            system_instruction=system_instruction,
            generation_config={'temperature': 0.4},
        )

    def address_zone(self, *, address: str) -> dict[str, Any]:
        if not isinstance(address, str) or not address.strip():
            return {'found': False, 'formattedAddress': '', 'distance': 0, 'zone': None}

        prompt = f"""
You are the logistics engine for "Obedi VL" in Vladivostok.
Our Kitchen is at: Ulitsa Nadibaidze 28, Vladivostok.

Delivery Zones (Driving Distance):
- Green Zone: 0 - 4 km
- Yellow Zone: 4 - 8 km
- Red Zone: 8 - 15 km
- No Delivery: > 15 km

User Address Input: "{address}"

Rules:
1. If you are not confident the address exists in Vladivostok, return found=false, zone=null, distance=0.
2. Zone must be derived only from the distance thresholds above.
3. Return strictly valid JSON only.

Return:
{{
  "found": boolean,
  "formattedAddress": string,
  "distance": number,
  "zone": "green" | "yellow" | "red" | null
}}
""".strip()

        text = self._client().generate_content(
            model=MODEL_DEFAULT,
            contents=[{'role': 'user', 'parts': [{'text': prompt}]}],
            generation_config={'temperature': 0, 'responseMimeType': 'application/json'},
        )

        try:
            parsed = json.loads(text)
        except Exception:
            return {'found': False, 'formattedAddress': '', 'distance': 0, 'zone': None}

        return _normalize_zone_result(parsed)

