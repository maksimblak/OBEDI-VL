import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const DIST_DIR = path.join(__dirname, 'dist');

const PORT = Number(process.env.PORT || 3001);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ENV_LOCAL_PATH = path.join(__dirname, '.env.local');
const EVOTOR_TOKEN_STORE_PATH = process.env.EVOTOR_TOKEN_STORE_PATH
  ? path.resolve(__dirname, String(process.env.EVOTOR_TOKEN_STORE_PATH))
  : path.join(__dirname, '.evotor', 'tokens.json');
const EVOTOR_V2_MIME = 'application/vnd.evotor.v2+json';

const getEvotorCloudToken = () => (process.env.EVOTOR_CLOUD_TOKEN || process.env.EVOTOR_TOKEN || '').trim();
const getEvotorStoreUuid = () => (process.env.STORE_UUID || '').trim();
const getEvotorWebhookAuthToken = () => (process.env.EVOTOR_WEBHOOK_AUTH_TOKEN || '').trim();
const getEvotorWebhookBasicUser = () => (process.env.EVOTOR_WEBHOOK_BASIC_USER || '').trim();
const getEvotorWebhookBasicPass = () => (process.env.EVOTOR_WEBHOOK_BASIC_PASS || '').trim();
const getEvotorStoreId = () => (process.env.EVOTOR_STORE_ID || '').trim();

const normalizeEnvValue = (value) => {
  if (typeof value !== 'string') return '';
  if (value.includes('\n') || value.includes('\r')) {
    throw new Error('Invalid env value: newlines are not supported');
  }
  return value;
};

const upsertEnvVar = async (filePath, key, value) => {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey) {
    throw new Error('Env var key is required');
  }

  const normalizedValue = normalizeEnvValue(String(value ?? ''));

  let content = '';
  try {
    content = await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const lines = content.length > 0 ? content.split(/\r?\n/) : [];
  let replaced = false;

  const updatedLines = lines.map((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('#')) return line;

    const match = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(trimmed);
    if (!match) return line;

    if (match[1] !== normalizedKey) return line;

    replaced = true;
    const leading = line.slice(0, line.length - trimmed.length);
    return `${leading}${normalizedKey}=${normalizedValue}`;
  });

  if (!replaced) {
    updatedLines.push(`${normalizedKey}=${normalizedValue}`);
  }

  const normalizedContent = updatedLines.join('\n').replace(/\n*$/, '\n');
  await fs.promises.writeFile(filePath, normalizedContent, 'utf8');
};

const timingSafeEqualString = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  try {
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
};

const parseBasicAuthHeader = (authorizationHeader) => {
  if (typeof authorizationHeader !== 'string') return null;
  const header = authorizationHeader.trim();
  const match = /^Basic\s+(.+)$/i.exec(header);
  if (!match) return null;

  const encoded = match[1].trim();
  if (!encoded) return null;

  let decoded = '';
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex < 0) return null;

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  return { username, password };
};

const isEvotorWebhookAuthorized = (authorizationHeader) => {
  const header = typeof authorizationHeader === 'string' ? authorizationHeader.trim() : '';

  const basicUser = getEvotorWebhookBasicUser();
  const basicPass = getEvotorWebhookBasicPass();
  const basicConfigured = Boolean(basicUser || basicPass);
  const basicReady = Boolean(basicUser && basicPass);
  const wantsBasic = /^Basic\s+/i.test(header);

  if (wantsBasic) {
    if (basicConfigured && !basicReady) return false;
    if (!basicReady) return false;

    const parsed = parseBasicAuthHeader(header);
    if (!parsed) return false;

    if (!timingSafeEqualString(parsed.username, basicUser)) return false;
    if (!timingSafeEqualString(parsed.password, basicPass)) return false;
    return true;
  }

  const expected = getEvotorWebhookAuthToken();
  if (!expected) {
    if (!basicConfigured) return true;
    return false;
  }

  const variants = new Set([expected, `Bearer ${expected}`]);
  if (expected.toLowerCase().startsWith('bearer ')) {
    variants.add(expected.slice('bearer '.length));
  }

  for (const candidate of variants) {
    if (timingSafeEqualString(header, candidate)) return true;
  }

  return false;
};

