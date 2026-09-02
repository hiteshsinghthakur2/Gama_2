const fs = require('fs');
let content = fs.readFileSync('components/InvoiceList.tsx', 'utf-8');

// The oldRow is "formatCurrency(calculateDocumentTotal(inv)).replace(/₹/g, 'Rs. ')"
const oldRow = "formatCurrency(calculateDocumentTotal(inv)).replace(/₹/g, 'Rs. ')";
const newRow = "\`Rs. \${calculateDocumentTotal(inv).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`";
content = content.replace(oldRow, newRow);

const oldAmount = "doc.text(\`Total Amount: \${formatCurrency(totalAmount).replace(/₹/g, 'Rs. ')}\`, 14, 42);";
const newAmount = "doc.text(\`Total Amount: Rs. \${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`, 14, 42);";
content = content.replace(oldAmount, newAmount);

fs.writeFileSync('components/InvoiceList.tsx', content);
