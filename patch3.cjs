const fs = require('fs');
let content = fs.readFileSync('components/InvoiceList.tsx', 'utf-8');

// Excel patch
const oldExcelMap = `      'Client': getClient(inv.clientId, inv)?.name || 'Unknown',
      'Status': inv.status,
      'Total Amount': calculateDocumentTotal(inv),`;
const newExcelMap = `      'Client': getClient(inv.clientId, inv)?.name || 'Unknown',
      'Status': inv.status,
      'Total Amount': calculateDocumentTotal(inv),
      'Comment': inv.comment || '',`;
content = content.replace(oldExcelMap, newExcelMap);

// PDF patch
const oldPdfMap = `    const tableColumn = ["Invoice No", "Date", "Client", "Status", "Amount"];
    const tableRows = docs.map(inv => [
      inv.number,
      inv.date,
      getClient(inv.clientId, inv)?.name || 'Unknown',
      inv.status,
      \`Rs. \${calculateDocumentTotal(inv).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`
    ]);`;
const newPdfMap = `    const tableColumn = ["Invoice No", "Date", "Client", "Status", "Amount", "Comment"];
    const tableRows = docs.map(inv => [
      inv.number,
      inv.date,
      getClient(inv.clientId, inv)?.name || 'Unknown',
      inv.status,
      \`Rs. \${calculateDocumentTotal(inv).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`,
      inv.comment || ''
    ]);`;
content = content.replace(oldPdfMap, newPdfMap);

fs.writeFileSync('components/InvoiceList.tsx', content);
