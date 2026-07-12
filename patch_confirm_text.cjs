const fs = require('fs');

function replaceConfirmText(file, from, to) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(new RegExp(from, 'g'), to);
  fs.writeFileSync(file, content);
}

replaceConfirmText('App.tsx', 'Move this invoice to trash\\?', 'Delete this invoice?');
replaceConfirmText('App.tsx', 'Move this quotation to trash\\?', 'Delete this quotation?');
replaceConfirmText('App.tsx', 'Move this delivery challan to trash\\?', 'Delete this delivery challan?');
replaceConfirmText('App.tsx', 'Move this client to trash\\?', 'Delete this client?');
replaceConfirmText('components/LeadBoard.tsx', 'Move this lead to trash\\?', 'Delete this lead?');
replaceConfirmText('components/PurchaseArchive.tsx', 'move this purchase invoice to trash\\?', 'delete this purchase invoice?');
replaceConfirmText('components/PurchaseArchive.tsx', 'move \\$\\{selectedIds.length\\} purchase invoices to trash\\?', 'delete ${selectedIds.length} purchase invoices?');

