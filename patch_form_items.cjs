const fs = require('fs');

let content = fs.readFileSync('components/InvoiceForm.tsx', 'utf-8');

// Add pastItems to props
content = content.replace(
    'existingInvoices?: Invoice[];',
    'existingInvoices?: Invoice[];\n  pastItems?: LineItem[];'
);

content = content.replace(
    'const InvoiceForm: React.FC<DocumentFormProps> = ({ userProfile, clients, onSave, onCancel, initialData, mode = \'invoice\', onConvertToInvoice, existingInvoices, onSaveClient, onEditClient }) => {',
    'const InvoiceForm: React.FC<DocumentFormProps> = ({ userProfile, clients, onSave, onCancel, initialData, mode = \'invoice\', onConvertToInvoice, existingInvoices, onSaveClient, onEditClient, pastItems = [] }) => {'
);

// Add datalist to the form
const datalist = `
      <datalist id="past-items-list">
        {pastItems.map((pi, i) => (
            <option key={i} value={pi.description} />
        ))}
      </datalist>
`;

content = content.replace(
    '<div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-[90vh]">',
    '<div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-[90vh]">' + datalist
);

content = content.replace(
    '<div className="bg-white md:rounded-3xl shadow-2xl flex flex-col h-full max-w-7xl mx-auto overflow-hidden animate-in fade-in duration-500 md:my-8 border border-gray-100">',
    '<div className="bg-white md:rounded-3xl shadow-2xl flex flex-col h-full max-w-7xl mx-auto overflow-hidden animate-in fade-in duration-500 md:my-8 border border-gray-100">' + datalist
);


// Replace onChange handler
// First occurrence (desktop view)
const searchStr1 = `onChange={e => updateItem(item.id, 'description', e.target.value)}`;
const replaceStr1 = `onChange={e => {
                                        const val = e.target.value;
                                        updateItem(item.id, 'description', val);
                                        const match = pastItems.find(p => p.description.toLowerCase() === val.toLowerCase());
                                        if (match) {
                                            setDocument((prev: any) => ({
                                                ...prev,
                                                items: prev.items.map((it: any) => 
                                                    it.id === item.id ? { 
                                                        ...it, 
                                                        hsn: it.hsn || match.hsn || '',
                                                        rate: it.rate === 0 ? (match.rate || 0) : it.rate,
                                                        taxRate: it.taxRate === 18 ? (match.taxRate || 18) : it.taxRate
                                                    } : it
                                                )
                                            }));
                                        }
                                      }}
                                      list="past-items-list"`;

content = content.replace(searchStr1, replaceStr1);

// Second occurrence (mobile view)
const searchStr2 = `onChange={e => updateItem(item.id, 'description', e.target.value)}`;
const replaceStr2 = `onChange={e => {
                                        const val = e.target.value;
                                        updateItem(item.id, 'description', val);
                                        const match = pastItems.find(p => p.description.toLowerCase() === val.toLowerCase());
                                        if (match) {
                                            setDocument((prev: any) => ({
                                                ...prev,
                                                items: prev.items.map((it: any) => 
                                                    it.id === item.id ? { 
                                                        ...it, 
                                                        hsn: it.hsn || match.hsn || '',
                                                        rate: it.rate === 0 ? (match.rate || 0) : it.rate,
                                                        taxRate: it.taxRate === 18 ? (match.taxRate || 18) : it.taxRate
                                                    } : it
                                                )
                                            }));
                                        }
                                    }}
                                    list="past-items-list"`;
                                    
content = content.replace(searchStr2, replaceStr2);


fs.writeFileSync('components/InvoiceForm.tsx', content);
console.log('Patched InvoiceForm.tsx');
