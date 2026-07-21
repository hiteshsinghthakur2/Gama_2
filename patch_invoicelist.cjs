const fs = require('fs');
let file = fs.readFileSync('components/InvoiceList.tsx', 'utf-8');

file = file.replace(
  `const [shareData, setShareData] = useState<{ doc: Invoice, client: Client | undefined, target: 'whatsapp' | 'email' | 'download' } | null>(null);`,
  `const [shareData, setShareData] = useState<{ doc: Invoice, client: Client | undefined, target: 'whatsapp' | 'email' | 'download' | 'drive' } | null>(null);`
);

file = file.replace(
  `const [bulkShareData, setBulkShareData] = useState<{ docs: Invoice[], target: 'whatsapp' | 'email' | 'download' } | null>(null);`,
  `const [bulkShareData, setBulkShareData] = useState<{ docs: Invoice[], target: 'whatsapp' | 'email' | 'download' | 'drive' } | null>(null);`
);

file = file.replace(
  `const handleShare = (inv: Invoice, target: 'whatsapp' | 'email' | 'download') => {`,
  `const handleShare = (inv: Invoice, target: 'whatsapp' | 'email' | 'download' | 'drive') => {`
);

file = file.replace(
  `const handleBulkShare = (target: 'whatsapp' | 'email' | 'download') => {`,
  `const handleBulkShare = (target: 'whatsapp' | 'email' | 'download' | 'drive') => {`
);

// We need to add the import for uploadFileToDrive at the top
if (!file.includes('uploadFileToDrive')) {
  file = file.replace(
    `import { formatCurrency, calculateDocumentTotal } from '../services/Calculations';`,
    `import { formatCurrency, calculateDocumentTotal } from '../services/Calculations';\nimport { uploadFileToDrive } from '../services/GoogleDriveService';`
  );
}

// Add the 'drive' case in generateAndShare inside useEffect
file = file.replace(
  `} else if (shareData.target === 'whatsapp') {`,
  `} else if (shareData.target === 'drive') {
                    try {
                        await uploadFileToDrive(file, 'CraftDaddy Invoices');
                        alert(\`Invoice \${shareData.doc.number} saved to Google Drive successfully!\`);
                    } catch (e: any) {
                        console.error('Drive upload error:', e);
                        alert(\`Failed to save to Google Drive: \${e.message}\`);
                    }
                } else if (shareData.target === 'whatsapp') {`
);

// Add the 'drive' case in generateBulkAndShare inside useEffect
file = file.replace(
  `if (bulkShareData.target === 'download') {
                    zip.generateAsync({ type: 'blob' }).then(content => {`,
  `if (bulkShareData.target === 'drive') {
                    zip.generateAsync({ type: 'blob' }).then(async content => {
                        const zipFile = new File([content], 'Bulk_Invoices.zip', { type: 'application/zip' });
                        try {
                            await uploadFileToDrive(zipFile, 'CraftDaddy Invoices');
                            alert('Bulk invoices saved to Google Drive successfully!');
                        } catch (e: any) {
                            console.error('Drive upload error:', e);
                            alert(\`Failed to save bulk invoices to Google Drive: \${e.message}\`);
                        }
                    });
                } else if (bulkShareData.target === 'download') {
                    zip.generateAsync({ type: 'blob' }).then(content => {`
);

// Add the UI button for 'drive' in single item
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

// Add the UI button for bulk
file = file.replace(
  `<button onClick={() => handleBulkShare('download')} className="px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 transition">`,
  `<button onClick={() => handleBulkShare('drive')} className="px-3 py-1.5 bg-white text-indigo-700 text-xs font-bold rounded-lg shadow-sm border border-indigo-200 hover:bg-indigo-50 flex items-center gap-2 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                            Save to Drive
                        </button>
                        <button onClick={() => handleBulkShare('download')} className="px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 transition">`
);

fs.writeFileSync('components/InvoiceList.tsx', file);
