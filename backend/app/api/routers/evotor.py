from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from ...services.errors import ServiceError
from ...services.evotor_service import EvotorService
from ..deps import get_evotor_service, require_evotor_webhook_auth

router = APIRouter()


@router.post('/v1/user/token')
def evotor_user_token(request: Request, payload: dict, evotor_service: EvotorService = Depends(get_evotor_service)) -> JSONResponse:
    result = evotor_service.handle_user_token_webhook(authorization=request.headers.get('authorization'), body=payload)
    status_code = 200
    if isinstance(result, dict) and isinstance(result.get('_status'), int):
        status_code = int(result.get('_status'))
        result = {k: v for k, v in result.items() if k != '_status'}
    return JSONResponse(status_code=status_code, content=result)


@router.get('/evotor/token-status')
def evotor_token_status(
    request: Request,
    _auth: None = Depends(require_evotor_webhook_auth),
    evotor_service: EvotorService = Depends(get_evotor_service),
) -> dict:
    user_id = request.query_params.get('userId')
    return evotor_service.token_status(user_id)


@router.get('/evotor/stores')
def evotor_stores(evotor_service: EvotorService = Depends(get_evotor_service)) -> list[dict[str, str]]:
    try:
        return evotor_service.list_stores()
    except ValueError as exc:
        raise ServiceError(str(exc) or 'Request failed', 400) from exc


@router.get('/evotor/cloud/stores')
def evotor_cloud_stores(
    request: Request,
    _auth: None = Depends(require_evotor_webhook_auth),
    evotor_service: EvotorService = Depends(get_evotor_service),
) -> JSONResponse:
    user_id = request.query_params.get('userId')
    try:
        stores, _source = evotor_service.cloud_stores(user_id)
        return JSONResponse(status_code=200, content=stores)
    except ValueError as exc:
        raise ServiceError(str(exc) or 'Request failed', 400) from exc
    except Exception as exc:
        resolved = evotor_service.resolve_cloud_token(user_id)
        raise ServiceError(str(exc) or 'Evotor Cloud request failed', 502, tokenSource=resolved.source) from exc


@router.get('/evotor/cloud/stores/{store_id}/products')
def evotor_cloud_products(
    store_id: str,
    request: Request,
    _auth: None = Depends(require_evotor_webhook_auth),
    evotor_service: EvotorService = Depends(get_evotor_service),
) -> JSONResponse:
    user_id = request.query_params.get('userId')
    cursor = request.query_params.get('cursor')
    since_raw = request.query_params.get('since')
    since: str | int | None = None
    if since_raw is not None:
        try:
            since = int(str(since_raw).strip())
        except ValueError:
            since = str(since_raw).strip() or None

    try:
        products, _source = evotor_service.cloud_products(
            query_user_id=user_id,
            store_id=store_id,
            cursor=cursor,
            since=since,
        )
        return JSONResponse(status_code=200, content=products)
    except ValueError as exc:
        raise ServiceError(str(exc) or 'Request failed', 400) from exc
    except Exception as exc:
        resolved = evotor_service.resolve_cloud_token(user_id)
        raise ServiceError(str(exc) or 'Evotor Cloud request failed', 502, tokenSource=resolved.source) from exc


@router.post('/evotor/store')
def evotor_set_store(payload: dict, evotor_service: EvotorService = Depends(get_evotor_service)) -> dict:
    store_uuid = payload.get('storeUuid') if isinstance(payload, dict) else ''
    try:
        normalized = evotor_service.set_store_uuid(str(store_uuid or ''))
        return {'ok': True, 'storeUuid': normalized}
    except ValueError as exc:
        raise ServiceError(str(exc) or 'Request failed', 400) from exc


@router.get('/evotor/products')
def evotor_products(evotor_service: EvotorService = Depends(get_evotor_service)) -> list[dict]:
    try:
        return evotor_service.products_menu_items()
    except Exception:
        return []

