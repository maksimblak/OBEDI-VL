import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT || 3001);

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

const setCors = (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
};

const sendText = (res, statusCode, text) => {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
};

const readJsonBody = async (req, limitBytes = 1_000_000) => {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
};

const normalizeAddressZone = (input) => {
  const fallback = { found: false, formattedAddress: '', distance: 0, zone: null };

  if (!input || typeof input !== 'object') return fallback;
  const maybe = input;

  const found = typeof maybe.found === 'boolean' ? maybe.found : false;
  const formattedAddress = typeof maybe.formattedAddress === 'string' ? maybe.formattedAddress : '';
  const distanceRaw = typeof maybe.distance === 'number' && Number.isFinite(maybe.distance) ? maybe.distance : 0;
  const distance = Math.max(0, Math.round(distanceRaw * 10) / 10);

  let zone = maybe.zone === 'green' || maybe.zone === 'yellow' || maybe.zone === 'red' ? maybe.zone : null;

  const zoneFromDistance = distance <= 4 ? 'green' : distance <= 8 ? 'yellow' : distance <= 15 ? 'red' : null;

  if (!found) {
    return { found: false, formattedAddress, distance: 0, zone: null };
  }

  zone = zoneFromDistance;

  return {
    found: true,
    formattedAddress,
    distance,
    zone,
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

const serveStaticFromDist = async (pathname, res) => {
  const safePath = pathname.replace(/\\/g, '/');
  const requested = safePath === '/' ? '/index.html' : safePath;
  const filePath = path.join(DIST_DIR, requested);

  try {
    const st = await stat(filePath);
    if (!st.isFile()) throw new Error('Not a file');

    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === '.html'
        ? 'text/html; charset=utf-8'
        : ext === '.js' || ext === '.mjs'
          ? 'text/javascript; charset=utf-8'
          : ext === '.css'
            ? 'text/css; charset=utf-8'
            : ext === '.json'
              ? 'application/json; charset=utf-8'
              : ext === '.svg'
                ? 'image/svg+xml'
                : ext === '.png'
                  ? 'image/png'
                  : ext === '.jpg' || ext === '.jpeg'
                    ? 'image/jpeg'
                    : ext === '.webp'
                      ? 'image/webp'
                      : ext === '.ico'
                        ? 'image/x-icon'
                        : 'application/octet-stream';

    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
    return true;
  } catch {
    return false;
  }
};

const server = http.createServer(async (req, res) => {
  try {
    setCors(req, res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (url.pathname === '/api/ai/recommendation' && req.method === 'POST') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        sendJson(res, 501, { error: 'GEMINI_API_KEY is not configured' });
        return;
      }

      const body = await readJsonBody(req);
      const message = typeof body.message === 'string' ? body.message : '';
      const history = Array.isArray(body.history) ? body.history : [];
      const menuItems = Array.isArray(body.menuItems) ? body.menuItems : [];

      const trimmedHistory = history
        .slice(-20)
        .map((h) => ({
          role: h?.role === 'user' ? 'user' : 'model',
          text: String(h?.text || '').replace(/\|\|REC_ID:.*?\|\|/g, ''),
        }))
        .filter((h) => h.text.trim().length > 0);

      const menuContext = menuItems
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

      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `${BASE_INSTRUCTION}\n${menuContext}`,
          temperature: 0.4,
        },
        history: trimmedHistory.map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        })),
      });

      const result = await chat.sendMessage({ message });
      sendJson(res, 200, { text: result.text || '' });
      return;
    }

    if (url.pathname === '/api/ai/address-zone' && req.method === 'POST') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        sendJson(res, 501, { error: 'GEMINI_API_KEY is not configured' });
        return;
      }

      const body = await readJsonBody(req);
      const address = typeof body.address === 'string' ? body.address : '';

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

      const ai = new GoogleGenAI({ apiKey });
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
        sendJson(res, 200, { found: false, formattedAddress: '', distance: 0, zone: null });
        return;
      }

      const normalized = normalizeAddressZone(parsed);
      sendJson(res, 200, normalized);
      return;
    }

    if (url.pathname === '/api/evotor/products' && req.method === 'GET') {
      const token = process.env.EVOTOR_TOKEN || '';
      const storeUuid = process.env.STORE_UUID || '';

      if (!token || !storeUuid) {
        sendJson(res, 200, []);
        return;
      }

      const response = await fetch(
        `https://api.evotor.ru/api/v1/inventories/stores/${encodeURIComponent(storeUuid)}/products`,
        {
          headers: {
            'X-Authorization': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Evotor API Error:', response.status, response.statusText);
        sendJson(res, 200, []);
        return;
      }

      const data = await response.json();
      const rawItems = Array.isArray(data) ? data : data?.items || [];

      const items = rawItems
        .filter((item) => Number(item?.price || 0) > 0)
        .map(mapEvotorToMenuItem);

      sendJson(res, 200, items);
      return;
    }

    const served = await serveStaticFromDist(url.pathname, res);
    if (served) return;

    if (url.pathname === '/' || url.pathname === '/index.html') {
      sendText(
        res,
        200,
        'Backend is running. Build the frontend with "npm run build" (or run Vite dev server) to serve UI.'
      );
      return;
    }

    sendText(res, 404, 'Not Found');
  } catch (error) {
    console.error('Server error:', error);
    sendJson(res, 500, { error: 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

