from __future__ import annotations

from fastapi import APIRouter

from .routers import auth, delivery, health, orders

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(orders.router)
api_router.include_router(delivery.router)

