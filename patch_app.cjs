const fs = require('fs');
let app = fs.readFileSync('App.tsx', 'utf-8');

app = app.replace(
  `const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Delete this invoice?')) setInvoices(prev => prev.filter(inv => inv.id !== id));
  };`,
  `const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('Move this invoice to trash?')) {
      const inv = invoices.find(i => i.id === id);
      if (inv) {
        await TrashStorageService.moveToTrash({ type: 'invoice', data: inv, summary: 'Invoice ' + inv.number, originalId: inv.id });
        setInvoices(prev => prev.filter(i => i.id !== id));
      }
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (window.confirm('Move this quotation to trash?')) {
      const q = quotations.find(i => i.id === id);
      if (q) {
        await TrashStorageService.moveToTrash({ type: 'quotation', data: q, summary: 'Quotation ' + q.number, originalId: q.id });
        setQuotations(prev => prev.filter(i => i.id !== id));
      }
    }
  };

  const handleDeleteDeliveryChallan = async (id: string) => {
    if (window.confirm('Move this delivery challan to trash?')) {
      const dc = deliveryChallans.find(i => i.id === id);
      if (dc) {
        await TrashStorageService.moveToTrash({ type: 'delivery_challan', data: dc, summary: 'Challan ' + dc.number, originalId: dc.id });
        setDeliveryChallans(prev => prev.filter(i => i.id !== id));
      }
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Move this client to trash?')) {
      const c = clients.find(i => i.id === id);
      if (c) {
        await TrashStorageService.moveToTrash({ type: 'client', data: c, summary: 'Client ' + c.name, originalId: c.id });
        setClients(prev => prev.filter(i => i.id !== id));
      }
    }
  };
`
);

app = app.replace(
  `onDelete={(id) => setQuotations(prev => prev.filter(q => q.id !== id))}`,
  `onDelete={handleDeleteQuotation}`
);

app = app.replace(
  `onDelete={(id) => setDeliveryChallans(prev => prev.filter(dc => dc.id !== id))}`,
  `onDelete={handleDeleteDeliveryChallan}`
);

app = app.replace(
  `onDelete={(id) => setClients(prev => prev.filter(c => c.id !== id))}`,
  `onDelete={handleDeleteClient}`
);

fs.writeFileSync('App.tsx', app);
