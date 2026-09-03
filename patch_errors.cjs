const fs = require('fs');

function replaceErrors(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(/console\.error\("Cloud Sync Error:"/g, 'console.warn("Cloud Sync Error:"');
    content = content.replace(/console\.error\("Purchase Cloud Sync Error:"/g, 'console.warn("Purchase Cloud Sync Error:"');
    content = content.replace(/console\.error\("Purchase Cloud Load Error:"/g, 'console.warn("Purchase Cloud Load Error:"');
    content = content.replace(/console\.error\("Trash Cloud Sync Error:"/g, 'console.warn("Trash Cloud Sync Error:"');
    content = content.replace(/console\.error\("Trash Cloud Load Error:"/g, 'console.warn("Trash Cloud Load Error:"');
    fs.writeFileSync(filePath, content);
}

replaceErrors('services/StorageService.ts');
replaceErrors('services/PurchaseStorageService.ts');
replaceErrors('services/TrashStorageService.ts');
