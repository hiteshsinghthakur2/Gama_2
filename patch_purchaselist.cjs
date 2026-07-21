const fs = require('fs');
let file = fs.readFileSync('components/PurchaseArchive.tsx', 'utf-8');

if (!file.includes('uploadFileToDrive')) {
  file = file.replace(
    `import { TrashStorageService } from '../services/TrashStorageService';`,
    `import { TrashStorageService } from '../services/TrashStorageService';\nimport { uploadFileToDrive } from '../services/GoogleDriveService';`
  );
}

const driveFunc = `
  const handleDriveUpload = async (inv: PurchaseInvoice) => {
    if (!inv.fileData) return;
    try {
        const base64Data = inv.fileData.split(',')[1];
        const contentType = inv.fileType || 'image/png';
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const ext = inv.fileType?.includes('pdf') ? 'pdf' : (inv.fileType?.split('/')[1] || 'png');
        const filename = inv.fileName || \`invoice_\${inv.invoiceNumber || inv.id}.\${ext}\`;
        const uploadFile = new File([blob], filename, { type: contentType });
        
        await uploadFileToDrive(uploadFile, 'CraftDaddy Purchases');
        alert('File saved to Google Drive successfully!');
    } catch (e: any) {
        console.error('Drive upload error:', e);
        alert(\`Failed to save to Google Drive: \${e.message}\`);
    }
  };

  const handleBulkDriveUpload = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const targetInvoices = selectedIds.length > 0 ? filteredInvoices.filter(i => selectedIds.includes(i.id)) : filteredInvoices;
      const invoicesWithFiles = targetInvoices.filter(i => i.fileData);
      if (invoicesWithFiles.length === 0) {
        alert("No files to save in the current view/selection.");
        return;
      }
      
      invoicesWithFiles.forEach(inv => {
        const base64Data = inv.fileData!.split(',')[1];
        const ext = inv.fileType?.includes('pdf') ? 'pdf' : (inv.fileType?.split('/')[1] || 'png');
        const fileName = inv.fileName || \`\${inv.vendorName}_\${inv.invoiceNumber || inv.id}.\${ext}\`;
        zip.file(fileName, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([content], 'Bulk_Purchases.zip', { type: 'application/zip' });
      
      await uploadFileToDrive(zipFile, 'CraftDaddy Purchases');
      alert('Bulk purchases saved to Google Drive successfully!');
    } catch (e: any) {
      console.error("Error bulk uploading", e);
      alert(\`Failed to save bulk purchases to Google Drive: \${e.message}\`);
    }
  };
`;

if (!file.includes('handleDriveUpload')) {
  file = file.replace(
    `const handleDownload = (inv: PurchaseInvoice) => {`,
    `${driveFunc}\n\n  const handleDownload = (inv: PurchaseInvoice) => {`
  );
}

// Single Action Button
file = file.replace(
  `<button onClick={() => { handleDownload(inv); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download File
                                      </button>`,
  `<button onClick={() => { handleDriveUpload(inv); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-bold flex items-center gap-2 transition">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                                        Save to Drive
                                      </button>
                                      <button onClick={() => { handleDownload(inv); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download File
                                      </button>`
);

// Bulk Action Button
file = file.replace(
  `<button onClick={handleBulkDownload} className="px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 transition">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Selected
                    </button>`,
  `<button onClick={handleBulkDriveUpload} className="px-3 py-1.5 bg-white text-indigo-700 text-xs font-bold rounded-lg shadow-sm border border-indigo-200 hover:bg-indigo-50 flex items-center gap-2 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                        Save to Drive
                    </button>
                    <button onClick={handleBulkDownload} className="px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 transition">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Selected
                    </button>`
);

fs.writeFileSync('components/PurchaseArchive.tsx', file);