const requireEvotorWebhookAuth = (req, res, next) => {
  const authorized = isEvotorWebhookAuthorized(req.headers.authorization);
  if (!authorized) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

const fetchWithTimeout = async (url, options, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const ensureParentDir = async (filePath) => {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
};

const readJsonFile = async (filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};

const writeJsonFile = async (filePath, value) => {
  await ensureParentDir(filePath);
  const normalized = JSON.stringify(value, null, 2).replace(/\n?$/, '\n');
  await fs.promises.writeFile(filePath, normalized, 'utf8');
};

const normalizeEvotorWebhookPayload = (body) => {
  const payload = body && typeof body === 'object' ? body : {};

  const userIdCandidates = [payload.userId, payload.user_id, payload.userUUID, payload.userUuid, payload.ownerId];
  const tokenCandidates = [payload.token, payload.cloudToken, payload.appToken, payload.applicationToken];

  const userId = userIdCandidates.find((v) => typeof v === 'string' && v.trim().length > 0);
  const token = tokenCandidates.find((v) => typeof v === 'string' && v.trim().length > 0);

  return {
    userId: typeof userId === 'string' ? userId.trim() : '',
    token: typeof token === 'string' ? token.trim() : '',
  };
};

const readEvotorTokenStore = async () => {
  const data = await readJsonFile(EVOTOR_TOKEN_STORE_PATH);
  if (!data || typeof data !== 'object') return { users: {} };

  const users = data.users && typeof data.users === 'object' ? data.users : {};
  return { ...data, users };
};

const upsertEvotorUserToken = async ({ userId, token, storeId = '', storeUuid = '' }) => {
  const normalizedUserId = String(userId || '').trim() || 'default';
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) throw new Error('token is required');

  const store = await readEvotorTokenStore();
  const existing = store.users[normalizedUserId] && typeof store.users[normalizedUserId] === 'object' ? store.users[normalizedUserId] : {};

  store.users[normalizedUserId] = {
    ...existing,
    token: normalizedToken,
    storeId: String(storeId || existing.storeId || '').trim(),
    storeUuid: String(storeUuid || existing.storeUuid || '').trim(),
    receivedAt: new Date().toISOString(),
  };

  await writeJsonFile(EVOTOR_TOKEN_STORE_PATH, store);
  return store.users[normalizedUserId];
};

const resolveEvotorCloudToken = async (req) => {
  const queryUserId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  if (queryUserId) {
    const store = await readEvotorTokenStore();
    const record = store.users[queryUserId];
    if (record && typeof record === 'object') {
      const token = typeof record.token === 'string' ? record.token.trim() : '';
      if (token) return { token, source: `tokenStore:${queryUserId}` };
    }
    return { token: '', source: `tokenStore:${queryUserId}` };
  }

  const envToken = getEvotorCloudToken();
  if (envToken) {
    const source = (process.env.EVOTOR_CLOUD_TOKEN || '').trim() ? 'env:EVOTOR_CLOUD_TOKEN' : 'env:EVOTOR_TOKEN';
    return { token: envToken, source };
  }

  return { token: '', source: 'none' };
};

const fetchEvotorStores = async (cloudToken) => {
  const response = await fetchWithTimeout('https://api.evotor.ru/api/v1/inventories/stores/search', {
    headers: {
      'X-Authorization': cloudToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Evotor stores lookup failed (${response.status}): ${details.slice(0, 200)}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data?.items || [];
};

const fetchEvotorCloudJson = async (url, cloudToken, options = {}) => {
  const token = String(cloudToken || '').trim();
  if (!token) throw new Error('Evotor cloud token is required');

  const request = async (headers) => {
    const response = await fetchWithTimeout(url, {
      method: options.method || 'GET',
      headers: {
        Accept: EVOTOR_V2_MIME,
        'Content-Type': EVOTOR_V2_MIME,
        ...headers,
        ...(options.headers || {}),
      },
    });
    return response;
  };

  const authHeader = token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`;

  let response = await request({ Authorization: authHeader });
  if (!response.ok && (response.status === 401 || response.status === 403)) {
    response = await request({ 'x-authorization': token });
  }

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Evotor Cloud request failed (${response.status}): ${details.slice(0, 300)}`);
  }

  return await response.json();
};

const fetchEvotorCloudStores = async (cloudToken) => {
  const data = await fetchEvotorCloudJson('https://api.evotor.ru/stores', cloudToken);
  return Array.isArray(data) ? data : [];
};

const fetchEvotorCloudProducts = async (cloudToken, storeId, { cursor, since } = {}) => {
  const normalizedStoreId = String(storeId || '').trim();
  if (!normalizedStoreId) throw new Error('storeId is required');

  const url = new URL(`https://api.evotor.ru/stores/${encodeURIComponent(normalizedStoreId)}/products`);
  if (typeof cursor === 'string' && cursor.trim()) url.searchParams.set('cursor', cursor.trim());
  if (typeof since === 'string' && since.trim()) url.searchParams.set('since', since.trim());
  if (typeof since === 'number' && Number.isFinite(since)) url.searchParams.set('since', String(Math.trunc(since)));

  return await fetchEvotorCloudJson(url.toString(), cloudToken);
};
const SMS_PROVIDER = (process.env.SMS_PROVIDER || 'console').toLowerCase();
const SMS_RU_API_ID = process.env.SMS_RU_API_ID || '';
const SMS_SENDER = process.env.SMS_SENDER || 'ObediVL';

const OTP_TTL_MS = Number(process.env.OTP_TTL_MS || 5 * 60 * 1000);
const OTP_RESEND_COOLDOWN_MS = Number(process.env.OTP_RESEND_COOLDOWN_MS || 30 * 1000);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_MAX_REQUESTS_PER_HOUR_PHONE = Number(process.env.OTP_MAX_REQUESTS_PER_HOUR_PHONE || 5);
const OTP_MAX_REQUESTS_PER_HOUR_IP = Number(process.env.OTP_MAX_REQUESTS_PER_HOUR_IP || 20);

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'obedi_session';
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000);
const COOKIE_SECURE = (process.env.COOKIE_SECURE || '').toLowerCase() === 'true';

const TRUST_PROXY_HEADERS = (process.env.TRUST_PROXY_HEADERS || '').toLowerCase() === 'true';
const TRUSTED_PROXY_IPS = String(process.env.TRUSTED_PROXY_IPS || '').trim();

const CSRF_ORIGIN_CHECK = (process.env.CSRF_ORIGIN_CHECK || '').toLowerCase() === 'true';

const CORS_ORIGINS = String(process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => value.replace(/\/$/, ''));
const corsOriginsSet = new Set(CORS_ORIGINS);

const AI_MAX_REQUESTS_PER_MINUTE_IP = Number(process.env.AI_MAX_REQUESTS_PER_MINUTE_IP || 10);
const AI_MAX_REQUESTS_PER_HOUR_IP = Number(process.env.AI_MAX_REQUESTS_PER_HOUR_IP || 60);

const DELIVERY_MAX_REQUESTS_PER_MINUTE_IP = Number(process.env.DELIVERY_MAX_REQUESTS_PER_MINUTE_IP || 30);
const DELIVERY_MAX_REQUESTS_PER_HOUR_IP = Number(process.env.DELIVERY_MAX_REQUESTS_PER_HOUR_IP || 600);

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop';

const IMAGES = {
  lunch1: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop',
  lunch2: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop',
  lunch4: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1000&auto=format&fit=crop',
  lunch5: 'https://images.unsplash.com/photo-1547592166-23acbe346499?q=80&w=1000&auto=format&fit=crop',
  lunch6: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=1000&auto=format&fit=crop',
  drink1: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop',
};

const RESTAURANT_COORDS = { lat: 43.096362, lon: 131.916723 };
const VLADIVOSTOK_BOUNDS = { minLat: 42.8, maxLat: 43.3, minLon: 131.6, maxLon: 132.3 };
const DELIVERY_ZONE_CACHE_TTL_MS = Number(process.env.DELIVERY_ZONE_CACHE_TTL_MS || 24 * 60 * 60 * 1000);
const deliveryZoneCache = new Map(); // addressKey -> { value, expiresAt }

const BASE_INSTRUCTION = `
You are "Chef Alex", the AI culinary assistant for "Obedi VL", a premium food delivery service in Vladivostok.
Your tone is warm, appetizing, and helpful. You speak Russian.

RULES:
1. Use the provided MENU CONTEXT to answer questions. Do not invent dishes.
2. If the user asks for a recommendation or specific dish that exists in the menu, you MUST append a hidden tag at the very end of your response: "||REC_ID:item_id||".
3. Only tag ONE item per response (the most relevant one).
4. Keep text responses concise (under 50 words).
5. Suggest specific items based on their ingredients (calories, protein, etc).

MENU CONTEXT:
`.trim();

const normalizeOrigin = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\/$/, '');
};

