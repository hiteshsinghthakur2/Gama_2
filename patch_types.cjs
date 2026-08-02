const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');
content = content.replace(
    /  comment\?: string;/,
    "  comment?: string;\n  paymentReference?: string;\n  paymentDate?: string;"
);
fs.writeFileSync('types.ts', content);
console.log('Patched types.ts');
