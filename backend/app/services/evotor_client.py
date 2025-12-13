from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class EvotorCloudToken:
    token: str
    source: str


class EvotorClient:
    V2_MIME = 'application/vnd.evotor.v2+json'

    def __init__(self, *, timeout_sec: int = 8, user_agent: str = 'obedi-vl/1.0 (server)') -> None:
        self._timeout_sec = timeout_sec
        self._user_agent = user_agent

    def _request(self, url: str, *, method: str = 'GET', headers: dict[str, str] | None = None) -> tuple[int, bytes]:
        request = urllib.request.Request(url, method=method, headers=headers or {})
        if 'User-Agent' not in request.headers:
            request.add_header('User-Agent', self._user_agent)

        try:
            with urllib.request.urlopen(request, timeout=self._timeout_sec) as response:
                return int(getattr(response, 'status', response.getcode())), response.read()
        except urllib.error.HTTPError as error:
            try:
                body = error.read()
            except Exception:
                body = b''
            return int(error.code), body

    def _request_json(self, url: str, *, method: str = 'GET', headers: dict[str, str] | None = None) -> tuple[int, Any]:
        status, body = self._request(url, method=method, headers=headers)
        text = body.decode('utf-8', errors='replace')
        try:
            data = json.loads(text) if text else None
        except Exception:
            data = None
        return status, data

    def fetch_v1_stores(self, cloud_token: str) -> list[dict[str, Any]]:
        token = str(cloud_token or '').strip()
        if not token:
            raise ValueError('Evotor cloud token is required')

        url = 'https://api.evotor.ru/api/v1/inventories/stores/search'
        status, data = self._request_json(
            url,
            headers={
                'X-Authorization': token,
                'Content-Type': 'application/json',
            },
        )

        if status < 200 or status >= 300:
            details = json.dumps(data, ensure_ascii=False) if data is not None else ''
            raise RuntimeError(f'Evotor stores lookup failed ({status}): {details[:200]}')

        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]
        if isinstance(data, dict):
            items = data.get('items')
            if isinstance(items, list):
                return [item for item in items if isinstance(item, dict)]
        return []

    def fetch_v1_products(self, cloud_token: str, store_uuid: str) -> list[dict[str, Any]]:
        token = str(cloud_token or '').strip()
        store_uuid_norm = str(store_uuid or '').strip()
        if not token or not store_uuid_norm:
            return []

        url = f'https://api.evotor.ru/api/v1/inventories/stores/{urllib.parse.quote(store_uuid_norm)}/products'
        status, data = self._request_json(
            url,
            headers={
                'X-Authorization': token,
                'Content-Type': 'application/json',
            },
        )

        if status < 200 or status >= 300:
            return []

        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]
        if isinstance(data, dict):
            items = data.get('items')
            if isinstance(items, list):
                return [item for item in items if isinstance(item, dict)]
        return []

    def _cloud_headers(self, token: str) -> dict[str, str]:
        auth_header = token if token.lower().startswith('bearer ') else f'Bearer {token}'
        return {
            'Accept': self.V2_MIME,
            'Content-Type': self.V2_MIME,
            'Authorization': auth_header,
        }

    def fetch_cloud_json(self, url: str, cloud_token: str) -> Any:
        token = str(cloud_token or '').strip()
        if not token:
            raise ValueError('Evotor cloud token is required')

        status, data = self._request_json(url, headers=self._cloud_headers(token))
        if status in (401, 403):
            status, data = self._request_json(
                url,
                headers={
                    'Accept': self.V2_MIME,
                    'Content-Type': self.V2_MIME,
                    'x-authorization': token,
                },
            )

        if status < 200 or status >= 300:
            details = json.dumps(data, ensure_ascii=False) if data is not None else ''
            raise RuntimeError(f'Evotor Cloud request failed ({status}): {details[:300]}')

        return data

    def fetch_cloud_stores(self, cloud_token: str) -> list[dict[str, Any]]:
        data = self.fetch_cloud_json('https://api.evotor.ru/stores', cloud_token)
        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]
        return []

    def fetch_cloud_products(
        self,
        cloud_token: str,
        store_id: str,
        *,
        cursor: str | None = None,
        since: str | int | None = None,
    ) -> Any:
        store_id_norm = str(store_id or '').strip()
        if not store_id_norm:
            raise ValueError('storeId is required')

        url = f'https://api.evotor.ru/stores/{urllib.parse.quote(store_id_norm)}/products'
        params: dict[str, str] = {}
        if isinstance(cursor, str) and cursor.strip():
            params['cursor'] = cursor.strip()
        if isinstance(since, str) and since.strip():
            params['since'] = since.strip()
        if isinstance(since, int):
            params['since'] = str(int(since))
        if params:
            url = f'{url}?{urllib.parse.urlencode(params)}'

        return self.fetch_cloud_json(url, cloud_token)
