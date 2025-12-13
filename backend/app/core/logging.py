from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            'ts': datetime.now(timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }

        extra = _extract_extras(record)
        if extra:
            payload['extra'] = extra

        if record.exc_info:
            payload['exception'] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False)


def setup_logging() -> None:
    level = os.getenv('LOG_LEVEL', 'INFO').strip().upper() or 'INFO'
    fmt = os.getenv('LOG_FORMAT', 'console').strip().lower() or 'console'

    handler = logging.StreamHandler()
    if fmt == 'json':
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s'))

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
