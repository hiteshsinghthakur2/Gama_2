const fs = require('fs');
let file = fs.readFileSync('App.tsx', 'utf-8');

file = file.replace(
  `case 'purchase': /* handled internally or reload required */ break;`,
  `case 'purchase': PurchaseStorageService.save(item.data); break;`
);

fs.writeFileSync('App.tsx', file);
