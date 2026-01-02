from __future__ import annotations

import hashlib
import logging
import os
from pathlib import Path
from typing import Any

from ..core.settings import REPO_DIR
from ..utils.cache import SimpleCache
from ..utils.envfile import upsert_env_var
from .evotor_auth import EvotorWebhookAuth
from .evotor_client import EvotorClient, EvotorCloudToken
from .evotor_token_store import EvotorTokenStore

logger = logging.getLogger(__name__)

FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop'


def _get_env_local_path() -> Path:
    return REPO_DIR / '.env'


def _get_evotor_token_store_path() -> Path:
    raw = (os.getenv('EVOTOR_TOKEN_STORE_PATH') or '').strip()
    if raw:
        path = Path(raw)
        return path if path.is_absolute() else (REPO_DIR / path)
    return REPO_DIR / '.evotor' / 'tokens.json'


def _get_evotor_cloud_token_env() -> str:
    return (os.getenv('EVOTOR_CLOUD_TOKEN') or os.getenv('EVOTOR_TOKEN') or '').strip()


def _get_evotor_store_uuid_env() -> str:
    return (os.getenv('STORE_UUID') or '').strip()


def _get_evotor_store_id_env() -> str:
    return (os.getenv('EVOTOR_STORE_ID') or '').strip()


def _hash_string(value: str) -> int:
    digest = hashlib.sha256(value.encode('utf-8')).digest()
    return int.from_bytes(digest[:4], 'big', signed=False)


def _stable_range(seed: int, min_value: int, max_exclusive: int) -> int:
    span = max(1, max_exclusive - min_value)
    return min_value + (seed % span)


def _map_evotor_to_menu_item(product: dict[str, Any]) -> dict[str, Any]:
    name = str(product.get('name') or '')
    name_lower = name.lower()

    category = 'lunch'
    if any(word in name_lower for word in ('напит', 'вода', 'сок', 'чай', 'кофе', 'соус', 'десерт', 'снэк')):
        category = 'extras'
    if 'пирог' in name_lower or 'пирож' in name_lower:
        category = 'pies'

    description = str(product.get('description') or '').strip()
    if not description:
        description = 'Блюдо из меню Obedi VL.'

    price = float(product.get('price') or 0)
    measure = str(product.get('measure_name') or '').strip().lower()
    weight = '1000г' if measure == 'кг' else (measure or 'порция')

    seed = _hash_string(str(product.get('uuid') or name or ''))

    return {
        'id': str(product.get('uuid') or ''),
        'title': name,
        'description': description,
        'price': price,
        'weight': weight,
        'image': FALLBACK_IMAGE,
        'category': category,
        'calories': _stable_range(seed, 200, 600),
        'protein': _stable_range(seed >> 1, 0, 30),
        'fats': _stable_range(seed >> 2, 0, 30),
        'carbs': _stable_range(seed >> 3, 0, 60),
        'availableDays': [1, 2, 3, 4, 5, 6, 0],
    }


