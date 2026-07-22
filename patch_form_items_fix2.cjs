const fs = require('fs');
let content = fs.readFileSync('components/InvoiceForm.tsx', 'utf-8');

content = content.replace(
    /hsn: it\.hsn \|\| match\.hsn \|\| '',/g,
    "hsn: match.hsn || '',"
);

content = content.replace(
    /rate: it\.rate === 0 \? \(match\.rate \|\| 0\) : it\.rate,/g,
    "rate: match.rate || 0,"
);

content = content.replace(
    /taxRate: it\.taxRate === 18 \? \(match\.taxRate \|\| 18\) : it\.taxRate/g,
    "taxRate: match.taxRate || 18"
);


fs.writeFileSync('components/InvoiceForm.tsx', content);
console.log('Patched again.');
