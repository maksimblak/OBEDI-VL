from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass


RESTAURANT_COORDS = {'lat': 43.096362, 'lon': 131.916723}
VLADIVOSTOK_BOUNDS = {'minLat': 42.8, 'maxLat': 43.3, 'minLon': 131.6, 'maxLon': 132.3}


@dataclass(frozen=True)
class ZoneResult:
    found: bool
    formatted_address: str
    distance: float
    zone: str | None


class DeliveryService:
    def __init__(self, *, cache_ttl_ms: int, user_agent: str) -> None:
        self._cache_ttl_ms = max(0, int(cache_ttl_ms))
        self._user_agent = user_agent
        self._cache: dict[str, tuple[ZoneResult, int]] = {}

    def resolve_zone(self, address: str) -> dict[str, object]:
        key = (address or '').strip().lower()
        if not key:
            return self._serialize(ZoneResult(found=False, formatted_address='', distance=0, zone=None))

        cached = self._get_cached(key)
        if cached:
            return self._serialize(cached)

        try:
            geo = self._geocode_address(address)
            if not geo:
                result = ZoneResult(found=False, formatted_address='', distance=0, zone=None)
                self._set_cached(key, result)
                return self._serialize(result)

            distance = self._osrm_distance_km(RESTAURANT_COORDS, {'lat': geo['lat'], 'lon': geo['lon']})
            if distance is None:
                result = ZoneResult(found=False, formatted_address=geo['display_name'], distance=0, zone=None)
                self._set_cached(key, result)
                return self._serialize(result)

            zone = 'green' if distance <= 4 else 'yellow' if distance <= 8 else 'red' if distance <= 15 else None
            result = ZoneResult(found=True, formatted_address=geo['display_name'], distance=distance, zone=zone)
            self._set_cached(key, result)
            return self._serialize(result)
        except Exception:
            result = ZoneResult(found=False, formatted_address='', distance=0, zone=None)
            self._set_cached(key, result)
            return self._serialize(result)

    def _serialize(self, value: ZoneResult) -> dict[str, object]:
        if not value.found:
            return {'found': False, 'formattedAddress': value.formatted_address, 'distance': 0, 'zone': None}
        return {
            'found': True,
            'formattedAddress': value.formatted_address,
            'distance': value.distance,
            'zone': value.zone,
        }

    def _now_ms(self) -> int:
        return int(time.time() * 1000)

    def _get_cached(self, key: str) -> ZoneResult | None:
        entry = self._cache.get(key)
        if not entry:
            return None
        value, expires_at_ms = entry
        if self._now_ms() > expires_at_ms:
            self._cache.pop(key, None)
            return None
        return value

    def _set_cached(self, key: str, value: ZoneResult) -> None:
        if self._cache_ttl_ms <= 0:
            return
        self._cache[key] = (value, self._now_ms() + self._cache_ttl_ms)

    def _is_within_bounds(self, *, lat: float, lon: float) -> bool:
        return (
            lat >= VLADIVOSTOK_BOUNDS['minLat']
            and lat <= VLADIVOSTOK_BOUNDS['maxLat']
            and lon >= VLADIVOSTOK_BOUNDS['minLon']
            and lon <= VLADIVOSTOK_BOUNDS['maxLon']
        )

    def _request_json(self, url: str, *, timeout: int = 8, headers: dict[str, str] | None = None) -> object | None:
        request = urllib.request.Request(url, headers=headers or {'User-Agent': self._user_agent})
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = response.read().decode('utf-8', errors='replace')
            return json.loads(payload or 'null')

    def _geocode_address(self, address: str) -> dict[str, object] | None:
        query = f'{address}, Vladivostok'
        params = urllib.parse.urlencode(
            {
                'format': 'jsonv2',
                'limit': '1',
                'countrycodes': 'ru',
                'q': query,
                'viewbox': f"{VLADIVOSTOK_BOUNDS['minLon']},{VLADIVOSTOK_BOUNDS['maxLat']},{VLADIVOSTOK_BOUNDS['maxLon']},{VLADIVOSTOK_BOUNDS['minLat']}",
                'bounded': '1',
            }
        )
        url = f'https://nominatim.openstreetmap.org/search?{params}'
        data = self._request_json(url, timeout=7, headers={'User-Agent': self._user_agent})
        first = data[0] if isinstance(data, list) and len(data) > 0 else None
        if not isinstance(first, dict):
            return None

        try:
            lat = float(first.get('lat'))
            lon = float(first.get('lon'))
        except (TypeError, ValueError):
            return None

        if not self._is_within_bounds(lat=lat, lon=lon):
            return None

        display_name = str(first.get('display_name') or '')[:200]
        return {'lat': lat, 'lon': lon, 'display_name': display_name}

    def _osrm_distance_km(self, from_: dict[str, float], to: dict[str, float]) -> float | None:
        url = (
            'https://router.project-osrm.org/route/v1/driving/'
            f"{from_['lon']},{from_['lat']};{to['lon']},{to['lat']}?overview=false&alternatives=false&steps=false"
        )
        data = self._request_json(url, timeout=7)
        if not isinstance(data, dict):
            return None
        routes = data.get('routes')
        if not isinstance(routes, list) or len(routes) == 0:
            return None
        first = routes[0]
        if not isinstance(first, dict):
            return None
        meters = first.get('distance')
        if not isinstance(meters, (int, float)) or meters <= 0:
            return None

        distance_km = float(meters) / 1000
        return max(0.0, round(distance_km * 10) / 10)

