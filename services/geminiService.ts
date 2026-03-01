import { GoogleGenAI, Type } from "@google/genai";

export const parseInvoiceFromImage = async (base64Data: string, mimeType: string) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "") {
      console.warn('Gemini API functionality is disabled because GEMINI_API_KEY is missing or empty in environment variables.');
      return null;
    }

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: "Extract invoice details from this image/document. Include invoice number, date, due date, client name, client email, client phone, client address, client GSTIN, client PAN, place of supply, and line items (description, hsn, qty, rate, taxRate). Return the data in JSON format.",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
            clientAddress: { type: Type.STRING, description: 'Client address (street, city, state, pincode)' },
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
                required: ['description', 'qty', 'rate', 'taxRate'],
              }
            }
          },
          required: ['number', 'date', 'clientName', 'items'],
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini AI Service Error:', error);
    return null;
  }
};

export const suggestLineItemsFromPrompt = async (prompt: string) => {
  try {
    // Access the API key provided via Vite's define or environment
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    
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

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini AI Service Error:', error);
    return [];
  }
};