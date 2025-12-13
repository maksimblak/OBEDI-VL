from __future__ import annotations

from fastapi import APIRouter

from .routers import ai, auth, delivery, evotor, health, orders

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(orders.router)
api_router.include_router(delivery.router)
api_router.include_router(evotor.router)
api_router.include_router(ai.router)
