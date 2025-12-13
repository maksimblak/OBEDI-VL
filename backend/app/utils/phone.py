from __future__ import annotations


def normalize_phone(raw: object) -> str | None:
    if not isinstance(raw, str):
        return None

    digits = ''.join(ch for ch in raw if ch.isdigit())
    if len(digits) == 0:
        return None

    if len(digits) == 10:
        return f'+7{digits}'

    if len(digits) == 11 and (digits.startswith('8') or digits.startswith('7')):
        return f'+7{digits[1:]}'

    if 11 <= len(digits) <= 15:
        return f'+{digits}'

    return None

