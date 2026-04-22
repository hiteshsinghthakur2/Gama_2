import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  // Try Vite env first (Vercel/Browser)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // Try process.env (AI Studio/Node)
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return "";
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const parseInvoiceFromImage = async (base64Data: string, mimeType: string, retries = 3, targetModel = 'gemini-2.0-flash'): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is missing or empty in environment variables. Please add it in your Vercel settings or .env file.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: "Extract invoice details from this image/document. CRITICAL: YOU MUST EXTRACT THE COMPLETE CLIENT DETAILS. Search all over the document, especially 'Billed To', 'Consignee', or 'Buyer'. Capture the Client Name, Email, Phone, and the FULL Address (separated into street, city, state, pincode, country). Also extract invoice number, issue date, due date, client GSTIN, client PAN, whether the client is registered for GST (true/false based on GSTIN presence), place of supply, all line items, additional charges, and terms. Return strictly formatted JSON.",
    };

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            number: { type: Type.STRING, description: 'Invoice number' },
            date: { type: Type.STRING, description: 'Invoice date (YYYY-MM-DD)' },
            dueDate: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
            clientName: { type: Type.STRING, description: 'Client name' },
            clientEmail: { type: Type.STRING, description: 'Client email' },
            clientPhone: { type: Type.STRING, description: 'Client phone number' },
            clientRegistered: { type: Type.BOOLEAN, description: 'True if client has GSTIN/is registered, false otherwise' },
            clientAddress: {
              type: Type.OBJECT,
              description: 'Client Address Details',
              properties: {
                 street: { type: Type.STRING, description: 'Street address and area' },
                 city: { type: Type.STRING, description: 'City name' },
                 state: { type: Type.STRING, description: 'State name' },
                 pincode: { type: Type.STRING, description: 'Postal or Pin code' },
                 country: { type: Type.STRING, description: 'Country (e.g. India)' }
              }
            },
            clientGstin: { type: Type.STRING, description: 'Client GSTIN' },
            clientPan: { type: Type.STRING, description: 'Client PAN' },
            placeOfSupply: { type: Type.STRING, description: 'Place of supply (State Name)' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: 'Item description' },
                  hsn: { type: Type.STRING, description: 'HSN/SAC code' },
                  qty: { type: Type.NUMBER, description: 'Quantity' },
                  rate: { type: Type.NUMBER, description: 'Unit rate' },
                  taxRate: { type: Type.NUMBER, description: 'Tax rate percentage (e.g., 18)' },
                },
                required: ['description'],
              }
            },
            additionalCharges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: 'Description of charge (e.g., Delivery Charge, Shipping)' },
                  amount: { type: Type.NUMBER, description: 'Amount of the charge' }
                },
                required: ['label', 'amount']
              }
            },
            termsAndConditions: { type: Type.STRING, description: 'Terms and conditions mentioned on the invoice specifically' }
          }
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("No text returned by the AI.");
    
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    
    return { success: true, data: JSON.parse(text) };
  } catch (error: any) {
    const errorMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    
    // If we hit hard quota on 2.0-flash, immediately fallback to 1.5-flash which has higher free tiers
    if ((errorMsg.includes('quota') || errorMsg.includes('exceeded')) && targetModel !== 'gemini-1.5-flash') {
        console.warn(`Model ${targetModel} hit quota limit, falling back to gemini-1.5-flash...`);
        return parseInvoiceFromImage(base64Data, mimeType, retries, 'gemini-1.5-flash');
    }

    // Automatically retry if it's a rate limit or service unavailable error (like 503)
    if ((errorMsg.includes('429') || errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE') || errorMsg.includes('high demand') || errorMsg.includes('RESOURCE_EXHAUSTED')) && retries > 0) {
      console.warn(`Rate limit or High Demand hit, retrying parsing... (${retries} retries left, model: ${targetModel}). Message: ${errorMsg}`);
      
      let waitTime = 20000; // Default 20s wait to help clear RPM limits
      const match = errorMsg.match(/retry in (\d+(\.\d+)?)s/i);
      if (match && match[1]) {
        waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 2000; // Extracted time + 2s padding
      } else if (errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE')) {
        waitTime = 10000; // 10 seconds wait on 503
      }
      
      // Safety cap wait time to 60 seconds to prevent massive lockups in UI
      waitTime = Math.min(waitTime, 60000);
      
      await delay(waitTime);
      return parseInvoiceFromImage(base64Data, mimeType, retries - 1, targetModel);
    }

    console.error(`Gemini AI Service Error (${targetModel}):`, errorMsg || error);
    return { success: false, error: errorMsg || 'Unknown processing error' };
  }
};

