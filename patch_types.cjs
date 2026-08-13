const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');

if (!content.includes("type?: 'text' | 'daddys_note';")) {
  content = content.replace(/content: string;/, "content: string;\n  type?: 'text' | 'daddys_note';\n  documentUrl?: string;\n  annotations?: any[];");
  fs.writeFileSync('types.ts', content);
  console.log('Patched types.ts');
}
