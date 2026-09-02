const fs = require('fs');
let content = fs.readFileSync('components/InvoiceList.tsx', 'utf-8');

const oldExcelMap = `    const data = docs.map(inv => ({
      'Invoice No': inv.number,
      'Date': inv.date,
      'Due Date': inv.dueDate,
      'Client': getClient(inv.clientId, inv)?.name || 'Unknown',
      'Status': inv.status,
      'Total Amount': calculateDocumentTotal(inv),
      'Comment': inv.comment || '',
    }));`;
const newExcelMap = `    const data = docs.map((inv, index) => ({
      'S.No': index + 1,
      'Invoice No': inv.number,
      'Date': inv.date,
      'Comment': inv.comment || '',
      'Client': getClient(inv.clientId, inv)?.name || 'Unknown',
      'Status': inv.status,
      'Amount': calculateDocumentTotal(inv),
    }));`;

content = content.replace(oldExcelMap, newExcelMap);

const oldPdfMap = `    const tableColumn = ["Invoice No", "Date", "Client", "Status", "Amount", "Comment"];
    const tableRows = docs.map(inv => [
      inv.number,
      inv.date,
      getClient(inv.clientId, inv)?.name || 'Unknown',
      inv.status,
      \`Rs. \${calculateDocumentTotal(inv).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`,
      inv.comment || ''
    ]);`;
const newPdfMap = `    const tableColumn = ["S.No", "Invoice No", "Date", "Comment", "Client", "Status", "Amount"];
    const tableRows = docs.map((inv, index) => [
      index + 1,
      inv.number,
      inv.date,
      inv.comment || '',
      getClient(inv.clientId, inv)?.name || 'Unknown',
      inv.status,
      \`Rs. \${calculateDocumentTotal(inv).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`
    ]);`;

content = content.replace(oldPdfMap, newPdfMap);

const oldTableConfig = `      columnStyles: {
        4: { halign: 'right' }
      }`;
const newTableConfig = `      columnStyles: {
        0: { halign: 'center' },
        6: { halign: 'right' }
      }`;

content = content.replace(oldTableConfig, newTableConfig);

fs.writeFileSync('components/InvoiceList.tsx', content);
