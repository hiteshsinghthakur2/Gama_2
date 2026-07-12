import React, { useState, useEffect, useRef } from 'react';
import { PurchaseInvoice } from '../types';
import { PurchaseStorageService } from '../services/PurchaseStorageService';
import { parsePurchaseInvoiceFromImage } from '../services/geminiService';

export const PurchaseArchive: React.FC = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [vendorName, setVendorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [fileData, setFileData] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [fileType, setFileType] = useState<string | undefined>(undefined);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await PurchaseStorageService.loadAll();
      setInvoices(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
      console.error("Failed to load purchase invoices", e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Please select a file under 10MB.");
      return;
    }

    setFileName(file.name);
    setFileType(file.type);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setFileData(base64);

      try {
        setIsParsing(true);
        const rawBase64 = base64.split(',')[1];
        const parseResult = await parsePurchaseInvoiceFromImage(rawBase64, file.type);
        if (parseResult.success && parseResult.data) {
          const { data } = parseResult;
          if (data.vendorName) setVendorName(data.vendorName);
          if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
          if (data.date) {
            // Ensure date format is YYYY-MM-DD
            try {
              const parsedDate = new Date(data.date);
              if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate.toISOString().split('T')[0]);
              }
            } catch (e) {
              console.warn('Could not parse date', data.date);
            }
          }
          if (data.totalAmount || data.amount) setAmount(data.totalAmount?.toString() || data.amount?.toString() || '');
          if (data.category) setCategory(data.category);
        } else {
          console.warn("Could not parse invoice details automatically.");
        }
      } catch (err) {
        console.error("Error parsing invoice", err);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setVendorName('');
    setInvoiceNumber('');
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setCategory('');
    setNotes('');
    setFileData(undefined);
    setFileName(undefined);
    setFileType(undefined);
    setIsAdding(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !amount) {
      alert("Vendor name and amount are required.");
      return;
    }

    const newInvoice: PurchaseInvoice = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vendorName,
      invoiceNumber,
      date,
      amount: parseFloat(amount) || 0,
      category,
      notes,
      fileData,
      fileName,
      fileType,
      createdAt: new Date().toISOString()
    };

    try {
      await PurchaseStorageService.save(newInvoice);
      await loadInvoices();
      resetForm();
    } catch (error) {
      console.error("Error saving purchase invoice", error);
      alert("Failed to save the invoice.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this purchase invoice?")) {
      try {
        await PurchaseStorageService.delete(id);
        await loadInvoices();
        if (viewingInvoice?.id === id) {
          setViewingInvoice(null);
        }
      } catch (e) {
        console.error("Error deleting", e);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Purchase Archive</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage and store your incoming purchase bills</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Purchase
        </button>
      </div>

      {invoices.length === 0 && !isAdding ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
           <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           </div>
           <h3 className="text-xl font-bold text-gray-900">No purchases found</h3>
           <p className="text-gray-500 mt-2 max-w-sm mx-auto">Keep track of your expenses by uploading your purchase invoices, bills, and receipts.</p>
           <button 
              onClick={() => setIsAdding(true)}
              className="mt-6 text-indigo-600 font-bold hover:text-indigo-700"
           >
               Upload your first bill &rarr;
           </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Inv #</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Attachment</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{new Date(inv.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{inv.vendorName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{inv.invoiceNumber || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">₹{inv.amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-4 text-center">
                        {inv.fileData ? (
                            <button 
                                onClick={() => setViewingInvoice(inv)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                View File
                            </button>
                        ) : (
                            <span className="text-xs text-gray-400 font-medium">No File</span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => handleDelete(inv.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Delete"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 sm:p-8 overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Add Purchase</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition bg-gray-100 hover:bg-gray-200 rounded-full p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vendor Name *</label>
                    <input 
                      required
                      type="text" 
                      value={vendorName}
                      onChange={e => setVendorName(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Amount *</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                        <input 
                        required
                        type="number" 
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 pl-8 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-bold text-gray-900"
                        placeholder="0.00"
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Invoice #</label>
                    <input 
                      type="text" 
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium text-sm"
                      placeholder="e.g. INV-2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium text-sm"
                    />
                  </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upload Bill / Receipt (PDF or Image)</label>
                
                {!fileData ? (
                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-50/50 transition cursor-pointer text-gray-500 hover:text-indigo-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <span className="font-bold text-sm">Upload File</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => captureInputRef.current?.click()}
                            className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:bg-emerald-50/50 transition cursor-pointer text-gray-500 hover:text-emerald-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="font-bold text-sm">Use Camera</span>
                        </button>
                        
                        <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            ref={captureInputRef}
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                {fileType?.includes('pdf') ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900 truncate max-w-[200px] sm:max-w-xs">{fileName}</p>
                                <p className="text-xs text-gray-500 font-medium">
                                  {isParsing ? (
                                    <span className="flex items-center gap-1 text-indigo-600 animate-pulse">
                                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                      Extracting details...
                                    </span>
                                  ) : 'Ready to upload'}
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => { setFileData(undefined); setFileName(undefined); setFileType(undefined); }}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category (Optional)</label>
                <input 
                  type="text" 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium text-sm"
                  placeholder="e.g. Raw Materials, Office Supplies"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition">
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white z-10 shrink-0">
              <div>
                <h3 className="font-black text-gray-900">{viewingInvoice.vendorName}</h3>
                <p className="text-xs text-gray-500 font-medium">Inv: {viewingInvoice.invoiceNumber || '-'} • Amount: ₹{viewingInvoice.amount}</p>
              </div>
              <button onClick={() => setViewingInvoice(null)} className="text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 bg-gray-100 relative overflow-hidden flex items-center justify-center p-4">
                {viewingInvoice.fileType?.includes('pdf') ? (
                    <iframe 
                        src={viewingInvoice.fileData} 
                        className="w-full h-full rounded-xl border border-gray-200 shadow-sm"
                        title="PDF Viewer"
                    />
                ) : (
                    <img 
                        src={viewingInvoice.fileData} 
                        alt="Receipt" 
                        className="max-w-full max-h-full object-contain rounded-xl shadow-sm"
                    />
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
