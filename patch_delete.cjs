const fs = require('fs');

function replaceInFile(file) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/Delete Permanently/g, 'Delete');
  fs.writeFileSync(file, content);
}

replaceInFile('components/InvoiceList.tsx');
replaceInFile('components/QuotationList.tsx');
replaceInFile('components/DeliveryChallanList.tsx');