export const fetchGSTDetailsFromGemini = async (gstin: string) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "") {
      console.warn('Gemini API functionality is disabled because GEMINI_API_KEY is missing or empty in environment variables.');
      return null;
    }

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search the web for GSTIN ${gstin} and extract the Legal Name, Trade Name, and Address. Return the data in JSON format.`,
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

    let text = response.text;
    if (!text) return null;
    
    // Strip markdown formatting if the model accidentally includes it despite responseMimeType
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error('Gemini AI Service Error (fetchGSTDetailsFromGemini):', error?.message || error);
    return null;
  }
};

export const parseBankStatementFromImage = async (base64Data: string, mimeType: string, retries = 3, targetModel = 'gemini-2.0-flash'): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is missing or empty in environment variables. Please add it in your Vercel settings or .env file.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: "Analyze this bank statement. Extract ONLY the INCOMING (Credit/Deposit) transactions. Completely ignore any debits, withdrawals, or closing balances. For every deposit, provide the Date, Description (particulars or reference), and the exact Amount deposited. Return it in JSON format.",
    };

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: 'Transaction Date' },
                  description: { type: Type.STRING, description: 'Transaction Description / Particulars' },
                  amount: { type: Type.NUMBER, description: 'Exact deposited amount' }
                },
                required: ['date', 'description', 'amount'],
              }
            }
          }
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("No text returned by the AI.");
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    
    return { success: true, data: JSON.parse(text) };
  } catch (error: any) {
    const errorMsg = error?.message || '';
    
    // Fallback to 1.5-flash on quota exceeded
    if ((errorMsg.includes('quota') || errorMsg.includes('exceeded')) && targetModel !== 'gemini-1.5-flash') {
        console.warn(`Model ${targetModel} hit quota limit, falling back to gemini-1.5-flash...`);
        return parseBankStatementFromImage(base64Data, mimeType, retries, 'gemini-1.5-flash');
    }

    if ((errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) && retries > 0) {
      console.warn(`Rate limit hit, retrying bank statement parsing... (${retries} retries left, model: ${targetModel})`);
      let waitTime = 20000;
      const match = errorMsg.match(/retry in (\d+(\.\d+)?)s/i);
      if (match && match[1]) {
        waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 2000;
      }
      waitTime = Math.min(waitTime, 60000);
      await delay(waitTime);
      return parseBankStatementFromImage(base64Data, mimeType, retries - 1, targetModel);
    }
    console.error(`Gemini AI Service Error (${targetModel}):`, errorMsg || error);
    return { success: false, error: errorMsg || 'Unknown processing error' };
  }
};

export const suggestLineItemsFromPrompt = async (prompt: string) => {
  try {
    const apiKey = getApiKey();
    
    // STRICT CHECK: The SDK throws an error if initialized with an empty string or undefined.
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "") {
      console.warn('Gemini API functionality is disabled because GEMINI_API_KEY is missing or empty in environment variables.');
      return [];
    }

    // Only initialize if we definitely have a key
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract a list of professional invoice line items (description, quantity, estimated market rate in INR, and common GST percentage for that item in India) from the following business scenario: "${prompt}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { 
                type: Type.STRING,
                description: 'The name or description of the service/product'
              },
              qty: { 
                type: Type.NUMBER,
                description: 'The quantity'
              },
              rate: { 
                type: Type.NUMBER,
                description: 'The unit rate in INR'
              },
              taxRate: { 
                type: Type.NUMBER,
                description: 'The GST rate as a percentage (e.g. 18)'
              },
              hsn: { 
                type: Type.STRING,
                description: 'The HSN or SAC code'
              }
            },
            required: ['description', 'qty', 'rate', 'taxRate'],
            propertyOrdering: ['description', 'hsn', 'qty', 'rate', 'taxRate']
          }
        }
      }
    });

    let text = response.text;
    if (!text) return [];
    
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error('Gemini AI Service Error (suggestLineItemsFromPrompt):', error?.message || error);
    return [];
  }
};