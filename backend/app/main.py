from __future__ import annotations

import json
import secrets
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import timedelta

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .database import get_db, init_db
from .models import OtpCode, Order, Session as DbSession, User
from .schemas import CreateOrderIn, ProfilePatchIn, RequestOtpIn, VerifyOtpIn
from .settings import settings
from .utils import (
  get_client_ip,
  isoformat_z,
  normalize_phone,
  random_otp_code,
  random_session_token,
  sha256_hex,
  timing_safe_equal_hex,
  utc_now,
)


@dataclass
class OtpRate:
  count: int
  reset_at_ms: int
  last_sent_at_ms: int


@dataclass
class IpRate:
  count: int
  reset_at_ms: int


otp_rate_by_phone: dict[str, OtpRate] = {}
otp_rate_by_ip: dict[str, IpRate] = {}


def _sms_send_console(phone: str, code: str) -> None:
  print(f'[OTP][console] {phone}: {code}')


def _sms_send_smsru(phone: str, code: str) -> None:
  if not settings.sms_ru_api_id:
    raise RuntimeError('SMS_RU_API_ID is not configured')

  text = f'Obedi VL: код {code}. Никому не сообщайте.'
  params = urllib.parse.urlencode(
    {
      'api_id': settings.sms_ru_api_id,
      'to': ''.join(ch for ch in phone if ch.isdigit()),
      'msg': text,
      'json': '1',
      'from': settings.sms_sender,
    }
  )
  url = f'https://sms.ru/sms/send?{params}'
  request = urllib.request.Request(url, headers={'User-Agent': 'obedi-vl/1.0 (server)'})
  with urllib.request.urlopen(request, timeout=8) as response:
    payload = response.read().decode('utf-8', errors='replace')
    data = json.loads(payload or '{}')
    if data.get('status') != 'OK':
      raise RuntimeError(f'SMS.RU error: {payload}')


def send_otp(phone: str, code: str) -> None:
  if settings.sms_provider == 'console':
    _sms_send_console(phone, code)
    return
  if settings.sms_provider == 'smsru':
    _sms_send_smsru(phone, code)
    return
  raise RuntimeError(f'Unknown SMS_PROVIDER: {settings.sms_provider}')


def get_or_create_user(db: Session, phone: str) -> User:
  user = db.get(User, phone)
  if user:
    return user

  now = utc_now()
  user = User(
    id=phone,
    phone=phone,
    name='Гость',
    loyalty_points=150,
    joined_date=now,
  )
  db.add(user)
  db.commit()
  db.refresh(user)
  return user


def serialize_user(user: User) -> dict[str, object]:
  return {
    'id': user.id,
    'phone': user.phone,
    'name': user.name,
    'loyaltyPoints': user.loyalty_points,
    'joinedDate': isoformat_z(user.joined_date),
  }


def serialize_order(order: Order) -> dict[str, object]:
  return {
    'id': order.id,
    'userId': order.user_id,
    'date': isoformat_z(order.date),
    'items': order.items,
    'total': order.total,
    'status': order.status,
  }


def get_session_user(db: Session, request: Request) -> User | None:
  token = request.cookies.get(settings.session_cookie_name)
  if not token:
    return None

  session = db.get(DbSession, token)
  if not session:
    return None

  if utc_now() > session.expires_at:
    db.delete(session)
    db.commit()
    return None

  return db.get(User, session.user_id)


def require_auth(request: Request, db: Session = Depends(get_db)) -> User:
  user = get_session_user(db, request)
  if not user:
    raise HTTPException(status_code=401, detail='Unauthorized')
  return user


app = FastAPI(title='Obedi VL API (Python)')

app.add_middleware(
  CORSMiddleware,
  allow_origins=settings.cors_origins,
  allow_credentials=True,
  allow_methods=['GET', 'POST', 'PATCH', 'OPTIONS'],
  allow_headers=['Content-Type', 'Authorization'],
)


@app.on_event('startup')
def _startup() -> None:
  init_db()


