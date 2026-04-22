import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Setup PDF.js worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextLocal = async (file: File, base64Data: string): Promise<string> => {
  let text = '';
  
  try {
    if (file.type === 'application/pdf') {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      text = fullText;

      // Fast fallback if pdf lacks embedded text:
      if (text.trim().length < 50) {
          console.warn("PDF seems to be a scanned image, but pure code Tesseract cannot process PDFs directly yet. Returning empty.");
          return text; 
      }

    } else if (file.type.startsWith('image/')) {
        const { data: { text: ocrText } } = await Tesseract.recognize(
            file,
            'eng'
        );
        text = ocrText;
    }
  } catch (err) {
      console.warn("Fast Local Text Extraction failed:", err);
      // Only attempt OCR fallback if it's an image. Tesseract crashes on raw PDFs.
      if (file.type.startsWith('image/')) {
        try {
          const { data: { text: ocrText } } = await Tesseract.recognize(
              file,
              'eng'
          );
          text = ocrText;
        } catch (ocrErr) {
            console.error("Local OCR failed", ocrErr);
            throw new Error(`Pure Code Extract Failed for Image: ${(ocrErr as any)?.message || 'Unreadable File'}`);
        }
      } else {
        throw new Error(`Pure Code Extract Failed for PDF: ${(err as any)?.message || 'Unreadable File'}`);
      }
  }

  return text;
};

export const parseInvoiceLocal = async (file: File, base64Data: string) => {
    try {
        const text = await extractTextLocal(file, base64Data);
        
        // Very basic RegEx patterns purely matching "Pure Code" approach.
        // It's brittle - missing items, exact totals, etc., exactly why AI is usually preferred.
        
        const invoiceMatches = text.match(/(?:invoice\s*(?:no|number|#)|inv\s*-?\s*no)[\s:]*([A-Z0-9\-\/]+)/i);
        const invoiceNumber = invoiceMatches ? invoiceMatches[1] : `LOCAL-${Math.floor(Math.random()*1000)}`;
        
        const dateMatches = text.match(/(?:date)[\s:]*([\d]{1,2}[\/\-\.][\d]{1,2}[\/\-\.][\d]{2,4})/i);
        const invoiceDate = dateMatches ? dateMatches[1].replace(/[\/\.]/g, '-') : new Date().toISOString().split('T')[0];

        const gstinMatches = text.match(/\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/i);
        const gstin = gstinMatches ? gstinMatches[0] : '';
        
        return {
           success: true,
           data: {
               number: invoiceNumber,
               date: invoiceDate,
               dueDate: '',
               clientName: 'Extracted Local Client', // Guessing names via Regex is notoriously difficult
               clientEmail: '',
               clientPhone: '',
               clientRegistered: !!gstin,
               clientAddress: {
                  street: 'Address extraction requires AI',
                  city: '',
                  state: '',
                  pincode: '',
                  country: ''
               },
               clientGstin: gstin,
               clientPan: '',
               placeOfSupply: '',
               items: [
                   { description: 'Item matching via Regex unsupported', qty: 1, rate: 0, taxRate: 0 }
               ],
               additionalCharges: [],
               termsAndConditions: 'Local Pure Code Extraction'
           }
        }
    } catch(err: any) {
        return { success: false, error: err.message || 'Local Parsing Error' };
    }
}
