import { User } from '../types';

const API_BASE = '/api';

type ApiErrorBody = { error?: string; retryAfterMs?: number };

const readErrorBody = async (response: Response): Promise<ApiErrorBody | null> => {
  try {
    const json = (await response.json()) as unknown;
    if (!json || typeof json !== 'object') return null;
    const maybe = json as Partial<Record<string, unknown>>;
    return {
      error: typeof maybe.error === 'string' ? maybe.error : undefined,
      retryAfterMs: typeof maybe.retryAfterMs === 'number' ? maybe.retryAfterMs : undefined,
    };
  } catch {
    return null;
  }
};

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await readErrorBody(response);
    const message = body?.error || response.statusText || 'Request failed';
    const err = new Error(message);
    (err as Error & { status?: number; retryAfterMs?: number }).status = response.status;
    if (typeof body?.retryAfterMs === 'number') {
      (err as Error & { retryAfterMs?: number }).retryAfterMs = body.retryAfterMs;
    }
    throw err;
  }

  return response.json() as Promise<T>;
};

export const authService = {
  sendOtp: async (phone: string): Promise<void> => {
    await requestJson<{ ok: true }>(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  verifyOtp: async (phone: string, code: string): Promise<User> => {
    const result = await requestJson<{ user: User }>(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    return result.user;
  },

  getCurrentUser: async (): Promise<User | null> => {
    const result = await requestJson<{ user: User | null }>(`${API_BASE}/auth/me`, { method: 'GET' });
    return result.user;
  },

  updateProfile: async (name: string): Promise<User> => {
    const result = await requestJson<{ user: User }>(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    return result.user;
  },

  logout: async (): Promise<void> => {
    await requestJson<{ ok: true }>(`${API_BASE}/auth/logout`, { method: 'POST' });
  },
};

