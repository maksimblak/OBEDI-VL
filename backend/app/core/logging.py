from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone


# Patterns to detect and sanitize sensitive data in logs
_SENSITIVE_PATTERNS = [
    # Tokens and keys
    (re.compile(r'(Bearer\s+)([A-Za-z0-9_\-\.]+)', re.IGNORECASE), r'\1***'),
    (re.compile(r'(["\']?(?:token|api_key|secret|password|auth)["\']?\s*[:=]\s*["\']?)([^"\'\s,}]+)(["\']?)', re.IGNORECASE), r'\1***\3'),
    (re.compile(r'(X-Authorization:\s*)([^\s]+)', re.IGNORECASE), r'\1***'),
    # Phone numbers (Russian format)
    (re.compile(r'(\+7|8)\d{10}'), r'+7**********'),
    # OTP codes (6 digits)
    (re.compile(r'\b\d{6}\b'), r'******'),
]


def _sanitize_message(message: str) -> str:
    """Remove sensitive data from log messages"""
    if not isinstance(message, str):
        return message

    sanitized = message
    for pattern, replacement in _SENSITIVE_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)
    return sanitized


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        # Sanitize message before formatting
        message = _sanitize_message(record.getMessage())

        payload: dict[str, object] = {
            'ts': datetime.now(timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': message,
        }

        extra = _extract_extras(record)
        if extra:
            payload['extra'] = extra

        if record.exc_info:
            exception_text = self.formatException(record.exc_info)
            payload['exception'] = _sanitize_message(exception_text)

        return json.dumps(payload, ensure_ascii=False)


class SanitizingFormatter(logging.Formatter):
    """Console formatter that sanitizes sensitive data"""
    def format(self, record: logging.LogRecord) -> str:
        # Create a copy of the record to avoid modifying the original
        original_msg = record.msg
        record.msg = _sanitize_message(str(original_msg))
        result = super().format(record)
        record.msg = original_msg
        return result


def setup_logging() -> None:
    level = os.getenv('LOG_LEVEL', 'INFO').strip().upper() or 'INFO'
    fmt = os.getenv('LOG_FORMAT', 'console').strip().lower() or 'console'

    handler = logging.StreamHandler()
    if fmt == 'json':
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(SanitizingFormatter('%(asctime)s %(levelname)s %(name)s: %(message)s'))

    logging.basicConfig(level=level, handlers=[handler], force=True)

    for logger_name in ('uvicorn', 'uvicorn.error', 'uvicorn.access', 'fastapi'):
        logger = logging.getLogger(logger_name)
        logger.handlers = []
        logger.propagate = True


_RESERVED_KEYS = {
    'name',
    'msg',
    'args',
    'levelname',
    'levelno',
    'pathname',
    'filename',
    'module',
    'exc_info',
    'exc_text',
    'stack_info',
    'lineno',
    'funcName',
    'created',
    'msecs',
    'relativeCreated',
    'thread',
    'threadName',
    'processName',
    'process',
}


def _json_safe(value: object) -> object:
    try:
        json.dumps(value)
        return value
    except TypeError:
        return str(value)


def _extract_extras(record: logging.LogRecord) -> dict[str, object]:
    extras: dict[str, object] = {}
    for key, value in record.__dict__.items():
        if key in _RESERVED_KEYS or key.startswith('_'):
            continue
        extras[key] = _json_safe(value)
    return extras
