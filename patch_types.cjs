const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');
content = content.replace(
  '  status: DeliveryChallanStatus;\n  clientId: string;',
  '  status: DeliveryChallanStatus;\n  clientId: string;\n  signatureUrl?: string;'
);
fs.writeFileSync('types.ts', content);
