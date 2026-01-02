from __future__ import annotations

import base64
import json
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2


def _utc_iso_now() -> str:
    return datetime.utcnow().isoformat(timespec='milliseconds') + 'Z'


def _get_encryption_key() -> bytes:
    """Get or generate encryption key from environment"""
    key_str = os.getenv('EVOTOR_TOKEN_ENCRYPTION_KEY', '')
    if key_str:
        # Use provided key
        return base64.urlsafe_b64decode(key_str)

    # Generate key from password (less secure fallback)
    password = os.getenv('SECRET_KEY', 'default-secret-key-change-me').encode()
    salt = b'evotor-token-store-salt'  # Fixed salt for deterministic key
    kdf = PBKDF2(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    return base64.urlsafe_b64encode(kdf.derive(password))


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
        self._fernet = Fernet(_get_encryption_key())

    @property
    def path(self) -> Path:
        return self._path

    def _encrypt(self, data: dict[str, Any]) -> str:
        """Encrypt data dictionary to base64 string"""
        json_str = json.dumps(data, ensure_ascii=False)
        encrypted_bytes = self._fernet.encrypt(json_str.encode('utf-8'))
        return base64.b64encode(encrypted_bytes).decode('ascii')

    def _decrypt(self, encrypted_str: str) -> dict[str, Any]:
        """Decrypt base64 string to data dictionary"""
        encrypted_bytes = base64.b64decode(encrypted_str)
        decrypted_bytes = self._fernet.decrypt(encrypted_bytes)
        return json.loads(decrypted_bytes.decode('utf-8'))

    def read(self) -> dict[str, Any]:
        try:
            content = self._path.read_text(encoding='utf-8').strip()
        except FileNotFoundError:
            return {'users': {}}

        if not content:
            return {'users': {}}

        try:
            # Try to decrypt (new format)
            data = self._decrypt(content)
        except Exception:
            # Fallback to plain JSON (old format) - migrate on next write
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
        encrypted = self._encrypt(data)
        self._path.write_text(encrypted + '\n', encoding='utf-8')

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