const withCors = (req, res, next) => {
  const origin = normalizeOrigin(req.headers.origin);
  if (origin && corsOriginsSet.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
};

const withSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()'
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  const cspParts = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "media-src 'self' https:",
    "connect-src 'self'",
  ];

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').trim().toLowerCase();
  const secureContext = COOKIE_SECURE || forwardedProto === 'https';
  if (secureContext) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    cspParts.push('upgrade-insecure-requests');
  }

  res.setHeader('Content-Security-Policy', cspParts.join('; '));

  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
};

const csrfOriginCheck = (req, res, next) => {
  if (!CSRF_ORIGIN_CHECK) return next();

  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  if (!req.path.startsWith('/api')) return next();

  const token = getCookie(req, SESSION_COOKIE_NAME);
  if (!token) return next();

  const origin = normalizeOrigin(req.headers.origin);
  if (!origin || !corsOriginsSet.has(origin)) {
    res.status(403).json({ error: 'CSRF blocked' });
    return;
  }

  next();
};

const normalizeAddressZone = (input) => {
  const fallback = { found: false, formattedAddress: '', distance: 0, zone: null };

  if (!input || typeof input !== 'object') return fallback;
  const maybe = input;

  const found = typeof maybe.found === 'boolean' ? maybe.found : false;
  const formattedAddress = typeof maybe.formattedAddress === 'string' ? maybe.formattedAddress : '';
  const distanceRaw = typeof maybe.distance === 'number' && Number.isFinite(maybe.distance) ? maybe.distance : 0;
  const distance = Math.max(0, Math.round(distanceRaw * 10) / 10);

  const zoneFromDistance = distance <= 4 ? 'green' : distance <= 8 ? 'yellow' : distance <= 15 ? 'red' : null;

  if (!found) {
    return { found: false, formattedAddress, distance: 0, zone: null };
  }

  return {
    found: true,
    formattedAddress,
    distance,
    zone: zoneFromDistance,
  };
};

const getCachedDeliveryZone = (addressKey) => {
  const entry = deliveryZoneCache.get(addressKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    deliveryZoneCache.delete(addressKey);
    return null;
  }
  return entry.value;
};

const setCachedDeliveryZone = (addressKey, value) => {
  deliveryZoneCache.set(addressKey, { value, expiresAt: Date.now() + DELIVERY_ZONE_CACHE_TTL_MS });
};

const isWithinVladivostokBounds = (lat, lon) => {
  return (
    lat >= VLADIVOSTOK_BOUNDS.minLat &&
    lat <= VLADIVOSTOK_BOUNDS.maxLat &&
    lon >= VLADIVOSTOK_BOUNDS.minLon &&
    lon <= VLADIVOSTOK_BOUNDS.maxLon
  );
};

