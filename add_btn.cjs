const fs = require('fs');
let content = fs.readFileSync('components/DeliveryChallanList.tsx', 'utf-8');

const btnCode = `                              <button 
                                onClick={() => handleRequestSignature(challan)} 
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 font-bold transition border-b border-gray-50"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  Request Signature
                              </button>
`;

const anchor = `                              <button \n                                onClick={() => { onEdit(challan); setActiveMenuId(null); }}`;

if (content.includes(anchor)) {
    content = content.replace(anchor, btnCode + anchor);
    fs.writeFileSync('components/DeliveryChallanList.tsx', content);
    console.log("Button added!");
} else {
    console.log("Anchor not found!");
}
