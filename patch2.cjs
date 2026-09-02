const fs = require('fs');
let content = fs.readFileSync('components/InvoiceList.tsx', 'utf-8');

content = content.replace(
  'doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 14, 42);',
  'doc.text(`Total Amount: Rs. ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 42);'
);

content = content.replace(
  'formatCurrency(calculateDocumentTotal(inv))',
  '`Rs. ${calculateDocumentTotal(inv).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`'
);

const oldTable = `    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });`;
const newTable = `    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: {
        4: { halign: 'right' }
      }
    });`;
content = content.replace(oldTable, newTable);

fs.writeFileSync('components/InvoiceList.tsx', content);
