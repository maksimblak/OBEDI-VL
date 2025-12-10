
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from "../types";

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
`;

export const getChefRecommendation = async (
  userMessage: string,
  history: { role: 'user' | 'model'; text: string }[],
  menuItems: MenuItem[]
): Promise<string> => {
  try {
    // 1. Build dynamic menu context
    const menuContext = menuItems.map(item => 
      `ID:${item.id} | ${item.title} | ${item.price}₽ | ${item.calories}kcal | Tags: ${item.category} | Ingred: ${item.description}`
    ).join('\n');

    const finalSystemInstruction = `${BASE_INSTRUCTION}\n${menuContext}`;

    // Create instance immediately before use to ensure API key availability
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.4, // Lower temperature for more factual menu usage
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "Извините, я сейчас на кухне и не расслышал. Повторите, пожалуйста?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Мой электронный блокнот рецептов временно недоступен. Попробуйте выбрать что-то из меню!";
  }
};

export const checkAddressZone = async (address: string): Promise<{
  found: boolean;
  zone: 'green' | 'yellow' | 'red' | null;
  distance: number;
  formattedAddress: string;
}> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Kitchen location: Ulitsa Nadibaidze 28, Vladivostok
    const prompt = `
      You are the logistics engine for "Obedi VL" in Vladivostok.
      Our Kitchen is at: Ulitsa Nadibaidze 28, Vladivostok.

      Delivery Zones (Driving Distance):
      - Green Zone: 0 - 4 km
      - Yellow Zone: 4 - 8 km
      - Red Zone: 8 - 15 km
      - No Delivery: > 15 km

      User Address Input: "${address}"

      Task:
      1. Check if the address exists in Vladivostok.
      2. Estimate the driving distance from the kitchen.
      3. Determine the zone.
      
      Return strictly valid JSON:
      {
        "found": boolean,
        "formattedAddress": string,
        "distance": number, // km, one decimal place
        "zone": "green" | "yellow" | "red" | null
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const text = response.text;
    if (!text) return { found: false, zone: null, distance: 0, formattedAddress: '' };
    
    return JSON.parse(text);
  } catch (e) {
    console.error("Zone check error:", e);
    return { found: false, zone: null, distance: 0, formattedAddress: '' };
  }
};
