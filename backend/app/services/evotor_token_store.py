from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


def _utc_iso_now() -> str:
    return datetime.utcnow().isoformat(timespec='milliseconds') + 'Z'


@dataclass(frozen=True)
class EvotorTokenRecord:
    token: str
    store_id: str
    store_uuid: str
    received_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            'token': self.token,
            'storeId': self.store_id,
            'storeUuid': self.store_uuid,
            'receivedAt': self.received_at,
        }


class EvotorTokenStore:
    def __init__(self, path: Path) -> None:
        self._path = path

    @property
    def path(self) -> Path:
        return self._path

    def read(self) -> dict[str, Any]:
        try:
            content = self._path.read_text(encoding='utf-8')
        except FileNotFoundError:
            return {'users': {}}

        try:
            data = json.loads(content)
        except Exception:
            return {'users': {}}

        if not isinstance(data, dict):
            return {'users': {}}

        users = data.get('users')
        if not isinstance(users, dict):
            users = {}

        return {**data, 'users': users}

    def write(self, data: dict[str, Any]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        normalized = json.dumps(data, ensure_ascii=False, indent=2).rstrip() + '\n'
        self._path.write_text(normalized, encoding='utf-8')

    def upsert_user_token(
        self,
        *,
        user_id: str | None,
        token: str,
        store_id: str = '',
        store_uuid: str = '',
    ) -> dict[str, Any]:
        normalized_user_id = (str(user_id or '').strip() or 'default').strip()
        normalized_token = str(token or '').strip()
        if not normalized_token:
            raise ValueError('token is required')

        store = self.read()
        users = store.get('users')
        if not isinstance(users, dict):
            users = {}
            store['users'] = users

        existing = users.get(normalized_user_id)
        existing_dict = existing if isinstance(existing, dict) else {}

        record = EvotorTokenRecord(
            token=normalized_token,
            store_id=str(store_id or existing_dict.get('storeId') or '').strip(),
            store_uuid=str(store_uuid or existing_dict.get('storeUuid') or '').strip(),
            received_at=_utc_iso_now(),
        ).to_dict()

        users[normalized_user_id] = {**existing_dict, **record}
        self.write(store)
        return users[normalized_user_id]

    def get_user_record(self, user_id: str) -> dict[str, Any] | None:
        store = self.read()
        users = store.get('users')
        if not isinstance(users, dict):
            return None
        record = users.get(user_id)
        return record if isinstance(record, dict) else None

