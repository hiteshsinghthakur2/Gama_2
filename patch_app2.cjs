const fs = require('fs');
let file = fs.readFileSync('App.tsx', 'utf-8');

file = file.replace(
  `const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'quotations' | 'delivery-challans' | 'leads' | 'clients' | 'tools' | 'purchases' | 'settings' | 'users' | 'my-profile'>('dashboard');`,
  `const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'quotations' | 'delivery-challans' | 'leads' | 'clients' | 'tools' | 'purchases' | 'settings' | 'users' | 'my-profile' | 'trash'>('dashboard');`
);

file = file.replace(
  `case 'my-profile': return (`,
  `case 'trash': return <TrashView onRestore={(item) => {
    switch (item.type) {
      case 'invoice': setInvoices(prev => [...prev, item.data]); break;
      case 'quotation': setQuotations(prev => [...prev, item.data]); break;
      case 'delivery_challan': setDeliveryChallans(prev => [...prev, item.data]); break;
      case 'purchase': /* handled internally or reload required */ break;
      case 'client': setClients(prev => [...prev, item.data]); break;
      case 'lead': setLeads(prev => [...prev, item.data]); break;
    }
  }} />;
      case 'my-profile': return (`
);

fs.writeFileSync('App.tsx', file);
