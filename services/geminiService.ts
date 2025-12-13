import { MenuItem } from '../types';

type ChefHistoryItem = { role: 'user' | 'model'; text: string };

export type ZoneResult = {
  found: boolean;
  zone: 'green' | 'yellow' | 'red' | null;
  distance: number;
  formattedAddress: string;
};

const API_BASE = '/api';

const safeZoneFallback: ZoneResult = { found: false, zone: null, distance: 0, formattedAddress: '' };

const postJson = async <T>(url: string, body: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
  }

  return response.json() as Promise<T>;
};

const normalizeZoneResult = (input: unknown): ZoneResult => {
  if (!input || typeof input !== 'object') return safeZoneFallback;

  const maybe = input as Partial<Record<string, unknown>>;

  const found = typeof maybe.found === 'boolean' ? maybe.found : false;
  const formattedAddress = typeof maybe.formattedAddress === 'string' ? maybe.formattedAddress : '';
  const distance = typeof maybe.distance === 'number' && Number.isFinite(maybe.distance) ? maybe.distance : 0;
  const zone =
    maybe.zone === 'green' || maybe.zone === 'yellow' || maybe.zone === 'red' ? maybe.zone : null;

  const normalizedDistance = Math.max(0, Math.round(distance * 10) / 10);

  return {
    found,
    formattedAddress,
    distance: normalizedDistance,
    zone,
  };
};

export const getChefRecommendation = async (
  userMessage: string,
  history: ChefHistoryItem[],
  menuItems: MenuItem[]
): Promise<string> => {
  try {
    const result = await postJson<{ text?: string }>(`${API_BASE}/ai/recommendation`, {
      message: userMessage,
      history,
      menuItems,
    });

    return result.text || 'Извините, я сейчас на кухне и не расслышал. Повторите, пожалуйста?';
  } catch (error) {
    console.error('Chef API Error:', error);
    return 'Мой электронный блокнот рецептов временно недоступен. Попробуйте выбрать что-то из меню!';
  }
};

export const checkAddressZone = async (address: string): Promise<ZoneResult> => {
  try {
    const result = await postJson<unknown>(`${API_BASE}/ai/address-zone`, { address });
    return normalizeZoneResult(result);
  } catch (e) {
    console.error('Zone check error:', e);
    return safeZoneFallback;
  }
};
