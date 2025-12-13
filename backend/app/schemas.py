from __future__ import annotations

from typing import Any, Literal

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
  total: float | None = None


class UserOut(BaseModel):
  id: str
  phone: str
  name: str
  loyaltyPoints: int
  joinedDate: str


class OrderOut(BaseModel):
  id: str
  userId: str
  date: str
  items: list[dict[str, Any]]
  total: float
  status: Literal['pending', 'delivered']