const geocodeAddress = async (address) => {
  const query = `${address}, Vladivostok`;
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'ru',
    q: query,
    viewbox: `${VLADIVOSTOK_BOUNDS.minLon},${VLADIVOSTOK_BOUNDS.maxLat},${VLADIVOSTOK_BOUNDS.maxLon},${VLADIVOSTOK_BOUNDS.minLat}`,
    bounded: '1',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { 'User-Agent': 'obedi-vl/1.0 (server)' },
    signal: AbortSignal.timeout(7000),
  });

  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  const first = Array.isArray(data) ? data[0] : null;
  if (!first || typeof first !== 'object') return null;

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (!isWithinVladivostokBounds(lat, lon)) return null;

  const displayName = String(first.display_name || '').slice(0, 200);
  return { lat, lon, displayName };
};

const osrmDistanceKm = async (from, to) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false&alternatives=false&steps=false`;
  const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  const meters = data?.routes?.[0]?.distance;
  if (typeof meters !== 'number' || !Number.isFinite(meters) || meters <= 0) return null;
  return Math.max(0, Math.round((meters / 1000) * 10) / 10);
};

const resolveDeliveryZone = async (address) => {
  const addressKey = String(address || '').trim().toLowerCase();
  if (!addressKey) return normalizeAddressZone({ found: false, formattedAddress: '', distance: 0, zone: null });

  const cached = getCachedDeliveryZone(addressKey);
  if (cached) return cached;

  try {
    const geo = await geocodeAddress(address);
    if (!geo) {
      const result = normalizeAddressZone({ found: false, formattedAddress: '', distance: 0, zone: null });
      setCachedDeliveryZone(addressKey, result);
      return result;
    }

    const distance = await osrmDistanceKm(RESTAURANT_COORDS, { lat: geo.lat, lon: geo.lon });
    if (distance === null) {
      const result = normalizeAddressZone({ found: false, formattedAddress: geo.displayName, distance: 0, zone: null });
      setCachedDeliveryZone(addressKey, result);
      return result;
    }

    const result = normalizeAddressZone({ found: true, formattedAddress: geo.displayName, distance, zone: null });
    setCachedDeliveryZone(addressKey, result);
    return result;
  } catch (e) {
    console.warn('Delivery zone lookup failed:', e);
    const result = normalizeAddressZone({ found: false, formattedAddress: '', distance: 0, zone: null });
    setCachedDeliveryZone(addressKey, result);
    return result;
  }
};

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const stableRange = (seed, min, maxExclusive) => {
  const span = Math.max(1, maxExclusive - min);
  return min + (seed % span);
};

const mapEvotorToMenuItem = (product) => {
  const nameLower = String(product.name || '').toLowerCase();

  let category = 'lunch';
  if (
    nameLower.includes('сок') ||
    nameLower.includes('морс') ||
    nameLower.includes('вода') ||
    nameLower.includes('десерт') ||
    nameLower.includes('чизкейк')
  ) {
    category = 'extras';
  }

  let image = FALLBACK_IMAGE;
  if (nameLower.includes('суп') || nameLower.includes('борщ')) image = IMAGES.lunch5;
  else if (nameLower.includes('салат') || nameLower.includes('цезарь')) image = IMAGES.lunch2;
  else if (nameLower.includes('паста') || nameLower.includes('макарон')) image = IMAGES.lunch4;
  else if (nameLower.includes('мяс') || nameLower.includes('стейк') || nameLower.includes('говяд')) image = IMAGES.lunch6;
  else if (nameLower.includes('рыба') || nameLower.includes('лосос')) image = IMAGES.lunch1;
  else if (nameLower.includes('напит') || nameLower.includes('морс')) image = IMAGES.drink1;

  const description =
    product.description ||
    `Вкусное блюдо от шеф-повара. ${product.measure_name ? `Цена за ${product.measure_name}` : ''}`;

  const seed = hashString(String(product.uuid || product.name || ''));

  return {
    id: String(product.uuid || ''),
    title: String(product.name || ''),
    description: String(description),
    price: Number(product.price || 0),
    weight: product.measure_name === 'кг' ? '1000г' : 'Порция',
    image,
    category,
    calories: stableRange(seed, 200, 600),
    protein: stableRange(seed >> 1, 0, 30),
    fats: stableRange(seed >> 2, 0, 30),
    carbs: stableRange(seed >> 3, 0, 60),
    availableDays: [1, 2, 3, 4, 5, 6, 0],
  };
};

const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

const normalizePhone = (raw) => {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return null;

  // RU-friendly normalization:
  // - 10 digits: assume local, prefix +7
  // - 11 digits starting with 8 or 7: normalize to +7XXXXXXXXXX
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && (digits.startsWith('8') || digits.startsWith('7'))) {
    return `+7${digits.slice(1)}`;
  }

  // Generic E.164-ish fallback (up to 15 digits)
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
};

const getClientIp = (req) => {
  const ip = typeof req.ip === 'string' ? req.ip : '';
  if (ip) return ip;

  const remote = req.socket?.remoteAddress;
  if (typeof remote === 'string' && remote) return remote;

  return 'unknown';
};

const rateBuckets = new Map(); // key -> { count, resetAtMs }

const consumeFixedWindow = (key, limit, windowMs, nowMs = Date.now()) => {
  const normalizedKey = String(key || 'unknown');
  const normalizedLimit = Number(limit);
  const normalizedWindowMs = Number(windowMs);
  if (!Number.isFinite(normalizedLimit) || normalizedLimit <= 0) return null;
  if (!Number.isFinite(normalizedWindowMs) || normalizedWindowMs <= 0) return null;

  const bucket = rateBuckets.get(normalizedKey) || { count: 0, resetAtMs: nowMs + normalizedWindowMs };
  if (nowMs > bucket.resetAtMs) {
    bucket.count = 0;
    bucket.resetAtMs = nowMs + normalizedWindowMs;
  }

  if (bucket.count >= normalizedLimit) {
    rateBuckets.set(normalizedKey, bucket);
    return Math.max(0, bucket.resetAtMs - nowMs);
  }

  bucket.count += 1;
  rateBuckets.set(normalizedKey, bucket);
  return null;
};

const getCookie = (req, name) => {
  const header = req.headers.cookie;
  if (!header) return null;
  const parts = header.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
};

const sha256Hex = (value) => crypto.createHash('sha256').update(value).digest('hex');

const timingSafeEqualHex = (aHex, bHex) => {
  if (typeof aHex !== 'string' || typeof bHex !== 'string') return false;
  if (aHex.length !== bHex.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(aHex, 'hex'), Buffer.from(bHex, 'hex'));
  } catch {
    return false;
  }
};

const otpStoreByPhone = new Map(); // phone -> { codeHash, expiresAt, attemptsLeft }
const otpRateByPhone = new Map(); // phone -> { count, resetAt, lastSentAt }
const otpRateByIp = new Map(); // ip -> { count, resetAt }

const sessionsByToken = new Map(); // token -> { userPhone, expiresAt }

const USERS_DIR = path.join(__dirname, 'server-data');
const USERS_FILE = path.join(USERS_DIR, 'users.json');
const ORDERS_FILE = path.join(USERS_DIR, 'orders.json');
const MAX_ORDERS_PER_USER = 50;

if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR, { recursive: true });

const loadUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) return {};
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
};

const saveUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save users:', e);
  }
};

let usersByPhone = loadUsers(); // { "+7...": User }

const loadOrders = () => {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return {};
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
};

const saveOrders = (ordersByUserId) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(ordersByUserId, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save orders:', e);
  }
};

let ordersByUserId = loadOrders(); // { userId: Order[] }

const getOrdersForUser = (userId) => {
  const orders = ordersByUserId[userId];
  return Array.isArray(orders) ? orders : [];
};

const pushOrderForUser = (userId, order) => {
  const existing = getOrdersForUser(userId);
  const next = [order, ...existing].slice(0, MAX_ORDERS_PER_USER);
  ordersByUserId[userId] = next;
  saveOrders(ordersByUserId);
  return order;
};

const getOrCreateUser = (phone) => {
  const existing = usersByPhone[phone];
  if (existing && typeof existing === 'object') return existing;

  const user = {
    id: phone,
    phone,
    name: 'Гость',
    loyaltyPoints: 150,
    joinedDate: new Date().toISOString(),
  };

  usersByPhone[phone] = user;
  saveUsers(usersByPhone);
  return user;
};

const updateUser = (phone, patch) => {
  const user = getOrCreateUser(phone);
  const updated = { ...user, ...patch };
  usersByPhone[phone] = updated;
  saveUsers(usersByPhone);
  return updated;
};

const getSessionUser = (req) => {
  const token = getCookie(req, SESSION_COOKIE_NAME);
  if (!token) return null;

  const session = sessionsByToken.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessionsByToken.delete(token);
    return null;
  }

  return usersByPhone[session.userPhone] || null;
};

const requireAuth = (req, res, next) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = user;
  next();
};

const sendOtp = async (phone, code) => {
  const text = `Obedi VL: код ${code}. Никому не сообщайте.`;

  if (SMS_PROVIDER === 'console') {
    console.log(`[OTP][console] ${phone}: ${code}`);
    return;
  }

  if (SMS_PROVIDER === 'smsru') {
    if (!SMS_RU_API_ID) throw new Error('SMS_RU_API_ID is not configured');

    const params = new URLSearchParams({
      api_id: SMS_RU_API_ID,
      to: phone.replace(/\D/g, ''),
      msg: text,
      json: '1',
      from: SMS_SENDER,
    });

    const response = await fetch(`https://sms.ru/sms/send?${params.toString()}`);
    if (!response.ok) throw new Error(`SMS.RU failed: ${response.status} ${response.statusText}`);

    const data = await response.json().catch(() => null);
    if (!data || data.status !== 'OK') {
      throw new Error(`SMS.RU error: ${JSON.stringify(data)}`);
    }

    return;
  }

  throw new Error(`Unknown SMS_PROVIDER: ${SMS_PROVIDER}`);
};

