from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from ..db.models import Base
from .settings import settings


def _connect_args() -> dict[str, object]:
    if settings.database_url.startswith('sqlite'):
        return {'check_same_thread': False}
    return {}


engine = create_engine(settings.database_url, connect_args=_connect_args())

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

