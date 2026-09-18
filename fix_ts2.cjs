const fs = require('fs');
let paTsx = fs.readFileSync('components/PurchaseArchive.tsx', 'utf-8');
paTsx = paTsx.replace(/PurchaseStorageService\.saveAll\([^)]+\)/g, 'PurchaseStorageService.syncToCloud(currentInvoices)'); 
fs.writeFileSync('components/PurchaseArchive.tsx', paTsx);
