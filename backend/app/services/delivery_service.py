from __future__ import annotations

import json
import logging
import math
import time
import urllib.parse
import urllib.request
import urllib.error
from dataclasses import dataclass


RESTAURANT_COORDS = {'lat': 43.096362, 'lon': 131.916723}
VLADIVOSTOK_BOUNDS = {'minLat': 42.8, 'maxLat': 43.3, 'minLon': 131.6, 'maxLon': 132.3}

logger = logging.getLogger(__name__)

FALLBACK_DRIVING_DISTANCE_FACTOR = 1.25


@dataclass(frozen=True)
class GeocodeResult:
    lat: float
    lon: float
    display_name: str


@dataclass(frozen=True)
class ZoneResult:
    found: bool
    formatted_address: str
    distance: float
    zone: str | None


class DeliveryService:
    def __init__(
        self,
        *,
        cache_ttl_ms: int,
        user_agent: str,
        geocoder_provider: str = 'photon',
        nominatim_base_url: str = 'https://nominatim.openstreetmap.org',
        photon_base_url: str = 'https://photon.komoot.io',
    ) -> None:
        self._cache_ttl_ms = max(0, int(cache_ttl_ms))
        self._user_agent = (user_agent or '').strip() or 'obedi-vl/1.0 (server)'
        self._geocoder_provider = self._normalize_geocoder_provider(geocoder_provider)
        self._nominatim_base_url = (nominatim_base_url or '').strip().rstrip('/') or 'https://nominatim.openstreetmap.org'
        self._photon_base_url = (photon_base_url or '').strip().rstrip('/') or 'https://photon.komoot.io'
        self._cache: dict[str, tuple[ZoneResult, int]] = {}
        self._osrm_disabled_until_ms: int = 0

    def resolve_zone(self, address: str) -> dict[str, object]:
        key = (address or '').strip().lower()
        if not key:
            return self._serialize(ZoneResult(found=False, formatted_address='', distance=0, zone=None))

        cached = self._get_cached(key)
        if cached:
            return self._serialize(cached)

        try:
            geo, geocode_failed = self._geocode_address(address)
            if geo is None:
                result = ZoneResult(found=False, formatted_address='', distance=0, zone=None)
                if not geocode_failed:
                    self._set_cached(key, result)
                return self._serialize(result)

            distance, distance_failed = self._osrm_distance_km(RESTAURANT_COORDS, {'lat': geo.lat, 'lon': geo.lon})
            if distance is None:
                fallback_distance = self._fallback_distance_km(RESTAURANT_COORDS, {'lat': geo.lat, 'lon': geo.lon})
                if fallback_distance is None:
                    result = ZoneResult(found=False, formatted_address=geo.display_name, distance=0, zone=None)
                    if not distance_failed:
                        self._set_cached(key, result)
                    return self._serialize(result)

                fallback_zone = (
                    'green'
                    if fallback_distance <= 4
                    else 'yellow'
                    if fallback_distance <= 8
                    else 'red'
                    if fallback_distance <= 15
                    else None
                )
                result = ZoneResult(
                    found=True,
                    formatted_address=geo.display_name,
                    distance=fallback_distance,
                    zone=fallback_zone,
                )

                fallback_cache_ttl_ms = min(self._cache_ttl_ms, 10 * 60 * 1000) if self._cache_ttl_ms > 0 else 0
                if fallback_cache_ttl_ms > 0:
                    self._set_cached(key, result, ttl_ms=fallback_cache_ttl_ms)
                return self._serialize(result)

            zone = 'green' if distance <= 4 else 'yellow' if distance <= 8 else 'red' if distance <= 15 else None
            result = ZoneResult(found=True, formatted_address=geo.display_name, distance=distance, zone=zone)
            self._set_cached(key, result)
            return self._serialize(result)
        except Exception:
            logger.exception('Delivery zone lookup failed')
            return self._serialize(ZoneResult(found=False, formatted_address='', distance=0, zone=None))

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

    def _set_cached(self, key: str, value: ZoneResult, *, ttl_ms: int | None = None) -> None:
        effective_ttl_ms = self._cache_ttl_ms if ttl_ms is None else max(0, int(ttl_ms))
        if effective_ttl_ms <= 0:
            return
        self._cache[key] = (value, self._now_ms() + effective_ttl_ms)

    def _is_within_bounds(self, *, lat: float, lon: float) -> bool:
        return (
            lat >= VLADIVOSTOK_BOUNDS['minLat']
            and lat <= VLADIVOSTOK_BOUNDS['maxLat']
            and lon >= VLADIVOSTOK_BOUNDS['minLon']
            and lon <= VLADIVOSTOK_BOUNDS['maxLon']
        )

    def _fallback_distance_km(self, from_: dict[str, float], to: dict[str, float]) -> float | None:
        try:
            lat1 = float(from_['lat'])
            lon1 = float(from_['lon'])
            lat2 = float(to['lat'])
            lon2 = float(to['lon'])
        except (KeyError, TypeError, ValueError):
            return None

        distance = self._haversine_km(lat1, lon1, lat2, lon2) * FALLBACK_DRIVING_DISTANCE_FACTOR
        if not math.isfinite(distance) or distance <= 0:
            return None
        return max(0.0, round(distance * 10) / 10)

    def _haversine_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        earth_radius_km = 6371.0
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)

        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return earth_radius_km * c

    def _request_json(self, url: str, *, timeout: int = 8, headers: dict[str, str] | None = None) -> object | None:
        request = urllib.request.Request(url, headers=headers or {'User-Agent': self._user_agent})
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = response.read().decode('utf-8', errors='replace')
            return json.loads(payload or 'null')

    def _normalize_geocoder_provider(self, raw_value: str) -> str:
        value = (raw_value or '').strip().lower()
        if value in ('nominatim', 'photon', 'auto'):
            return value
        return 'photon'

    def _geocode_address(self, address: str) -> tuple[GeocodeResult | None, bool]:
        if self._geocoder_provider == 'nominatim':
            return self._geocode_nominatim(address)
        if self._geocoder_provider == 'photon':
            return self._geocode_photon(address)

        photon_hit, photon_failed = self._geocode_photon(address)
        if photon_hit is not None:
            return photon_hit, False

        nominatim_hit, nominatim_failed = self._geocode_nominatim(address)
        if nominatim_hit is not None:
            return nominatim_hit, False

        return None, (photon_failed or nominatim_failed)

    def _geocode_nominatim(self, address: str) -> tuple[GeocodeResult | None, bool]:
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
        url = f'{self._nominatim_base_url}/search?{params}'

        try:
            data = self._request_json(url, timeout=7, headers={'User-Agent': self._user_agent})
        except urllib.error.HTTPError as exc:
            body = ''
            try:
                body = exc.read().decode('utf-8', errors='replace')
            except Exception:
                body = ''
            logger.warning('Nominatim geocoding blocked (%s): %s', exc.code, body[:200])
            return None, True
        except Exception:
            logger.exception('Nominatim geocoding request failed')
            return None, True

        first = data[0] if isinstance(data, list) and len(data) > 0 else None
        if not isinstance(first, dict):
            return None, False

        try:
            lat = float(first.get('lat'))
            lon = float(first.get('lon'))
        except (TypeError, ValueError):
            return None, False

        if not self._is_within_bounds(lat=lat, lon=lon):
            return None, False

        display_name = str(first.get('display_name') or '')[:200]
        return GeocodeResult(lat=lat, lon=lon, display_name=display_name), False

    def _format_photon_address(self, properties: dict[str, object]) -> str:
        street = str(properties.get('street') or properties.get('name') or '').strip()
        house = str(properties.get('housenumber') or '').strip()
        city = str(properties.get('city') or '').strip()
        district = str(properties.get('district') or '').strip()
        state = str(properties.get('state') or '').strip()
        country = str(properties.get('country') or '').strip()

        first_part = street
        if street and house:
            first_part = f'{street}, {house}'
        elif house and not street:
            first_part = house

        parts: list[str] = []
        for part in (first_part, city or district, state, country):
            if not part:
                continue
            if part not in parts:
                parts.append(part)

        return ', '.join(parts)[:200]

    def _geocode_photon(self, address: str) -> tuple[GeocodeResult | None, bool]:
        query = f'{address}, Vladivostok'
        bbox = f"{VLADIVOSTOK_BOUNDS['minLon']},{VLADIVOSTOK_BOUNDS['minLat']},{VLADIVOSTOK_BOUNDS['maxLon']},{VLADIVOSTOK_BOUNDS['maxLat']}"
        params = urllib.parse.urlencode({'q': query, 'limit': '1', 'bbox': bbox})
        url = f'{self._photon_base_url}/api/?{params}'

        try:
            data = self._request_json(url, timeout=7, headers={'User-Agent': self._user_agent})
        except urllib.error.HTTPError as exc:
            body = ''
            try:
                body = exc.read().decode('utf-8', errors='replace')
            except Exception:
                body = ''
            logger.warning('Photon geocoding failed (%s): %s', exc.code, body[:200])
            return None, True
        except Exception:
            logger.exception('Photon geocoding request failed')
            return None, True

        if not isinstance(data, dict):
            return None, False

        features = data.get('features')
        if not isinstance(features, list) or len(features) == 0:
            return None, False

        first = features[0]
        if not isinstance(first, dict):
            return None, False

        geometry = first.get('geometry')
        if not isinstance(geometry, dict):
            return None, False

        coordinates = geometry.get('coordinates')
        if not isinstance(coordinates, list) or len(coordinates) < 2:
            return None, False

        lon_raw, lat_raw = coordinates[0], coordinates[1]
        if not isinstance(lat_raw, (int, float)) or not isinstance(lon_raw, (int, float)):
            return None, False

        lat = float(lat_raw)
        lon = float(lon_raw)
        if not self._is_within_bounds(lat=lat, lon=lon):
            return None, False

        properties = first.get('properties')
        properties_dict = properties if isinstance(properties, dict) else {}
        display_name = self._format_photon_address(properties_dict) or str(address or '').strip()[:200]

        return GeocodeResult(lat=lat, lon=lon, display_name=display_name), False

    def _osrm_distance_km(self, from_: dict[str, float], to: dict[str, float]) -> tuple[float | None, bool]:
        if self._now_ms() < self._osrm_disabled_until_ms:
            return None, True

        url = (
            'https://router.project-osrm.org/route/v1/driving/'
            f"{from_['lon']},{from_['lat']};{to['lon']},{to['lat']}?overview=false&alternatives=false&steps=false"
        )
        try:
            data = self._request_json(url, timeout=3)
        except urllib.error.HTTPError as exc:
            body = ''
            try:
                body = exc.read().decode('utf-8', errors='replace')
            except Exception:
                body = ''
            logger.warning('OSRM request failed (%s): %s', exc.code, body[:200])
            self._osrm_disabled_until_ms = self._now_ms() + 5 * 60 * 1000
            return None, True
        except Exception:
            logger.exception('OSRM request failed')
            self._osrm_disabled_until_ms = self._now_ms() + 5 * 60 * 1000
            return None, True

        if not isinstance(data, dict):
            return None, False
        routes = data.get('routes')
        if not isinstance(routes, list) or len(routes) == 0:
            return None, False
        first = routes[0]
        if not isinstance(first, dict):
            return None, False
        meters = first.get('distance')
        if not isinstance(meters, (int, float)) or meters <= 0:
            return None, False

        distance_km = float(meters) / 1000
        return max(0.0, round(distance_km * 10) / 10), False
