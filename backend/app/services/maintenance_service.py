from __future__ import annotations

import logging
import threading
from collections.abc import Callable
from datetime import datetime

from sqlalchemy.orm import Session

from ..repositories.otp_codes import OtpCodeRepository
from ..repositories.sessions import SessionRepository
from ..utils.time import utc_now

logger = logging.getLogger(__name__)


class MaintenanceService:
    def __init__(self, *, session_factory: Callable[[], Session]) -> None:
        self._session_factory = session_factory
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def start_background_cleanup(self, *, interval_ms: int) -> None:
        if interval_ms <= 0:
            return
        if self._thread and self._thread.is_alive():
            return

        self._thread = threading.Thread(
            target=self._cleanup_loop,
            args=(interval_ms,),
            daemon=True,
            name='maintenance_cleanup',
        )
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()

    def cleanup_expired(self, *, now: datetime | None = None) -> dict[str, int]:
        now_dt = now or utc_now()
        db = self._session_factory()
        try:
            sessions = SessionRepository(db)
            otps = OtpCodeRepository(db)

            deleted_sessions = sessions.delete_expired(now=now_dt)
            deleted_otps = otps.delete_expired(now=now_dt)

            if deleted_sessions or deleted_otps:
                db.commit()

            return {
                'deletedSessions': deleted_sessions,
                'deletedOtps': deleted_otps,
            }
        finally:
            db.close()

    def _cleanup_loop(self, interval_ms: int) -> None:
        interval_s = max(0.1, interval_ms / 1000.0)
        while not self._stop_event.is_set():
            try:
                result = self.cleanup_expired()
                if result.get('deletedSessions') or result.get('deletedOtps'):
                    logger.info('cleanup_expired', extra=result)
            except Exception:
                logger.exception('cleanup_expired_failed')

            self._stop_event.wait(interval_s)

