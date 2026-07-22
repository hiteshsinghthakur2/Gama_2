const fs = require('fs');
let content = fs.readFileSync('components/InvoiceForm.tsx', 'utf-8');

content = content.replace(
    /list="past-items-list"/g,
    'list={(item.description && item.description.length >= 2) ? "past-items-list" : undefined}'
);

fs.writeFileSync('components/InvoiceForm.tsx', content);
console.log('Patched list attribute.');
