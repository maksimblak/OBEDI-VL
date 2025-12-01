
export type Category = 'lunch' | 'pies' | 'catering' | 'extras';

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  price: number;
  weight: string;
  image: string;
  video?: string;
  category: Category;
  calories?: number;
  protein?: number;
  fats?: number;
  carbs?: number;
  tags?: string[];
  availableDays?: number[]; // 1 = Mon, 2 = Tue, etc. If undefined, available always.
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  loyaltyPoints: number;
  joinedDate: string;
}

export interface Order {
  id: string;
  userId?: string; // Optional linkage to user
  date: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'delivered';
}