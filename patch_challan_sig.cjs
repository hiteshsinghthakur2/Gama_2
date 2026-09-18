const fs = require('fs');
let content = fs.readFileSync('components/DeliveryChallanList.tsx', 'utf-8');

// Add import
const lzImport = `import LZString from 'lz-string';`;
content = content.replace(`import { getStatusColor, formatCurrency, calculateDocumentTotal } from '../utils/calculations';`, `import { getStatusColor, formatCurrency, calculateDocumentTotal } from '../utils/calculations';\n${lzImport}`);

// Add function
const funcCode = `  const handleRequestSignature = (challan: DeliveryChallan) => {
    const client = clients.find(c => c.id === challan.clientId);
    const data = {
        id: challan.id,
        number: challan.number,
        date: challan.date,
        clientName: client?.name || 'Unknown',
        items: challan.items.map(i => ({ desc: i.description, qty: i.quantity, amt: i.amount })),
    };
    const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(data));
    const url = \`\${window.location.origin}/?sign_challan=1&data=\${encoded}\`;
    
    // Native share if supported
    if (navigator.share) {
        navigator.share({
            title: 'Sign Delivery Challan',
            text: \`Please review and sign Delivery Challan \${challan.number}:\`,
            url: url
        }).catch(console.error);
    } else {
        const waUrl = \`https://wa.me/?text=\${encodeURIComponent(\`Please review and sign Delivery Challan \${challan.number}:\n\n\${url}\`)}\`;
        window.open(waUrl, '_blank');
    }
    setActiveMenuId(null);
  };`;

content = content.replace("const handleShare = (doc: DeliveryChallan, target: 'whatsapp' | 'email' | 'download' | 'drive') => {", funcCode + "\n\n  const handleShare = (doc: DeliveryChallan, target: 'whatsapp' | 'email' | 'download' | 'drive') => {");

// Add button to menu
const btnCode = `                              <button 
                                 onClick={() => handleRequestSignature(challan)} 
                                 className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 font-bold transition border-b border-gray-50"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  Request Signature
                              </button>`;

content = content.replace('                              <button \n                                 onClick={() => { onEdit(challan); setActiveMenuId(null); }}', btnCode + '\n                              <button \n                                 onClick={() => { onEdit(challan); setActiveMenuId(null); }}');

fs.writeFileSync('components/DeliveryChallanList.tsx', content);