const app = express();
app.disable('x-powered-by');

if (TRUST_PROXY_HEADERS) {
  if (TRUSTED_PROXY_IPS) {
    const entries = TRUSTED_PROXY_IPS.split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    app.set('trust proxy', entries);
  } else {
    app.set('trust proxy', true);
  }
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(withSecurityHeaders);
app.use(withCors);
app.use(csrfOriginCheck);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(GEMINI_API_KEY),
    evotorConfigured: Boolean(getEvotorCloudToken() && getEvotorStoreUuid()),
    auth: {
      smsProvider: SMS_PROVIDER,
      smsConfigured: SMS_PROVIDER === 'console' ? true : Boolean(SMS_RU_API_ID),
      cookieSecure: COOKIE_SECURE,
    },
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  res.json({ user: user || null });
});

app.post('/api/auth/logout', (req, res) => {
  const token = getCookie(req, SESSION_COOKIE_NAME);
  if (token) sessionsByToken.delete(token);

  res.cookie(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE,
    maxAge: 0,
    path: '/',
  });

  res.json({ ok: true });
});

app.post(
  '/api/auth/request-otp',
  asyncHandler(async (req, res) => {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) {
      res.status(400).json({ error: 'Invalid phone' });
      return;
    }

    const ip = getClientIp(req);
    const now = Date.now();

    const phoneRate = otpRateByPhone.get(phone) || { count: 0, resetAt: now + 60 * 60 * 1000, lastSentAt: 0 };
    if (now > phoneRate.resetAt) {
      phoneRate.count = 0;
      phoneRate.resetAt = now + 60 * 60 * 1000;
    }

    const ipRate = otpRateByIp.get(ip) || { count: 0, resetAt: now + 60 * 60 * 1000 };
    if (now > ipRate.resetAt) {
      ipRate.count = 0;
      ipRate.resetAt = now + 60 * 60 * 1000;
    }

    if (now - phoneRate.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      res.status(429).json({ error: 'Too many requests', retryAfterMs: OTP_RESEND_COOLDOWN_MS - (now - phoneRate.lastSentAt) });
      return;
    }

    if (phoneRate.count >= OTP_MAX_REQUESTS_PER_HOUR_PHONE || ipRate.count >= OTP_MAX_REQUESTS_PER_HOUR_IP) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const codeHash = sha256Hex(`${phone}:${code}`);

    otpStoreByPhone.set(phone, {
      codeHash,
      expiresAt: now + OTP_TTL_MS,
      attemptsLeft: OTP_MAX_ATTEMPTS,
    });

    phoneRate.count += 1;
    phoneRate.lastSentAt = now;
    otpRateByPhone.set(phone, phoneRate);

    ipRate.count += 1;
    otpRateByIp.set(ip, ipRate);

    try {
      await sendOtp(phone, code);
    } catch (e) {
      console.error('Failed to send OTP:', e);
      res.status(502).json({ error: 'Failed to send SMS' });
      return;
    }

    res.json({ ok: true });
  })
);