class EvotorService:
    def __init__(
        self,
        *,
        auth: EvotorWebhookAuth,
        token_store: EvotorTokenStore,
        client: EvotorClient,
        env_local_path: Path | None = None,
        cache_ttl_ms: int = 5 * 60 * 1000,  # 5 minutes default
    ) -> None:
        self._auth = auth
        self._token_store = token_store
        self._client = client
        self._env_local_path = env_local_path or _get_env_local_path()
        self._cache = SimpleCache(ttl_ms=cache_ttl_ms)

    @classmethod
    def create_default(cls) -> 'EvotorService':
        return cls(
            auth=EvotorWebhookAuth(),
            token_store=EvotorTokenStore(_get_evotor_token_store_path()),
            client=EvotorClient(),
        )

    def is_webhook_authorized(self, authorization_header: str | None) -> bool:
        return self._auth.is_authorized(authorization_header)

    def normalize_webhook_payload(self, body: Any) -> tuple[str, str]:
        payload = body if isinstance(body, dict) else {}

        user_id_candidates = [
            payload.get('userId'),
            payload.get('user_id'),
            payload.get('userUUID'),
            payload.get('userUuid'),
            payload.get('ownerId'),
        ]
        token_candidates = [
            payload.get('token'),
            payload.get('cloudToken'),
            payload.get('appToken'),
            payload.get('applicationToken'),
        ]

        user_id = next((v for v in user_id_candidates if isinstance(v, str) and v.strip()), '')
        token = next((v for v in token_candidates if isinstance(v, str) and v.strip()), '')
        return (user_id.strip() if isinstance(user_id, str) else '', token.strip() if isinstance(token, str) else '')

    def resolve_cloud_token(self, query_user_id: str | None) -> EvotorCloudToken:
        user_id = str(query_user_id or '').strip()
        if user_id:
            record = self._token_store.get_user_record(user_id) or {}
            token = str(record.get('token') or '').strip()
            source = f'tokenStore:{user_id}'
            return EvotorCloudToken(token=token, source=source)

        env_token = _get_evotor_cloud_token_env()
        if env_token:
            source = 'env:EVOTOR_CLOUD_TOKEN' if (os.getenv('EVOTOR_CLOUD_TOKEN') or '').strip() else 'env:EVOTOR_TOKEN'
            return EvotorCloudToken(token=env_token, source=source)

        return EvotorCloudToken(token='', source='none')

    def handle_user_token_webhook(self, *, authorization: str | None, body: Any) -> dict[str, Any]:
        if not self.is_webhook_authorized(authorization):
            return {'error': 'Unauthorized', '_status': 401}

        user_id, token = self.normalize_webhook_payload(body)
        if not token:
            return {'error': 'token is required', '_status': 400}

        self._token_store.upsert_user_token(user_id=user_id, token=token)

        os.environ['EVOTOR_CLOUD_TOKEN'] = token
        upsert_env_var(self._env_local_path, 'EVOTOR_CLOUD_TOKEN', token)

        legacy_token = (os.getenv('EVOTOR_TOKEN') or '').strip()
        if not legacy_token:
            os.environ['EVOTOR_TOKEN'] = token
            upsert_env_var(self._env_local_path, 'EVOTOR_TOKEN', token)

        store_uuid = _get_evotor_store_uuid_env()
        store_id = _get_evotor_store_id_env()

        if not store_uuid or not store_id:
            try:
                stores = self._client.fetch_cloud_stores(token)
                if len(stores) == 1:
                    only = stores[0] or {}
                    if not store_id and isinstance(only.get('id'), (str, int)):
                        store_id = str(only.get('id')).strip()
                        if store_id:
                            os.environ['EVOTOR_STORE_ID'] = store_id
                            upsert_env_var(self._env_local_path, 'EVOTOR_STORE_ID', store_id)
                    if not store_uuid and isinstance(only.get('uuid'), str) and only.get('uuid').strip():
                        store_uuid = str(only.get('uuid')).strip()
                        os.environ['STORE_UUID'] = store_uuid
                        upsert_env_var(self._env_local_path, 'STORE_UUID', store_uuid)
            except Exception as error:
                try:
                    stores = self._client.fetch_v1_stores(token)
                    if not store_uuid and len(stores) == 1 and stores[0].get('uuid'):
                        store_uuid = str(stores[0].get('uuid')).strip()
                        if store_uuid:
                            os.environ['STORE_UUID'] = store_uuid
                            upsert_env_var(self._env_local_path, 'STORE_UUID', store_uuid)
                except Exception as fallback_error:
                    logger.exception('Evotor store auto-detect failed: %s', error)
                    logger.exception('Evotor store auto-detect fallback failed: %s', fallback_error)

        if store_uuid or store_id:
            self._token_store.upsert_user_token(user_id=user_id, token=token, store_id=store_id, store_uuid=store_uuid)

        # Invalidate cache when new token is received
        self._cache.clear()

        return {
            'ok': True,
            'userId': user_id or None,
            'storeId': store_id or None,
            'storeUuid': store_uuid or None,
        }

    def token_status(self, query_user_id: str | None) -> dict[str, Any]:
        resolved = self.resolve_cloud_token(query_user_id)
        env_token = _get_evotor_cloud_token_env()
        env_store_id = _get_evotor_store_id_env()
        env_store_uuid = _get_evotor_store_uuid_env()

        env_token_hash = hashlib.sha256(env_token.encode('utf-8')).hexdigest() if env_token else ''

        store = self._token_store.read()
        users = store.get('users') if isinstance(store, dict) else {}
        users_list: list[dict[str, Any]] = []

        if isinstance(users, dict):
            for user_id, record in users.items():
                rec = record if isinstance(record, dict) else {}
                token = str(rec.get('token') or '').strip()
                token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest() if token else ''
                users_list.append(
                    {
                        'userId': user_id,
                        'receivedAt': rec.get('receivedAt') if isinstance(rec.get('receivedAt'), str) else None,
                        'hasToken': bool(token),
                        'tokenSha256Prefix': token_hash[:10] if token_hash else None,
                        'storeId': str(rec.get('storeId') or ''),
                        'storeUuid': str(rec.get('storeUuid') or ''),
                    }
                )

        try:
            rel_path = str(self._token_store.path.relative_to(REPO_DIR))
        except Exception:
            rel_path = str(self._token_store.path)

        return {
            'ok': True,
            'env': {
                'evotorCloudTokenConfigured': bool(env_token),
                'evotorCloudTokenSource': resolved.source,
                'evotorCloudTokenSha256Prefix': env_token_hash[:10] if env_token_hash else None,
                'evotorStoreId': env_store_id or None,
                'storeUuid': env_store_uuid or None,
            },
            'tokenStore': {
                'path': rel_path,
                'users': users_list,
            },
        }

    def list_stores(self) -> list[dict[str, str]]:
        token = _get_evotor_cloud_token_env()
        if not token:
            raise ValueError('EVOTOR_CLOUD_TOKEN is not configured')

        cache_key = 'stores:v1:all'

        def fetch_stores() -> list[dict[str, str]]:
            stores = self._client.fetch_v1_stores(token)
            normalized: list[dict[str, str]] = []
            for store in stores:
                uuid = str(store.get('uuid') or '').strip()
                name = str(store.get('name') or '').strip()
                if uuid:
                    normalized.append({'uuid': uuid, 'name': name})
            return normalized

        return self._cache.cached(cache_key, fetch_stores)

    def set_store_uuid(self, store_uuid: str) -> str:
        normalized = str(store_uuid or '').strip()
        if not normalized:
            raise ValueError('storeUuid is required')

        os.environ['STORE_UUID'] = normalized
        upsert_env_var(self._env_local_path, 'STORE_UUID', normalized)
        return normalized

    def cloud_stores(self, query_user_id: str | None) -> tuple[list[dict[str, Any]], str]:
        resolved = self.resolve_cloud_token(query_user_id)
        if not resolved.token:
            raise ValueError('Evotor cloud token is not configured')

        cache_key = f'stores:cloud:{resolved.source}'

        def fetch_stores() -> list[dict[str, Any]]:
            return self._client.fetch_cloud_stores(resolved.token)

        stores = self._cache.cached(cache_key, fetch_stores)
        return stores, resolved.source

    def cloud_products(
        self,
        *,
        query_user_id: str | None,
        store_id: str,
        cursor: str | None,
        since: str | int | None,
    ) -> tuple[Any, str]:
        resolved = self.resolve_cloud_token(query_user_id)
        if not resolved.token:
            raise ValueError('Evotor cloud token is not configured')
        return (
            self._client.fetch_cloud_products(resolved.token, store_id, cursor=cursor, since=since),
            resolved.source,
        )

    def products_menu_items(self) -> list[dict[str, Any]]:
        token = _get_evotor_cloud_token_env()
        store_uuid = _get_evotor_store_uuid_env()
        if not token or not store_uuid:
            return []

        cache_key = f'products:v1:{store_uuid}'

        def fetch_products() -> list[dict[str, Any]]:
            raw_items = self._client.fetch_v1_products(token, store_uuid)
            items = [item for item in raw_items if float(item.get('price') or 0) > 0]
            return [_map_evotor_to_menu_item(item) for item in items]

        return self._cache.cached(cache_key, fetch_products)

