const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');

if (!content.includes('export interface Note')) {
  content += `

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}`;
  fs.writeFileSync('types.ts', content);
  console.log('Added Note to types.ts');
} else {
  console.log('Note already exists in types.ts');
}
