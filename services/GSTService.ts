
import { INDIAN_STATES } from '../constants';
import { validateGSTIN } from './ValidationService';

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
 * Fetches business details using a third-party Application Service Provider (ASP).
 * 
 * Uses a public free-tier endpoint for demonstration. 
 * For high-volume production, replace the URL with a paid provider like ClearTax, Masters India, or Karza
 * and use `process.env.GST_API_KEY`.
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

  // 2. Attempt to fetch from ASP (Public Wrapper)
  try {
    // Using a public wrapper for GSTN (sheet.gstincheck.co.in)
    // In production, you would use: `${process.env.GST_API_URL}?gstin=${gstin}&key=${process.env.GST_API_KEY}`
    const response = await fetch(`https://sheet.gstincheck.co.in/check/${gstin}`);
    
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    const data = await response.json();

    if (data.flag && data.data) {
        const { lgnm, tradeNam, pradr } = data.data;
        const addr = pradr?.addr || {};

        // Construct Street Address from available parts
        const streetParts = [addr.bno, addr.bnm, addr.st, addr.loc].filter(Boolean).join(', ');

        return {
            legalName: lgnm,
            tradeName: tradeNam || lgnm,
            address: {
                street: streetParts || '',
                city: addr.dst || addr.city || stateObj.capital,
                state: stateObj.name, // Use canonical state name from our constants
                stateCode: stateCode,
                pincode: addr.pncd || '',
                country: 'India'
            }
        };
    }
  } catch (error) {
    console.warn("ASP Fetch failed, falling back to inference:", error);
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