@app.exception_handler(HTTPException)
def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
  if isinstance(exc.detail, dict) and isinstance(exc.detail.get('error'), str):
    return JSONResponse(status_code=exc.status_code, content=exc.detail)

  if isinstance(exc.detail, str):
    return JSONResponse(status_code=exc.status_code, content={'error': exc.detail})

  return JSONResponse(status_code=exc.status_code, content={'error': 'Request failed'})


@app.exception_handler(RequestValidationError)
def validation_exception_handler(_request: Request, _exc: RequestValidationError) -> JSONResponse:
  return JSONResponse(status_code=400, content={'error': 'Invalid input'})


@app.get('/api/health')
def health() -> dict[str, object]:
  return {
    'ok': True,
    'geminiConfigured': bool(settings.gemini_api_key),
    'evotorConfigured': False,
    'auth': {
      'smsProvider': settings.sms_provider,
      'smsConfigured': settings.sms_provider == 'console' or bool(settings.sms_ru_api_id),
      'cookieSecure': settings.cookie_secure,
    },
  }


@app.get('/api/auth/me')
def auth_me(request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
  user = get_session_user(db, request)
  return {'user': serialize_user(user) if user else None}


@app.post('/api/auth/logout')
def auth_logout(request: Request, response: Response, db: Session = Depends(get_db)) -> dict[str, object]:
  token = request.cookies.get(settings.session_cookie_name)
  if token:
    session = db.get(DbSession, token)
    if session:
      db.delete(session)
      db.commit()

  response.delete_cookie(
    settings.session_cookie_name,
    path='/',
    secure=settings.cookie_secure,
    httponly=True,
    samesite='lax',
  )
  return {'ok': True}


@app.post('/api/auth/request-otp')
def auth_request_otp(payload: RequestOtpIn, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
  phone = normalize_phone(payload.phone)
  if not phone:
    raise HTTPException(status_code=400, detail='Invalid phone')

  now_ms = int(time.time() * 1000)
  ip = get_client_ip(request)

  phone_rate = otp_rate_by_phone.get(phone) or OtpRate(
    count=0, reset_at_ms=now_ms + 60 * 60 * 1000, last_sent_at_ms=0
  )
  if now_ms > phone_rate.reset_at_ms:
    phone_rate.count = 0
    phone_rate.reset_at_ms = now_ms + 60 * 60 * 1000

  ip_rate = otp_rate_by_ip.get(ip) or IpRate(count=0, reset_at_ms=now_ms + 60 * 60 * 1000)
  if now_ms > ip_rate.reset_at_ms:
    ip_rate.count = 0
    ip_rate.reset_at_ms = now_ms + 60 * 60 * 1000

  cooldown_left = settings.otp_resend_cooldown_ms - (now_ms - phone_rate.last_sent_at_ms)
  if cooldown_left > 0:
    raise HTTPException(
      status_code=429,
      detail={'error': 'Too many requests', 'retryAfterMs': cooldown_left},
    )

  if (
    phone_rate.count >= settings.otp_max_requests_per_hour_phone
    or ip_rate.count >= settings.otp_max_requests_per_hour_ip
  ):
    raise HTTPException(status_code=429, detail={'error': 'Too many requests'})

  code = random_otp_code()
  code_hash = sha256_hex(f'{phone}:{code}')

  now = utc_now()
  expires_at = now + timedelta(milliseconds=settings.otp_ttl_ms)

  existing = db.get(OtpCode, phone)
  if existing:
    existing.code_hash = code_hash
    existing.created_at = now
    existing.expires_at = expires_at
    existing.attempts_left = settings.otp_max_attempts
  else:
    db.add(
      OtpCode(
        phone=phone,
        code_hash=code_hash,
        created_at=now,
        expires_at=expires_at,
        attempts_left=settings.otp_max_attempts,
      )
    )
  db.commit()

  phone_rate.count += 1
  phone_rate.last_sent_at_ms = now_ms
  otp_rate_by_phone[phone] = phone_rate

  ip_rate.count += 1
  otp_rate_by_ip[ip] = ip_rate

  try:
    send_otp(phone, code)
  except Exception:
    raise HTTPException(status_code=502, detail='Failed to send SMS')

  return {'ok': True}


@app.post('/api/auth/verify-otp')
def auth_verify_otp(payload: VerifyOtpIn, response: Response, db: Session = Depends(get_db)) -> dict[str, object]:
  phone = normalize_phone(payload.phone)
  code = ''.join(ch for ch in payload.code if ch.isdigit())[:6]

  if not phone or len(code) != 6:
    raise HTTPException(status_code=400, detail='Invalid input')

  record = db.get(OtpCode, phone)
  now = utc_now()

  if not record or now > record.expires_at:
    if record:
      db.delete(record)
      db.commit()
    raise HTTPException(status_code=401, detail='Invalid code')

  if record.attempts_left <= 0:
    raise HTTPException(status_code=429, detail='Too many attempts')

  incoming_hash = sha256_hex(f'{phone}:{code}')
  ok = timing_safe_equal_hex(incoming_hash, record.code_hash)

  if not ok:
    record.attempts_left -= 1
    db.commit()
    raise HTTPException(status_code=401, detail='Invalid code')

  db.delete(record)
  user = get_or_create_user(db, phone)

  token = random_session_token()
  expires_at = now + timedelta(milliseconds=settings.session_ttl_ms)

  db.add(
    DbSession(
      token=token,
      user_id=user.id,
      created_at=now,
      expires_at=expires_at,
    )
  )
  db.commit()

  response.set_cookie(
    settings.session_cookie_name,
    token,
    httponly=True,
    samesite='lax',
    secure=settings.cookie_secure,
    max_age=max(0, settings.session_ttl_ms // 1000),
    path='/',
  )

  return {'user': serialize_user(user)}


@app.patch('/api/auth/profile')
def auth_profile(
  payload: ProfilePatchIn,
  db: Session = Depends(get_db),
  user: User = Depends(require_auth),
) -> dict[str, object]:
  name = payload.name.strip()
  if not name or len(name) > 50:
    raise HTTPException(status_code=400, detail='Invalid name')

  user.name = name
  db.commit()
  db.refresh(user)
  return {'user': serialize_user(user)}


@app.get('/api/orders')
def orders_list(user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict[str, object]:
  statement = select(Order).where(Order.user_id == user.id).order_by(Order.date.desc()).limit(50)
  orders = db.execute(statement).scalars().all()
  return {'orders': [serialize_order(order) for order in orders]}


@app.post('/api/orders')
def orders_create(
  payload: CreateOrderIn,
  user: User = Depends(require_auth),
  db: Session = Depends(get_db),
) -> dict[str, object]:
  raw_items = payload.items[:100]
  items = [item.model_dump() for item in raw_items if item.id.strip() and item.title.strip()]

  if len(items) == 0:
    raise HTTPException(status_code=400, detail='Empty order')

  total = sum(float(item.get('price', 0)) * int(item.get('quantity', 1)) for item in items)

  order = Order(
    id=f'{int(time.time() * 1000)}_{secrets.token_hex(4)}',
    user_id=user.id,
    date=utc_now(),
    items=items,
    total=total,
    status='pending',
  )

  db.add(order)
  db.commit()
  db.refresh(order)

  # Enforce max orders per user (keep newest)
  statement = (
    select(Order.id)
    .where(Order.user_id == user.id)
    .order_by(Order.date.desc())
    .offset(50)
    .limit(500)
  )
  stale_ids = [row[0] for row in db.execute(statement).all()]
  if stale_ids:
    db.execute(delete(Order).where(Order.id.in_(stale_ids)))
    db.commit()

  return {'order': serialize_order(order)}


@app.post('/api/delivery/address-zone')
def delivery_address_zone(payload: dict[str, object]) -> dict[str, object]:
  address = payload.get('address')
  address_str = address.strip() if isinstance(address, str) else ''
  if not address_str:
    return {'found': False, 'formattedAddress': '', 'distance': 0, 'zone': None}

  if len(address_str) > 200:
    raise HTTPException(status_code=400, detail='Invalid address')

  return {'found': False, 'formattedAddress': '', 'distance': 0, 'zone': None}
