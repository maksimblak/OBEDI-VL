from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class RequestOtpIn(BaseModel):
    phone: str


class VerifyOtpIn(BaseModel):
    phone: str
    code: str


class ProfilePatchIn(BaseModel):
    name: str


class CartItemIn(BaseModel):
    id: str
    title: str
    price: float = Field(ge=0)
    quantity: int = Field(ge=1, le=99)

    model_config = ConfigDict(extra='allow')


class CreateOrderIn(BaseModel):
    items: list[CartItemIn]

