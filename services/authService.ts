import { User } from '../types';

const USER_STORAGE_KEY = 'obedi_vl_user';
const USER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type UserEnvelopeV1 = {
  v: 1;
  expiresAt: number;
  value: User;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isUser = (value: unknown): value is User => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.phone === 'string' &&
    typeof value.name === 'string' &&
    typeof value.loyaltyPoints === 'number' &&
    typeof value.joinedDate === 'string'
  );
};

const isUserEnvelopeV1 = (value: unknown): value is UserEnvelopeV1 => {
  if (!isRecord(value)) return false;
  return value.v === 1 && typeof value.expiresAt === 'number' && isUser(value.value);
};

const readUserFromStorage = (): User | null => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    // New format (envelope with TTL)
    if (isUserEnvelopeV1(parsed)) {
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
      }
      return parsed.value;
    }

    // Legacy format (plain user)
    if (isUser(parsed)) {
      writeUserToStorage(parsed);
      return parsed;
    }

    return null;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const writeUserToStorage = (user: User): void => {
  const envelope: UserEnvelopeV1 = {
    v: 1,
    expiresAt: Date.now() + USER_TTL_MS,
    value: user,
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(envelope));
};

export const authService = {
  // Simulate sending SMS
  sendOtp: async (_phone: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 1500); // Simulate network delay
    });
  },

  // Simulate verifying SMS code (Mock code is 0000)
  verifyOtp: async (phone: string, code: string): Promise<User | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (code !== '0000') {
          resolve(null);
          return;
        }

        const existing = readUserFromStorage();
        if (existing?.phone === phone) {
          resolve(existing);
          return;
        }

        const user: User = {
          id: phone, // Simple ID based on phone for this demo
          phone,
          name: 'Гость', // Default name
          loyaltyPoints: 150, // Welcome bonus
          joinedDate: new Date().toISOString(),
        };

        writeUserToStorage(user);
        resolve(user);
      }, 1000);
    });
  },

  getCurrentUser: (): User | null => {
    return readUserFromStorage();
  },

  updateProfile: (user: User): void => {
    writeUserToStorage(user);
  },

  logout: (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
  },
};
