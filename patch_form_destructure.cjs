const fs = require('fs');
let content = fs.readFileSync('components/InvoiceForm.tsx', 'utf-8');

content = content.replace(
    '  onSaveClient\n}) => {',
    '  onSaveClient,\n  pastItems = []\n}) => {'
);

fs.writeFileSync('components/InvoiceForm.tsx', content);
console.log('Patched destructuring');