app.post(
  '/api/auth/verify-otp',
  asyncHandler(async (req, res) => {
    const phone = normalizePhone(req.body?.phone);
    const codeRaw = typeof req.body?.code === 'string' ? req.body.code : '';
    const code = codeRaw.replace(/\D/g, '').slice(0, 6);

    if (!phone || code.length !== 6) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    const record = otpStoreByPhone.get(phone);
    if (!record || Date.now() > record.expiresAt) {
      otpStoreByPhone.delete(phone);
      res.status(401).json({ error: 'Invalid code' });
      return;
    }

    if (record.attemptsLeft <= 0) {
      res.status(429).json({ error: 'Too many attempts' });
      return;
    }

    const incomingHash = sha256Hex(`${phone}:${code}`);
    const ok = timingSafeEqualHex(incomingHash, record.codeHash);

    if (!ok) {
      record.attemptsLeft -= 1;
      otpStoreByPhone.set(phone, record);
      res.status(401).json({ error: 'Invalid code' });
      return;
    }

    otpStoreByPhone.delete(phone);

    const user = getOrCreateUser(phone);

    const token = crypto.randomBytes(32).toString('base64url');
    sessionsByToken.set(token, { userPhone: phone, expiresAt: Date.now() + SESSION_TTL_MS });

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: COOKIE_SECURE,
      maxAge: SESSION_TTL_MS,
      path: '/',
    });

    res.json({ user });
  })
);

app.patch(
  '/api/auth/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 50) {
      res.status(400).json({ error: 'Invalid name' });
      return;
    }

    const phone = req.user.phone;
    const updated = updateUser(phone, { name });
    res.json({ user: updated });
  })
);

app.get(
  '/api/orders',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = getOrdersForUser(req.user.id);
    res.json({ orders });
  })
);

