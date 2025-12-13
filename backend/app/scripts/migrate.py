from __future__ import annotations

import sys

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.core.database import engine
from app.core.settings import BACKEND_DIR

REQUIRED_TABLES = {'users', 'sessions', 'otp_codes', 'orders'}


def main() -> int:
    with engine.connect() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())

    cfg = Config(str((BACKEND_DIR / 'alembic.ini').resolve()))

    has_version_table = 'alembic_version' in tables
    has_schema = REQUIRED_TABLES.issubset(tables)

    if has_version_table:
        command.upgrade(cfg, 'head')
        return 0

    if has_schema:
        command.stamp(cfg, 'head')
        return 0

    command.upgrade(cfg, 'head')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

