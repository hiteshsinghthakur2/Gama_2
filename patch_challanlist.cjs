const fs = require('fs');
let file = fs.readFileSync('components/DeliveryChallanList.tsx', 'utf-8');

file = file.replace(
  `const [shareData, setShareData] = useState<{ doc: DeliveryChallan, client: Client | undefined, target: 'whatsapp' | 'email' | 'download' } | null>(null);`,
  `const [shareData, setShareData] = useState<{ doc: DeliveryChallan, client: Client | undefined, target: 'whatsapp' | 'email' | 'download' | 'drive' } | null>(null);`
);

file = file.replace(
  `const handleShare = (inv: DeliveryChallan, target: 'whatsapp' | 'email' | 'download') => {`,
  `const handleShare = (inv: DeliveryChallan, target: 'whatsapp' | 'email' | 'download' | 'drive') => {`
);

if (!file.includes('uploadFileToDrive')) {
  file = file.replace(
    `import { formatCurrency, calculateDocumentTotal } from '../services/Calculations';`,
    `import { formatCurrency, calculateDocumentTotal } from '../services/Calculations';\nimport { uploadFileToDrive } from '../services/GoogleDriveService';`
  );
}

file = file.replace(
  `} else if (shareData.target === 'whatsapp') {`,
  `} else if (shareData.target === 'drive') {
                    try {
                        await uploadFileToDrive(file, 'CraftDaddy Delivery Challans');
                        alert(\`Delivery Challan \${shareData.doc.number} saved to Google Drive successfully!\`);
                    } catch (e: any) {
                        console.error('Drive upload error:', e);
                        alert(\`Failed to save to Google Drive: \${e.message}\`);
                    }
                } else if (shareData.target === 'whatsapp') {`
);

file = file.replace(
  `<button 
                                onClick={() => handleShare(inv, 'download')} 
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-bold transition"
                              >`,
  `<button 
                                onClick={() => handleShare(inv, 'drive')} 
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-bold transition"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                                  Save to Drive
                              </button>
                              <button 
                                onClick={() => handleShare(inv, 'download')} 
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-bold transition"
                              >`
);

fs.writeFileSync('components/DeliveryChallanList.tsx', file);
