import path from 'node:path';
import fs from 'node:fs';
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
const EVOTOR_TOKEN = process.env.EVOTOR_TOKEN || '';
const STORE_UUID = process.env.STORE_UUID || '';

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

const withCors = (req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
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

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(withCors);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(GEMINI_API_KEY),
    evotorConfigured: Boolean(EVOTOR_TOKEN && STORE_UUID),
  });
});

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

app.get(
  '/api/evotor/products',
  asyncHandler(async (_req, res) => {
    if (!EVOTOR_TOKEN || !STORE_UUID) {
      res.json([]);
      return;
    }

    const response = await fetch(
      `https://api.evotor.ru/api/v1/inventories/stores/${encodeURIComponent(STORE_UUID)}/products`,
      {
        headers: {
          'X-Authorization': EVOTOR_TOKEN,
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
