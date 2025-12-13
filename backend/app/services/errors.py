from __future__ import annotations


class ServiceError(Exception):
    def __init__(self, error: str, status_code: int = 400, **extra: object) -> None:
        super().__init__(error)
        self.error = error
        self.status_code = status_code
        self.extra = extra


class UnauthorizedError(ServiceError):
    def __init__(self) -> None:
        super().__init__('Unauthorized', 401)


class InvalidPhoneError(ServiceError):
    def __init__(self) -> None:
        super().__init__('Invalid phone', 400)


class InvalidInputError(ServiceError):
    def __init__(self) -> None:
        super().__init__('Invalid input', 400)


class TooManyRequestsError(ServiceError):
    def __init__(self, retry_after_ms: int | None = None) -> None:
        extra: dict[str, object] = {}
        if isinstance(retry_after_ms, int):
            extra['retryAfterMs'] = retry_after_ms
        super().__init__('Too many requests', 429, **extra)


class InvalidCodeError(ServiceError):
    def __init__(self) -> None:
        super().__init__('Invalid code', 401)


class TooManyAttemptsError(ServiceError):
    def __init__(self) -> None:
        super().__init__('Too many attempts', 429)


class InvalidNameError(ServiceError):
    def __init__(self) -> None:
        super().__init__('Invalid name', 400)


class EmptyOrderError(ServiceError):
    def __init__(self) -> None:
        super().__init__('Empty order', 400)


class SmsSendError(ServiceError):
    def __init__(self) -> None:
        super().__init__('Failed to send SMS', 502)

