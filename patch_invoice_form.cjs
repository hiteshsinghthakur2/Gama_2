const fs = require('fs');
let content = fs.readFileSync('components/InvoiceForm.tsx', 'utf-8');

// Change prop type
content = content.replace(
  "onConvertToInvoice?: (quotation: Quotation) => void;",
  "onConvertToInvoice?: (document: any) => void;"
);

// Show button for both quotation and delivery-challan
content = content.replace(
  "{isQuotation && onConvertToInvoice && (",
  "{(isQuotation || mode === 'delivery-challan') && onConvertToInvoice && ("
);

// Change button text contextually?
// Oh wait, `isQuotation` is derived from `mode === 'quotation'`. Let's just use `(isQuotation || mode === 'delivery-challan')`.
fs.writeFileSync('components/InvoiceForm.tsx', content);
