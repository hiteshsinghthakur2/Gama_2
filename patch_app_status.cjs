const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');
content = content.replace(
    /const handleUpdateInvoiceStatus = \(id: string, status: InvoiceStatus\) => {/,
    "const handleUpdateInvoiceStatus = (id: string, status: InvoiceStatus, paymentReference?: string, paymentDate?: string) => {"
);
content = content.replace(
    /setInvoices\(prev => prev.map\(inv => inv.id === id \? { \.\.\.inv, status } : inv\)\);/,
    "setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status, paymentReference, paymentDate } : inv));"
);
fs.writeFileSync('App.tsx', content);
console.log('Patched App.tsx');
