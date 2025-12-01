import { MenuItem } from './types';

// Fallback image in case any specific image fails to load
export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop";

// High-quality dark moody food images - Updated Reliable Links
export const IMAGES = {
  hero: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop",
  // Lunches
  lunch1: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop", // Bowl
  lunch2: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop", // Salad
  lunch3: "https://images.unsplash.com/photo-1547496502-ffa7664841bc?q=80&w=1000&auto=format&fit=crop", // Meatballs/Hearty
  lunch4: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1000&auto=format&fit=crop", // Carbonara
  lunch5: "https://images.unsplash.com/photo-1547592166-23acbe346499?q=80&w=1000&auto=format&fit=crop", // Soup
  lunch6: "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=1000&auto=format&fit=crop", // Beef/Steak
  lunch7: "https://images.unsplash.com/photo-1548943487-a2e4e43b485c?q=80&w=1000&auto=format&fit=crop", // Tom Yum
  lunch8: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=1000&auto=format&fit=crop", // Caesar
  
  // Pies
  pie1: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=1000&auto=format&fit=crop", // Pie/Cake
  pie2: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?q=80&w=1000&auto=format&fit=crop", // Berry Tart
  pie3: "https://images.unsplash.com/photo-1572383672419-ab4779986b3e?q=80&w=1000&auto=format&fit=crop", // Savory Pie
  pie4: "https://images.unsplash.com/photo-1554298128-c99938877548?q=80&w=1000&auto=format&fit=crop", // Quiche

  // Catering
  catering1: "https://images.unsplash.com/photo-1572695157363-bc31c5d4efb5?q=80&w=1000&auto=format&fit=crop", // Bruschetta
  catering2: "https://images.unsplash.com/photo-1621644837549-01121d58d4a6?q=80&w=1000&auto=format&fit=crop", // Canape salmon
  catering3: "https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=1000&auto=format&fit=crop", // Burgers
  catering4: "https://images.unsplash.com/photo-1560155016-bd4879ae8f21?q=80&w=1000&auto=format&fit=crop", // Cheese plate

  // Extras
  drink1: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop", // Red drink
  drink2: "https://images.unsplash.com/photo-1536782376439-3c9da7120359?q=80&w=1000&auto=format&fit=crop", // Matcha
  dessert1: "https://images.unsplash.com/photo-1509482560494-4126f8225994?q=80&w=1000&auto=format&fit=crop", // Cheesecake
  drink3: "https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=1000&auto=format&fit=crop", // Orange Juice
  sauce1: "https://images.unsplash.com/photo-1599307221008-0138982cb12d?q=80&w=1000&auto=format&fit=crop" // Pesto
};

// Generic stock video for food
export const SAMPLE_VIDEO = "https://cdn.coverr.co/videos/coverr-slicing-an-orange-9519/1080p.mp4"; 
export const SAMPLE_VIDEO_2 = "https://cdn.coverr.co/videos/coverr-chef-preparing-food-in-kitchen-2997/1080p.mp4";

