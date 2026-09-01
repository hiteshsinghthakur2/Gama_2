const fs = require('fs');
let content = fs.readFileSync('components/DeliveryChallanList.tsx', 'utf-8');

// Add to props
content = content.replace(
  "onDelete: (id: string) => void;\n}",
  "onDelete: (id: string) => void;\n  onConvertToInvoice: (challan: DeliveryChallan) => void;\n}"
);

content = content.replace(
  "onUpdateStatus,\n  onDelete",
  "onUpdateStatus,\n  onDelete,\n  onConvertToInvoice"
);

const convertButtonCode = `<button 
                                onClick={() => { onConvertToInvoice(challan); setActiveMenuId(null); }} 
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-bold transition"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                  Convert to Invoice
                              </button>
                              <button 
                                onClick={() => handleShare(challan, 'download')}`;

content = content.replace(/<button \s*onClick=\{\(\) => handleShare\(challan, 'download'\)\}/, convertButtonCode);

fs.writeFileSync('components/DeliveryChallanList.tsx', content);
