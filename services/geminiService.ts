
import { GoogleGenAI, Type } from "@google/genai";
import { dataService } from "./dataService";
import { Transaction, TransactionType } from "../types";

// --- CONFIGURATION ---
// PASTE YOUR PERMANENT API KEY HERE to allow everyone to use the app's AI features.
// WARNING: This key will be visible in the frontend source code.
const FALLBACK_API_KEY = "YOUR_PERMANENT_API_KEY_HERE"; 

const getAI = () => {
  const userKey = dataService.getApiKey();
  // Prioritize user key, fallback to shared key
  const apiKey = userKey || FALLBACK_API_KEY;
  
  if (!apiKey || apiKey === "YOUR_PERMANENT_API_KEY_HERE") {
      throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  // Check if we have a usable key (either user or fallback)
  hasValidKey: () => {
      const userKey = dataService.getApiKey();
      return !!userKey || (!!FALLBACK_API_KEY && FALLBACK_API_KEY !== "YOUR_PERMANENT_API_KEY_HERE");
  },

  checkKey: async () => {
      try {
          const ai = getAI();
          // Minimal call to validate key
          await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: 'Ping',
          });
          return true;
      } catch (e) {
          return false;
      }
  },

  getWeeklySummary: async (transactions: Transaction[]): Promise<string> => {
    try {
      const ai = getAI();
      const recentTx = transactions.slice(0, 15).map(t => `${t.date.split('T')[0]}: ${t.description} (${t.amount} ${t.category})`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze these recent transactions and provide a 2 sentence summary in a friendly, "Financial Coach" persona. Focus on the biggest spending or earning trend. Data: \n${recentTx}`,
      });
      return response.text || "No insights available.";
    } catch (error) {
      console.error("Gemini Error", error);
      return "Unable to generate summary. API Key may be invalid or quota exceeded.";
    }
  },

  smartSearch: async (query: string): Promise<{ filters: any }> => {
    try {
      const ai = getAI();
      const schema = {
          type: Type.OBJECT,
          properties: {
              description_contains: { type: Type.STRING, nullable: true },
              category_is: { type: Type.STRING, nullable: true },
              amount_greater_than: { type: Type.NUMBER, nullable: true },
              type_is: { type: Type.STRING, nullable: true } // Spent, Received
          }
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Convert this natural language query into JSON filters for a transaction database: "${query}".`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
      });
      
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error(error);
      return { filters: {} };
    }
  },

  predictTransaction: async (description: string): Promise<{ category: string, type: string }> => {
    try {
      const ai = getAI();
      const schema = {
          type: Type.OBJECT,
          properties: {
              category: { type: Type.STRING },
              type: { type: Type.STRING, enum: Object.values(TransactionType) }
          }
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Predict the category (one word) and transaction type based on this description: "${description}".`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
      });
      return JSON.parse(response.text || '{"category": "General", "type": "SPENT"}');
    } catch (error) {
      return { category: "General", type: "SPENT" };
    }
  },

  draftSettlementMessage: async (personName: string, amount: number, direction: 'OWES_YOU' | 'YOU_OWE'): Promise<string> => {
    try {
        const ai = getAI();
        const prompt = direction === 'OWES_YOU' 
            ? `Draft a polite, casual, short WhatsApp message to ${personName} reminding them they owe me ₹${amount}. No hash tags. One emoji.`
            : `Draft a polite, casual, short WhatsApp message to ${personName} telling them I am ready to pay back the ₹${amount} I owe. No hash tags. One emoji.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "";
    } catch (e) {
        return `Hey ${personName}, let's settle up the ₹${amount}!`;
    }
  },

  getCoachTips: async (transactions: Transaction[]): Promise<Array<{title: string, description: string, type: string}>> => {
      try {
        const ai = getAI();
        const dataStr = JSON.stringify(transactions.slice(0, 20));
        
        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['good', 'warning', 'neutral'] }
                }
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze these transactions. Give me 3 short actionable tips or insights. Return JSON array. Data: ${dataStr}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });
        
        return JSON.parse(response.text || "[]");
      } catch (e) {
          return [];
      }
  },

  optimizeSpending: async (transactions: Transaction[]): Promise<Array<{category: string, change: string, advice: string}>> => {
      try {
          const ai = getAI();
          // Group by category for simplicity before sending to AI (optimization)
          const dataStr = JSON.stringify(transactions.slice(0, 50));

          const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING },
                    change: { type: Type.STRING, description: "e.g. +15% vs last month" },
                    advice: { type: Type.STRING, description: "Actionable advice to reduce this" }
                }
            }
          };

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Act as a spending optimizer. Analyze this transaction log. Identify 3 categories where spending is high or increasing. Provide specific advice to cut costs. Return JSON. Data: ${dataStr}`,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: schema
              }
          });
          return JSON.parse(response.text || "[]");
      } catch (e) {
          return [];
      }
  }
};
