from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from ..db.models import Base
from .settings import settings


def _connect_args() -> dict[str, object]:
    if settings.database_url.startswith('sqlite'):
        return {
            'check_same_thread': False,
            'timeout': max(0.0, settings.sqlite_busy_timeout_ms / 1000.0),
        }
    return {}


engine = create_engine(settings.database_url, connect_args=_connect_args(), pool_pre_ping=True)


@event.listens_for(engine, 'connect')
def _sqlite_pragmas(dbapi_connection: object, _connection_record: object) -> None:
    if not settings.database_url.startswith('sqlite'):
        return

    cursor = getattr(dbapi_connection, 'cursor', None)
    if cursor is None:
        return

    cur = cursor()
    try:
        if settings.sqlite_foreign_keys:
            cur.execute('PRAGMA foreign_keys=ON')

        if settings.sqlite_busy_timeout_ms > 0:
            cur.execute(f'PRAGMA busy_timeout={int(settings.sqlite_busy_timeout_ms)}')

        journal_mode = settings.sqlite_journal_mode
        if journal_mode:
            cur.execute(f'PRAGMA journal_mode={journal_mode}')
            cur.fetchall()
    finally:
        cur.close()

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
