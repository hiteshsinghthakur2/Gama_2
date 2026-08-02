const fs = require('fs');
let content = fs.readFileSync('components/InvoiceList.tsx', 'utf-8');
content = content.replace(
    /onUpdateStatus: \(id: string, status: InvoiceStatus\) => void;/,
    "onUpdateStatus: (id: string, status: InvoiceStatus, paymentReference?: string, paymentDate?: string) => void;"
);

// add modal state
const stateStr = `  const [bulkShareData, setBulkShareData] = useState<{ docs: Invoice[], target: 'whatsapp' | 'email' | 'download' | 'drive' } | null>(null);`;
const newStateStr = `  const [bulkShareData, setBulkShareData] = useState<{ docs: Invoice[], target: 'whatsapp' | 'email' | 'download' | 'drive' } | null>(null);
  
  const [paymentModalInvoiceId, setPaymentModalInvoiceId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState<string>('');`;
content = content.replace(stateStr, newStateStr);

// replace Mark Paid
const markPaidStr = `<button onClick={() => { onUpdateStatus(inv.id, InvoiceStatus.PAID); setActiveStatusMenuId(null); }} className="text-left px-4 py-2 text-xs hover:bg-emerald-50 text-emerald-600 font-bold">Mark Paid</button>`;
const newMarkPaidStr = `<button onClick={() => { setPaymentModalInvoiceId(inv.id); setActiveStatusMenuId(null); }} className="text-left px-4 py-2 text-xs hover:bg-emerald-50 text-emerald-600 font-bold">Mark Paid</button>`;
content = content.replace(markPaidStr, newMarkPaidStr);

// add modal JSX at the end of the return statement
const returnEndStr = `    </div>
  );
};`;
const modalJSX = `
      {paymentModalInvoiceId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Record Payment</h3>
              <button onClick={() => { setPaymentModalInvoiceId(null); setPaymentDate(new Date().toISOString().split('T')[0]); setPaymentReference(''); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Payment Date</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Reference / UTR Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. UTR-123456789"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => { setPaymentModalInvoiceId(null); setPaymentDate(new Date().toISOString().split('T')[0]); setPaymentReference(''); }} 
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onUpdateStatus(paymentModalInvoiceId, InvoiceStatus.PAID, paymentReference, paymentDate);
                    setPaymentModalInvoiceId(null);
                    setPaymentDate(new Date().toISOString().split('T')[0]);
                    setPaymentReference('');
                  }} 
                  className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                >
                  Save Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`;
content = content.replace(returnEndStr, modalJSX);

fs.writeFileSync('components/InvoiceList.tsx', content);
console.log('Patched InvoiceList.tsx');
