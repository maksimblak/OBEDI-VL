import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "Chef Alex", the AI culinary assistant for "Obedi VL", a premium food delivery service in Vladivostok.
Your tone is warm, appetizing, and helpful. You speak Russian.

Here is our menu context:
1. Business Lunches (Home-style cooking, changes daily).
2. Drinks and Extras (Mors, Matcha, Desserts).

We serve lunch every day of the week, including weekends!

Your goal is to help users choose what to eat based on their preferences (e.g., "I want something light", "I'm hungry for meat", "Do you have soup?").
Keep responses concise (under 50 words) unless asked for a detailed plan.
Suggest specific items if possible based on general food knowledge fitting our categories.
`;

export const getChefRecommendation = async (
  userMessage: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
  try {
    // Create instance immediately before use to ensure API key availability
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
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