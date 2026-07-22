const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf-8');

const useMemoSearch = `  const handleUpdateInvoiceStatus = (id: string, status: InvoiceStatus) => {`;
const pastItemsLogic = `  const pastItems = useMemo(() => {
    const allItems: any[] = [];
    const addItems = (docs: any[]) => {
      docs.forEach(doc => {
        if (doc.items && Array.isArray(doc.items)) {
          doc.items.forEach((item: any) => {
            if (item.description) {
              allItems.push(item);
            }
          });
        }
      });
    };
    addItems(invoices);
    addItems(quotations);
    addItems(deliveryChallans);
    
    const uniqueItems: any[] = [];
    const seen = new Set();
    for (let i = allItems.length - 1; i >= 0; i--) {
        const item = allItems[i];
        const key = item.description.toLowerCase().trim();
        if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push(item);
        }
    }
    return uniqueItems;
  }, [invoices, quotations, deliveryChallans]);

  const handleUpdateInvoiceStatus = (id: string, status: InvoiceStatus) => {`;

if (content.includes(useMemoSearch) && !content.includes('const pastItems = useMemo')) {
    content = content.replace(useMemoSearch, pastItemsLogic);
    fs.writeFileSync('App.tsx', content);
    console.log('Patched App.tsx');
} else {
    console.log('Could not match or already patched');
}