export const MOCK_MENU: MenuItem[] = [
  // --- LUNCHES ---
  { 
    id: '1', 
    title: 'Боул с лососем и киноа', 
    description: 'Свежий лосось, авокадо, киноа, огурцы, эдамаме и фирменный ореховый соус.', 
    price: 590, weight: '350г', category: 'lunch', image: IMAGES.lunch1, video: SAMPLE_VIDEO, 
    calories: 450, protein: 28, fats: 18, carbs: 42, availableDays: [1, 3, 5] 
  },
  { 
    id: '2', 
    title: 'Салат с грудкой гриль', 
    description: 'Микс салата, помидоры черри, куриное филе на гриле, пармезан, бальзамик.', 
    price: 450, weight: '300г', category: 'lunch', image: IMAGES.lunch2, 
    calories: 320, protein: 35, fats: 12, carbs: 15, availableDays: [1, 2, 4] 
  },
  { 
    id: '3', 
    title: 'Обед "Сытный"', 
    description: 'Густой томатный суп, запеченный картофель по-деревенски, мясные тефтели в соусе.', 
    price: 490, weight: '500г', category: 'lunch', image: IMAGES.lunch3, video: SAMPLE_VIDEO_2, 
    calories: 680, protein: 40, fats: 35, carbs: 55, availableDays: [2, 4, 5] 
  },
  { 
    id: '4', 
    title: 'Паста Карбонара', 
    description: 'Классическая итальянская паста с беконом, сливочным соусом и желтком.', 
    price: 520, weight: '350г', category: 'lunch', image: IMAGES.lunch4, 
    calories: 700, protein: 25, fats: 40, carbs: 60, availableDays: [3, 5] 
  },
  { 
    id: '5', 
    title: 'Куриный суп-лапша', 
    description: 'Легкий, но питательный суп с домашней лапшой, зеленью и фермерской курицей.', 
    price: 350, weight: '300г', category: 'lunch', image: IMAGES.lunch5, 
    calories: 250, protein: 15, fats: 10, carbs: 25, availableDays: [1, 2, 3, 4, 5] 
  },
  { 
    id: '6', 
    title: 'Бефстроганов с пюре', 
    description: 'Нежная говядина в сливочно-грибном соусе с воздушным картофельным пюре.', 
    price: 550, weight: '400г', category: 'lunch', image: IMAGES.lunch6, 
    calories: 620, protein: 32, fats: 30, carbs: 45, availableDays: [1, 3] 
  },
  { 
    id: '7', 
    title: 'Том Ям с креветками', 
    description: 'Тайский суп на кокосовом молоке с креветками, грибами и рисом жасмин.', 
    price: 620, weight: '450г', category: 'lunch', image: IMAGES.lunch7, video: SAMPLE_VIDEO,
    calories: 480, protein: 22, fats: 25, carbs: 35, availableDays: [2, 4] 
  },
  { 
    id: '8', 
    title: 'Цезарь с креветками', 
    description: 'Хрустящий ромэн, тигровые креветки, пармезан, гренки и соус Цезарь.', 
    price: 580, weight: '280г', category: 'lunch', image: IMAGES.lunch8, 
    calories: 380, protein: 24, fats: 20, carbs: 18, availableDays: [2, 5] 
  },

  // --- PIES ---
  { 
    id: '9', 
    title: 'Осетинский пирог', 
    description: 'Традиционный пирог с осетинским сыром и свежей зеленью, тонкое тесто.', 
    price: 750, weight: '800г', category: 'pies', image: IMAGES.pie1, video: SAMPLE_VIDEO_2, 
    calories: 2100, protein: 80, fats: 90, carbs: 240 
  },
  { 
    id: '10', 
    title: 'Ягодный Тарт', 
    description: 'Нежная песочная основа, заварной ванильный крем и свежие лесные ягоды.', 
    price: 650, weight: '900г', category: 'pies', image: IMAGES.pie2, 
    calories: 1800, protein: 20, fats: 80, carbs: 250 
  },
  { 
    id: '11', 
    title: 'Мясной пирог', 
    description: 'Сочная рубленая говядина со специями в хрустящем слоеном тесте.', 
    price: 890, weight: '1кг', category: 'pies', image: IMAGES.pie3, video: SAMPLE_VIDEO, 
    calories: 2400, protein: 120, fats: 110, carbs: 200 
  },
  { 
    id: '12', 
    title: 'Киш со шпинатом', 
    description: 'Французский открытый пирог с брынзой, шпинатом и сливками.', 
    price: 720, weight: '850г', category: 'pies', image: IMAGES.pie4, 
    calories: 1950, protein: 60, fats: 100, carbs: 180 
  },

  // --- CATERING ---
  { 
    id: '13', 
    title: 'Сет брускетт', 
    description: 'Ассорти из 12 брускетт: слабосоленый лосось, ростбиф, вяленые томаты.', 
    price: 2900, weight: '1.2кг', category: 'catering', image: IMAGES.catering1, 
    calories: 1200, protein: 60, fats: 40, carbs: 140 
  },
  { 
    id: '14', 
    title: 'Канапе "Премиум"', 
    description: 'Изысканные закуски для фуршета на 10-12 персон. Идеально под игристое.', 
    price: 3500, weight: '1кг', category: 'catering', image: IMAGES.catering2, video: SAMPLE_VIDEO_2, 
    calories: 1500, protein: 70, fats: 80, carbs: 100 
  },
  { 
    id: '15', 
    title: 'Мини-бургеры BBQ', 
    description: 'Сет из 12 сочных мини-бургеров с говядиной и соусом барбекю.', 
    price: 3200, weight: '1.5кг', category: 'catering', image: IMAGES.catering3, 
    calories: 2800, protein: 140, fats: 160, carbs: 220 
  },
  { 
    id: '16', 
    title: 'Сырное плато', 
    description: 'Бри, Дор Блю, Пармезан, Чеддер, мед, орехи и виноград.', 
    price: 250, weight: '600г', category: 'catering', image: IMAGES.catering4, 
    calories: 1900, protein: 90, fats: 140, carbs: 40 
  },

  // --- EXTRAS (Upsell) ---
  { 
    id: '17', 
    title: 'Домашний морс', 
    description: 'Клюква и брусника, собственного приготовления. 0.5л', 
    price: 120, weight: '500мл', category: 'extras', image: IMAGES.drink1, 
    calories: 120, protein: 0, fats: 0, carbs: 30 
  },
  { 
    id: '18', 
    title: 'Матча Латте', 
    description: 'На кокосовом молоке без сахара. Холодный или горячий.', 
    price: 250, weight: '300мл', category: 'extras', image: IMAGES.drink2, 
    calories: 180, protein: 4, fats: 6, carbs: 20 
  },
  { 
    id: '19', 
    title: 'Чизкейк Сан-Себастьян', 
    description: 'Обожженный баскский чизкейк с нежной кремовой текстурой.', 
    price: 350, weight: '150г', category: 'extras', image: IMAGES.dessert1, 
    calories: 420, protein: 8, fats: 28, carbs: 35 
  },
  { 
    id: '20', 
    title: 'Апельсиновый фреш', 
    description: 'Свежевыжатый сок из сладких апельсинов.', 
    price: 250, weight: '250мл', category: 'extras', image: IMAGES.drink3, 
    calories: 110, protein: 2, fats: 0, carbs: 26 
  },
  { 
    id: '21', 
    title: 'Соус Песто', 
    description: 'Домашний соус из базилика, кедровых орехов и пармезана.', 
    price: 90, weight: '40г', category: 'extras', image: IMAGES.sauce1, 
    calories: 180, protein: 2, fats: 18, carbs: 2 
  },
];

export const REVIEWS = [
  { id: 1, name: "Алексей С.", text: "Лучшие ланчи в офис. Всегда горячее и вовремя.", role: "CEO, TechCorp" },
  { id: 2, name: "Мария В.", text: "Заказывали кейтеринг на день рождения. Гости в восторге.", role: "Event Manager" },
  { id: 3, name: "Дмитрий К.", text: "Осетинские пироги как домашние. Очень рекомендую.", role: "Дизайнер" }
];

export const FAQ = [
  { q: "Как быстро вы доставляете?", a: "В среднем доставка занимает 45 минут по центру города. В часы пик время может быть увеличено до 60 минут." },
  { q: "Есть ли минимальная сумма заказа?", a: "Да, минимальная сумма заказа — 3000₽. При достижении этой суммы доставка осуществляется бесплатно во все зоны обслуживания." },
  { q: "Можно ли оплатить картой курьеру?", a: "Конечно, у всех курьеров есть терминалы. Также доступна оплата онлайн при оформлении." }
];