
import { CartItem, Order } from '../types';

const STORAGE_KEY = 'obedi_vl_history';

export const historyService = {
  saveOrder: (items: CartItem[], total: number, userId?: string) => {
    const newOrder: Order = {
      id: Date.now().toString(),
      userId: userId,
      date: new Date().toISOString(),
      items,
      total,
      status: 'pending'
    };
    
    // Get all orders
    const history = historyService.getAllOrdersRaw();
    // Add new one
    const updatedHistory = [newOrder, ...history];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return newOrder;
  },

  // Internal method to get everything from storage
  getAllOrdersRaw: (): Order[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse history", e);
      return [];
    }
  },

  // Get orders specific to a user (or all if no userId provided, acting as local guest cache)
  getOrders: (userId?: string): Order[] => {
    const all = historyService.getAllOrdersRaw();
    if (!userId) {
       // Return only orders without a userId (guest orders)
       return all.filter(o => !o.userId).slice(0, 5);
    }
    // Return orders for this user + recent guest orders (optional merge logic could go here)
    return all.filter(o => o.userId === userId);
  },

  getLastOrder: (userId?: string): Order | null => {
    const orders = historyService.getOrders(userId);
    return orders.length > 0 ? orders[0] : null;
  }
};
