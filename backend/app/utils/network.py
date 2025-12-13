from __future__ import annotations

from ipaddress import ip_address, ip_network

from fastapi import Request

from ..core.settings import settings


def get_client_ip(request: Request) -> str:
    direct_ip = request.client.host if request.client else ''

    if not settings.trust_proxy_headers:
        return direct_ip or 'unknown'

    if direct_ip and settings.trusted_proxy_ips:
        if not _ip_in_allowlist(direct_ip, settings.trusted_proxy_ips):
            return direct_ip

    forwarded = _parse_forwarded_for(request.headers.get('forwarded'))
    if forwarded:
        return forwarded

    xff = request.headers.get('x-forwarded-for')
    if xff:
        for part in xff.split(','):
            candidate = part.strip()
            if _is_ip(candidate):
                return candidate

    x_real = (request.headers.get('x-real-ip') or '').strip()
    if _is_ip(x_real):
        return x_real

    return direct_ip or 'unknown'


def _is_ip(value: str) -> bool:
    if not value:
        return False
    try:
        ip_address(value)
        return True
    except ValueError:
        return False


def _ip_in_allowlist(client_ip: str, allowlist: str) -> bool:
    try:
        ip = ip_address(client_ip)
    except ValueError:
        return False

    for raw in allowlist.split(','):
        item = raw.strip()
        if not item:
            continue

        try:
            if '/' in item:
                if ip in ip_network(item, strict=False):
                    return True
                continue

            if ip == ip_address(item):
                return True
        except ValueError:
            continue

    return False


def _parse_forwarded_for(header_value: str | None) -> str | None:
    if not header_value:
        return None

    parts = [part.strip() for part in header_value.split(',') if part.strip()]
    for part in parts:
        for token in [t.strip() for t in part.split(';') if t.strip()]:
            if not token.lower().startswith('for='):
                continue

            value = token[4:].strip()
            if value.startswith('"') and value.endswith('"') and len(value) >= 2:
                value = value[1:-1]
            if value.startswith('[') and value.endswith(']') and len(value) >= 2:
                value = value[1:-1]

            if _is_ip(value):
                return value

    return None
