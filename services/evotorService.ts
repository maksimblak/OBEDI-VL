import { MenuItem } from '../types';

export const evotorService = {
  /**
   * Получение списка товаров через backend proxy.
   * Если backend/ключи не настроены — вернется пустой массив, и приложение будет использовать мок-данные.
   */
  getProducts: async (): Promise<MenuItem[]> => {
    try {
      const response = await fetch('/api/evotor/products');
      if (!response.ok) return [];

      const data = await response.json();
      return Array.isArray(data) ? (data as MenuItem[]) : [];
    } catch (error) {
      console.warn('Failed to fetch from Evotor proxy:', error);
      return [];
    }
  },
};