app.post(
  '/api/orders',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

    const items = rawItems
      .slice(0, 100)
      .map((raw) => {
        if (!raw || typeof raw !== 'object') return null;
        const maybe = raw;

        const id = typeof maybe.id === 'string' ? maybe.id : '';
        const title = typeof maybe.title === 'string' ? maybe.title : '';
        const price = Number(maybe.price || 0);
        const quantity = Math.max(1, Math.min(99, Math.floor(Number(maybe.quantity || 1))));

        if (!id || !title || !Number.isFinite(price) || price < 0) return null;
        return { ...maybe, id, title, price, quantity };
      })
      .filter(Boolean);

    if (items.length === 0) {
      res.status(400).json({ error: 'Empty order' });
      return;
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = {
      id: `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: req.user.id,
      date: new Date().toISOString(),
      items,
      total,
      status: 'pending',
    };

    pushOrderForUser(req.user.id, order);
    res.json({ order });
  })
);

app.post(
  '/api/delivery/address-zone',
  asyncHandler(async (req, res) => {
    const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
    if (!address) {
      res.json({ found: false, formattedAddress: '', distance: 0, zone: null });
      return;
    }

    if (address.length > 200) {
      res.status(400).json({ error: 'Invalid address' });
      return;
    }

    const result = await resolveDeliveryZone(address);
    res.json(result);
  })
);

app.post(
  '/api/ai/recommendation',
  asyncHandler(async (req, res) => {
    if (!GEMINI_API_KEY) {
      res.status(501).json({ error: 'GEMINI_API_KEY is not configured' });
      return;
    }

    const message = typeof req.body?.message === 'string' ? req.body.message : '';
    if (!message.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const historyRaw = Array.isArray(req.body?.history) ? req.body.history : [];
    const menuItemsRaw = Array.isArray(req.body?.menuItems) ? req.body.menuItems : [];

    const history = historyRaw
      .slice(-20)
      .map((h) => ({
        role: h?.role === 'user' ? 'user' : 'model',
        text: String(h?.text || '').replace(/\|\|REC_ID:.*?\|\|/g, ''),
      }))
      .filter((h) => h.text.trim().length > 0);

    const menuContext = menuItemsRaw
      .slice(0, 300)
      .map((item) => {
        const id = String(item?.id || '');
        const title = String(item?.title || '');
        const price = Number(item?.price || 0);
        const calories = Number(item?.calories || 0);
        const category = String(item?.category || '');
        const description = String(item?.description || '').slice(0, 160);
        return `ID:${id} | ${title} | ${price}₽ | ${calories}kcal | Tags: ${category} | Ingred: ${description}`;
      })
      .join('\n');

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `${BASE_INSTRUCTION}\n${menuContext}`,
        temperature: 0.4,
      },
      history: history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage({ message });
    res.json({ text: result.text || '' });
  })
);

app.post(
  '/api/ai/address-zone',
  asyncHandler(async (req, res) => {
    if (!GEMINI_API_KEY) {
      res.status(501).json({ error: 'GEMINI_API_KEY is not configured' });
      return;
    }

    const address = typeof req.body?.address === 'string' ? req.body.address : '';
    if (!address.trim()) {
      res.json({ found: false, formattedAddress: '', distance: 0, zone: null });
      return;
    }

    const prompt = `
You are the logistics engine for "Obedi VL" in Vladivostok.
Our Kitchen is at: Ulitsa Nadibaidze 28, Vladivostok.

Delivery Zones (Driving Distance):
- Green Zone: 0 - 4 km
- Yellow Zone: 4 - 8 km
- Red Zone: 8 - 15 km
- No Delivery: > 15 km

User Address Input: "${address}"

Rules:
1. If you are not confident the address exists in Vladivostok, return found=false, zone=null, distance=0.
2. Zone must be derived only from the distance thresholds above.
3. Return strictly valid JSON only.

Return:
{
  "found": boolean,
  "formattedAddress": string,
  "distance": number,
  "zone": "green" | "yellow" | "red" | null
}
    `.trim();

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });

    const rawText = response.text || '';
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      res.json({ found: false, formattedAddress: '', distance: 0, zone: null });
      return;
    }

    res.json(normalizeAddressZone(parsed));
  })
);

app.post(
  '/api/v1/user/token',
  asyncHandler(async (req, res) => {
    const authorized = isEvotorWebhookAuthorized(req.headers.authorization);
    if (!authorized) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId, token } = normalizeEvotorWebhookPayload(req.body);

    if (!token) {
      res.status(400).json({ error: 'token is required' });
      return;
    }

    await upsertEvotorUserToken({ userId, token });

    process.env.EVOTOR_CLOUD_TOKEN = token;
    await upsertEnvVar(ENV_LOCAL_PATH, 'EVOTOR_CLOUD_TOKEN', token);

    const legacyToken = (process.env.EVOTOR_TOKEN || '').trim();
    if (!legacyToken) {
      process.env.EVOTOR_TOKEN = token;
      await upsertEnvVar(ENV_LOCAL_PATH, 'EVOTOR_TOKEN', token);
    }

    let storeUuid = getEvotorStoreUuid();
    let storeId = getEvotorStoreId();
    if (!storeUuid || !storeId) {
      try {
        const stores = await fetchEvotorCloudStores(token);
        if (stores.length === 1) {
          const only = stores[0] || {};
          if (!storeId && (typeof only?.id === 'string' || typeof only?.id === 'number')) {
            storeId = String(only.id);
            process.env.EVOTOR_STORE_ID = storeId;
            await upsertEnvVar(ENV_LOCAL_PATH, 'EVOTOR_STORE_ID', storeId);
          }
          if (!storeUuid && typeof only?.uuid === 'string' && only.uuid.trim()) {
            storeUuid = only.uuid.trim();
            process.env.STORE_UUID = storeUuid;
            await upsertEnvVar(ENV_LOCAL_PATH, 'STORE_UUID', storeUuid);
          }
        }
      } catch (error) {
        try {
          const stores = await fetchEvotorStores(token);
          if (!storeUuid && stores.length === 1 && stores[0]?.uuid) {
            storeUuid = String(stores[0].uuid);
            process.env.STORE_UUID = storeUuid;
            await upsertEnvVar(ENV_LOCAL_PATH, 'STORE_UUID', storeUuid);
          }
        } catch (fallbackError) {
          console.error('Evotor store auto-detect failed:', error);
          console.error('Evotor store auto-detect fallback failed:', fallbackError);
        }
      }
    }

    if (storeUuid || storeId) {
      await upsertEvotorUserToken({ userId, token, storeId, storeUuid });
    }

    res.json({ ok: true, userId: userId || null, storeId: storeId || null, storeUuid: storeUuid || null });
  })
);

app.get(
  '/api/evotor/token-status',
  requireEvotorWebhookAuth,
  asyncHandler(async (_req, res) => {
    const resolved = await resolveEvotorCloudToken(_req);
    const envToken = getEvotorCloudToken();
    const envStoreId = getEvotorStoreId();
    const envStoreUuid = getEvotorStoreUuid();
    const envTokenHash = envToken ? crypto.createHash('sha256').update(envToken).digest('hex') : '';

    const store = await readEvotorTokenStore();
    const users = Object.entries(store.users).map(([userId, record]) => {
      const receivedAt = record && typeof record === 'object' && typeof record.receivedAt === 'string' ? record.receivedAt : null;
      const token = record && typeof record === 'object' && typeof record.token === 'string' ? record.token : '';
      const tokenHash = token ? crypto.createHash('sha256').update(token).digest('hex') : '';

      return {
        userId,
        receivedAt,
        hasToken: Boolean(token),
        tokenSha256Prefix: tokenHash ? tokenHash.slice(0, 10) : null,
        storeId: record && typeof record === 'object' && typeof record.storeId === 'string' ? record.storeId : '',
        storeUuid: record && typeof record === 'object' && typeof record.storeUuid === 'string' ? record.storeUuid : '',
      };
    });

    res.json({
      ok: true,
      env: {
        evotorCloudTokenConfigured: Boolean(envToken),
        evotorCloudTokenSource: resolved.source,
        evotorCloudTokenSha256Prefix: envTokenHash ? envTokenHash.slice(0, 10) : null,
        evotorStoreId: envStoreId || null,
        storeUuid: envStoreUuid || null,
      },
      tokenStore: {
        path: path.relative(__dirname, EVOTOR_TOKEN_STORE_PATH),
        users,
      },
    });
  })
);

app.get(
  '/api/evotor/stores',
  asyncHandler(async (_req, res) => {
    const token = getEvotorCloudToken();
    if (!token) {
      res.status(400).json({ error: 'EVOTOR_CLOUD_TOKEN is not configured' });
      return;
    }

    const stores = await fetchEvotorStores(token);
    const normalized = stores
      .map((store) => ({
        uuid: typeof store?.uuid === 'string' ? store.uuid : '',
        name: typeof store?.name === 'string' ? store.name : '',
      }))
      .filter((store) => Boolean(store.uuid));

    res.json(normalized);
  })
);

app.get(
  '/api/evotor/cloud/stores',
  requireEvotorWebhookAuth,
  asyncHandler(async (_req, res) => {
    const resolved = await resolveEvotorCloudToken(_req);
    if (!resolved.token) {
      res.status(400).json({ error: 'Evotor cloud token is not configured' });
      return;
    }

    try {
      const stores = await fetchEvotorCloudStores(resolved.token);
      res.json(stores);
    } catch (error) {
      res.status(502).json({ error: error?.message || 'Evotor Cloud request failed', tokenSource: resolved.source });
    }
  })
);

app.get(
  '/api/evotor/cloud/stores/:storeId/products',
  requireEvotorWebhookAuth,
  asyncHandler(async (req, res) => {
    const resolved = await resolveEvotorCloudToken(req);
    if (!resolved.token) {
      res.status(400).json({ error: 'Evotor cloud token is not configured' });
      return;
    }

    const storeId = typeof req.params.storeId === 'string' ? req.params.storeId.trim() : '';
    if (!storeId) {
      res.status(400).json({ error: 'storeId is required' });
      return;
    }

    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const sinceParam = typeof req.query.since === 'string' ? req.query.since.trim() : '';
    const since = sinceParam ? Number(sinceParam) : undefined;

    try {
      const products = await fetchEvotorCloudProducts(resolved.token, storeId, {
        cursor,
        since: Number.isFinite(since) ? since : sinceParam || undefined,
      });

      res.json(products);
    } catch (error) {
      res.status(502).json({ error: error?.message || 'Evotor Cloud request failed', tokenSource: resolved.source });
    }
  })
);

app.post(
  '/api/evotor/store',
  asyncHandler(async (req, res) => {
    const storeUuid = typeof req.body?.storeUuid === 'string' ? req.body.storeUuid.trim() : '';
    if (!storeUuid) {
      res.status(400).json({ error: 'storeUuid is required' });
      return;
    }

    process.env.STORE_UUID = storeUuid;
    await upsertEnvVar(ENV_LOCAL_PATH, 'STORE_UUID', storeUuid);

    res.json({ ok: true, storeUuid });
  })
);

app.get(
  '/api/evotor/products',
  asyncHandler(async (_req, res) => {
    const token = getEvotorCloudToken();
    const storeUuid = getEvotorStoreUuid();

    if (!token || !storeUuid) {
      res.json([]);
      return;
    }

    const response = await fetch(
      `https://api.evotor.ru/api/v1/inventories/stores/${encodeURIComponent(storeUuid)}/products`,
      {
        headers: {
          'X-Authorization': token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Evotor API Error:', response.status, response.statusText);
      res.json([]);
      return;
    }

    const data = await response.json();
    const rawItems = Array.isArray(data) ? data : data?.items || [];

    const items = rawItems
      .filter((item) => Number(item?.price || 0) > 0)
      .map(mapEvotorToMenuItem);

    res.json(items);
  })
);

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  res.status(404).send('Not Found');
});

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
