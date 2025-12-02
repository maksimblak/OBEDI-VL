import { MenuItem, Category } from '../types';
import { IMAGES, FALLBACK_IMAGE } from '../data';

// ВСТАВЬТЕ СЮДА ВАШИ ДАННЫЕ ИЗ ЛИЧНОГО КАБИНЕТА РАЗРАБОТЧИКА ЭВОТОР
// https://developer.evotor.ru/
const EVOTOR_TOKEN = process.env.EVOTOR_TOKEN || ''; // Ваш токен
const STORE_UUID = process.env.STORE_UUID || '';     // UUID вашего магазина

interface EvotorProduct {
  uuid: string;
  name: string;
  price: number;
  quantity: number;
  measure_name: string;
  description?: string;
  parent_uuid?: string; // ID группы
  code?: string;
}

export const evotorService = {
  /**
   * Получение списка товаров из облака Эвотор
   */
  getProducts: async (): Promise<MenuItem[]> => {
    // Если ключи не заданы, возвращаем пустой массив (приложение будет использовать мок-данные)
    if (!EVOTOR_TOKEN || !STORE_UUID) {
      console.warn('Evotor credentials not found. Using mock data.');
      return [];
    }

    try {
      // Пример запроса к API v2 товаров
      const response = await fetch(`https://api.evotor.ru/api/v1/inventories/stores/${STORE_UUID}/products`, {
        headers: {
          'X-Authorization': EVOTOR_TOKEN,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Evotor API Error: ${response.statusText}`);
      }

      const data = await response.json();
      // Эвотор может возвращать структуру с итератором или массив, зависит от эндопоинта.
      // Здесь предполагаем массив items или data.
      const rawItems: EvotorProduct[] = Array.isArray(data) ? data : (data.items || []);

      return rawItems
        .filter(item => item.price > 0) // Берем только товары с ценой
        .map(mapEvotorToMenuItem);

    } catch (error) {
      console.error('Failed to fetch from Evotor:', error);
      return [];
    }
  }
};

/**
 * Функция для превращения "сырого" товара Эвотора в красивое блюдо для сайта
 */
const mapEvotorToMenuItem = (product: EvotorProduct): MenuItem => {
  const nameLower = product.name.toLowerCase();
  
  // 1. Определение категории по ключевым словам в названии
  let category: Category = 'lunch'; // По умолчанию
  
  if (nameLower.includes('сок') || nameLower.includes('морс') || nameLower.includes('вода') || nameLower.includes('десерт') || nameLower.includes('чизкейк')) {
    category = 'extras';
  }

  // 2. Подбор картинки по ключевым словам (так как в базовом API Эвотора картинок может не быть)
  let image = FALLBACK_IMAGE;
  
  if (nameLower.includes('суп') || nameLower.includes('борщ')) image = IMAGES.lunch5;
  else if (nameLower.includes('салат') || nameLower.includes('цезарь')) image = IMAGES.lunch2;
  else if (nameLower.includes('паста') || nameLower.includes('макарон')) image = IMAGES.lunch4;
  else if (nameLower.includes('мяс') || nameLower.includes('стейк') || nameLower.includes('говяд')) image = IMAGES.lunch6;
  else if (nameLower.includes('рыба') || nameLower.includes('лосос')) image = IMAGES.lunch1;
  else if (nameLower.includes('напит') || nameLower.includes('морс')) image = IMAGES.drink1;

  // 3. Генерация описания, если его нет
  const description = product.description || `Вкусное блюдо от шеф-повара. ${product.measure_name ? `Цена за ${product.measure_name}` : ''}`;

  return {
    id: product.uuid,
    title: product.name,
    description: description,
    price: product.price,
    weight: product.measure_name === 'кг' ? '1000г' : 'Порция', // Упрощенная логика веса
    image: image,
    category: category,
    // Генерация примерных КБЖУ, так как в Эвоторе их обычно нет (можно настроить доп. поля в Эвоторе)
    calories: Math.floor(Math.random() * (600 - 200) + 200), 
    protein: Math.floor(Math.random() * 30),
    fats: Math.floor(Math.random() * 30),
    carbs: Math.floor(Math.random() * 60),
    availableDays: [1, 2, 3, 4, 5, 6, 0] // Доступно каждый день
  };
};