const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const handleConvertToInvoiceOld = `  const handleConvertToInvoice = (quotation: Quotation) => {
    let newNumber = \`CD\${new Date().getFullYear()}\${Math.floor(1000 + Math.random() * 9000)}\`;
    if (userProfile.invoiceSequence) {
      const seq = userProfile.invoiceSequence;
      const paddedNumber = seq.nextNumber.toString().padStart(seq.padding || 0, '0');
      newNumber = \`\${seq.prefix || ''}\${seq.suffix || ''}\${paddedNumber}\`;
    }

    const newInvoice: Invoice = {
      id: \`inv-\${Date.now()}\`,
      number: newNumber,
      date: new Date().toISOString().split('T')[0],
      dueDate: quotation.validUntil || '',
      poNumber: '',
      status: InvoiceStatus.DRAFT,
      clientId: quotation.clientId,
      clientDetails: quotation.clientDetails,
      items: quotation.items.map(item => ({...item})),
      notes: quotation.notes,
      terms: quotation.terms || userProfile.defaultInvoiceTerms || '1. Subject to local jurisdiction.\\n2. Payment within due date.',
      placeOfSupply: quotation.placeOfSupply,
      bankDetails: quotation.bankDetails,
      customFields: quotation.customFields || [],
      discountType: quotation.discountType,
      discountValue: quotation.discountValue,
      additionalCharges: quotation.additionalCharges,
      roundOff: quotation.roundOff,
      showBankDetails: quotation.showBankDetails
    };

    setActiveTab('invoices');
    setEditingInvoice(newInvoice);
    setEditingQuotation(null);
  };`;

const handleConvertToInvoiceNew = `  const handleConvertToInvoice = (source: Quotation | DeliveryChallan) => {
    let newNumber = \`CD\${new Date().getFullYear()}\${Math.floor(1000 + Math.random() * 9000)}\`;
    if (userProfile.invoiceSequence) {
      const seq = userProfile.invoiceSequence;
      const paddedNumber = seq.nextNumber.toString().padStart(seq.padding || 0, '0');
      newNumber = \`\${seq.prefix || ''}\${seq.suffix || ''}\${paddedNumber}\`;
    }

    const newInvoice: Invoice = {
      id: \`inv-\${Date.now()}\`,
      number: newNumber,
      date: new Date().toISOString().split('T')[0],
      dueDate: ('validUntil' in source ? source.validUntil : undefined) || '',
      poNumber: '',
      status: InvoiceStatus.DRAFT,
      clientId: source.clientId,
      clientDetails: source.clientDetails,
      items: source.items.map(item => ({...item})),
      notes: source.notes,
      terms: source.terms || userProfile.defaultInvoiceTerms || '1. Subject to local jurisdiction.\\n2. Payment within due date.',
      placeOfSupply: source.placeOfSupply,
      bankDetails: ('bankDetails' in source ? source.bankDetails : undefined) || undefined,
      customFields: source.customFields || [],
      discountType: ('discountType' in source ? source.discountType : undefined),
      discountValue: ('discountValue' in source ? source.discountValue : undefined),
      additionalCharges: source.additionalCharges,
      roundOff: ('roundOff' in source ? source.roundOff : undefined),
      showBankDetails: ('showBankDetails' in source ? source.showBankDetails : undefined)
    };

    setActiveTab('invoices');
    setEditingInvoice(newInvoice);
    setEditingQuotation(null);
    setEditingDeliveryChallan(null);
  };`;

content = content.replace(handleConvertToInvoiceOld, handleConvertToInvoiceNew);

// Now find where editingDeliveryChallan is used and pass onConvertToInvoice
// <InvoiceForm pastItems={pastItems} mode="delivery-challan" userProfile={userProfile} clients={clients} onSave={handleSaveDeliveryChallan} onCancel={() => setEditingDeliveryChallan(null)} initialData={editingDeliveryChallan} onEditClient={(client) => { setEditingClient(client); setActiveTab('clients'); }} onSaveClient={handleSaveClient} />
content = content.replace(
  'initialData={editingDeliveryChallan} onEditClient=',
  'initialData={editingDeliveryChallan} onConvertToInvoice={handleConvertToInvoice} onEditClient='
);

fs.writeFileSync('App.tsx', content);
