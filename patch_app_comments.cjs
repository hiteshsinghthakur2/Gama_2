const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const invoiceUpdate = `  const handleUpdateInvoiceComment = (id: string, comment: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, comment } : inv));
  };`;

const quotationUpdate = `  const handleUpdateQuotationComment = (id: string, comment: string) => {
    setQuotations(prev => prev.map(qt => qt.id === id ? { ...qt, comment } : qt));
  };`;

const challanUpdate = `  const handleUpdateChallanComment = (id: string, comment: string) => {
    setDeliveryChallans(prev => prev.map(dc => dc.id === id ? { ...dc, comment } : dc));
  };`;

// Insert the functions after handleUpdateInvoiceStatus
if (!content.includes('handleUpdateInvoiceComment')) {
    content = content.replace(
        `  const handleUpdateInvoiceStatus = (id: string, status: InvoiceStatus) => {`,
        `${invoiceUpdate}\n\n${quotationUpdate}\n\n${challanUpdate}\n\n  const handleUpdateInvoiceStatus = (id: string, status: InvoiceStatus) => {`
    );
}

// Pass to InvoiceList
content = content.replace(
    `<InvoiceList invoices={invoices}`,
    `<InvoiceList onUpdateComment={handleUpdateInvoiceComment} invoices={invoices}`
);

// Pass to QuotationList
content = content.replace(
    `<QuotationList quotations={quotations}`,
    `<QuotationList onUpdateComment={handleUpdateQuotationComment} quotations={quotations}`
);

// Pass to DeliveryChallanList
content = content.replace(
    `<DeliveryChallanList challans={deliveryChallans}`,
    `<DeliveryChallanList onUpdateComment={handleUpdateChallanComment} challans={deliveryChallans}`
);

fs.writeFileSync('App.tsx', content);

