import { CartItem, Order } from '../types';

const STORAGE_KEY = 'obedi_vl_history';
const HISTORY_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_ORDERS = 50;

type OrdersEnvelopeV1 = {
  v: 1;
  expiresAt: number;
  value: Order[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isOrder = (value: unknown): value is Order => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    (typeof value.userId === 'string' || typeof value.userId === 'undefined') &&
    typeof value.date === 'string' &&
    Array.isArray(value.items) &&
    typeof value.total === 'number' &&
    (value.status === 'pending' || value.status === 'delivered')
  );
};

const isOrdersEnvelopeV1 = (value: unknown): value is OrdersEnvelopeV1 => {
  if (!isRecord(value)) return false;
  return (
    value.v === 1 &&
    typeof value.expiresAt === 'number' &&
    Array.isArray(value.value) &&
    value.value.every(isOrder)
  );
};

const writeOrdersToStorage = (orders: Order[]): void => {
  const envelope: OrdersEnvelopeV1 = {
    v: 1,
    expiresAt: Date.now() + HISTORY_TTL_MS,
    value: orders,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
};

const readOrdersFromStorage = (): Order[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);

    // New format (envelope with TTL)
    if (isOrdersEnvelopeV1(parsed)) {
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      return parsed.value;
    }

    // Legacy format (plain array)
    if (Array.isArray(parsed)) {
      const normalized = parsed.filter(isOrder).slice(0, MAX_ORDERS);
      writeOrdersToStorage(normalized);
      return normalized;
    }

    return [];
  } catch (e) {
    console.error('Failed to parse history', e);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

export const historyService = {
  saveOrder: (items: CartItem[], total: number, userId?: string) => {
    const newOrder: Order = {
      id: Date.now().toString(),
      userId,
      date: new Date().toISOString(),
      items: items.map((i) => ({ ...i })), // snapshot
      total,
      status: 'pending',
    };

    const history = readOrdersFromStorage();
    const updatedHistory = [newOrder, ...history].slice(0, MAX_ORDERS);

    writeOrdersToStorage(updatedHistory);
    return newOrder;
  },

  // Get orders specific to a user (or all if no userId provided, acting as local guest cache)
  getOrders: (userId?: string): Order[] => {
    const all = readOrdersFromStorage();
    if (!userId) {
      // Return only orders without a userId (guest orders)
      return all.filter((o) => !o.userId).slice(0, 5);
    }
    return all.filter((o) => o.userId === userId);
  },

  getLastOrder: (userId?: string): Order | null => {
    const orders = historyService.getOrders(userId);
    return orders.length > 0 ? orders[0] : null;
  },
};
