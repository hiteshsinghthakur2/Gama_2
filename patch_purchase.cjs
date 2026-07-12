const fs = require('fs');
let file = fs.readFileSync('components/PurchaseArchive.tsx', 'utf-8');

if (!file.includes('TrashStorageService')) {
  file = file.replace(
    `import { parsePurchaseInvoiceFromImage } from '../services/geminiService';`,
    `import { parsePurchaseInvoiceFromImage } from '../services/geminiService';\nimport { TrashStorageService } from '../services/TrashStorageService';`
  );

  file = file.replace(
    `const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this purchase invoice?")) {
      try {
        await PurchaseStorageService.delete(id);`,
    `const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to move this purchase invoice to trash?")) {
      try {
        const inv = invoices.find(i => i.id === id);
        if (inv) {
          await TrashStorageService.moveToTrash({ type: 'purchase', data: inv, summary: 'Purchase Invoice ' + (inv.invoiceNumber || inv.id), originalId: inv.id });
        }
        await PurchaseStorageService.delete(id);`
  );

  file = file.replace(
    `const handleBulkDelete = async () => {
    if (confirm(\`Are you sure you want to delete \${selectedIds.length} purchase invoices?\`)) {
      try {
        for (const id of selectedIds) {
          await PurchaseStorageService.delete(id);
        }`,
    `const handleBulkDelete = async () => {
    if (confirm(\`Are you sure you want to move \${selectedIds.length} purchase invoices to trash?\`)) {
      try {
        for (const id of selectedIds) {
          const inv = invoices.find(i => i.id === id);
          if (inv) {
            await TrashStorageService.moveToTrash({ type: 'purchase', data: inv, summary: 'Purchase Invoice ' + (inv.invoiceNumber || inv.id), originalId: inv.id });
          }
          await PurchaseStorageService.delete(id);
        }`
  );
  
  fs.writeFileSync('components/PurchaseArchive.tsx', file);
}
