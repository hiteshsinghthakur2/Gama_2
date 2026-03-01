import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

async function run() {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Search the web for GSTIN 27AAACR5055K1Z8 and extract the Legal Name, Trade Name, and Address. Return the data in JSON format.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          legalName: { type: Type.STRING },
          tradeName: { type: Type.STRING },
          address: {
            type: Type.OBJECT,
            properties: {
              street: { type: Type.STRING },
              city: { type: Type.STRING },
              state: { type: Type.STRING },
              pincode: { type: Type.STRING },
            }
          }
        }
      }
    }
  });
  console.log(response.text);
}
run().catch(console.error);
