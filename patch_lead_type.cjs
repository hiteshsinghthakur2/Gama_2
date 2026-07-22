const fs = require('fs');

let content = fs.readFileSync('types.ts', 'utf-8');

if (!content.includes('description?: string;')) {
    content = content.replace(
        '  status: LeadStatus;',
        '  status: LeadStatus;\n  description?: string;\n  email?: string;\n  phone?: string;\n  nextFollowUp?: string;'
    );
    fs.writeFileSync('types.ts', content);
    console.log('Patched types.ts');
}
