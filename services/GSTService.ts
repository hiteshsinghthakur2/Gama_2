
import { INDIAN_STATES } from '../constants';
import { validateGSTIN } from './ValidationService';
import { fetchGSTDetailsFromGemini } from './geminiService';

export interface GSTDetails {
  legalName: string;
  tradeName: string;
  address: {
    street: string;
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
    country: string;
  };
}

/**
 * Fetches business details using Gemini Search as a fallback.
 */
export const fetchGSTDetails = async (gstin: string): Promise<GSTDetails> => {
  // 1. Validate Format
  const validation = validateGSTIN(gstin);
  if (!validation.isValid) {
      throw new Error(validation.message || "Invalid GSTIN Format");
  }

  const stateCode = gstin.substring(0, 2);
  const stateObj = INDIAN_STATES.find(s => s.code === stateCode);

  if (!stateObj) {
      throw new Error("Invalid State Code in GSTIN");
  }

  // 2. Attempt to fetch from Gemini
  try {
    const data = await fetchGSTDetailsFromGemini(gstin);
    
    if (data) {
        return {
            legalName: data.legalName || "",
            tradeName: data.tradeName || data.legalName || "",
            address: {
                street: data.address?.street || "",
                city: data.address?.city || stateObj.capital || "",
                state: stateObj.name, // Use canonical state name from our constants
                stateCode: stateCode,
                pincode: data.address?.pincode || "",
                country: 'India'
            }
        };
    }
  } catch (error) {
    console.warn("Gemini Fetch failed, falling back to inference:", error);
    // Fallthrough to inference
  }

  // 3. Fallback: Inferred Data (If API fails, at least provide State/City)
  // We return empty names to let the user fill them, rather than showing "Simulated" fake data.
  return {
    legalName: "", 
    tradeName: "",
    address: {
        street: "",
        city: stateObj.capital || "",
        state: stateObj.name,
        stateCode: stateObj.code,
        pincode: "",
        country: 'India'
    }
  };
};
