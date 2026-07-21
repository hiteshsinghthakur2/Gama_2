import React, { useState, useEffect, useRef } from 'react';
import { PurchaseInvoice } from '../types';
import { PurchaseStorageService } from '../services/PurchaseStorageService';
import { parsePurchaseInvoiceFromImage } from '../services/geminiService';
import { TrashStorageService } from '../services/TrashStorageService';
import { uploadFileToDrive } from '../services/GoogleDriveService';

export const PurchaseArchive: React.FC = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState({ current: 0, total: 0 });

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        alert(`File ${f.name} is too large. Skipping files over 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsBulkUploading(true);
    setBulkUploadProgress({ current: 0, total: validFiles.length });

    let currentInvoices = await PurchaseStorageService.loadAll();

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const rawBase64 = base64.split(',')[1];
        const parseResult = await parsePurchaseInvoiceFromImage(rawBase64, file.type);

        let vName = 'Unknown Vendor';
        let invNum = '';
        let vDate = new Date().toISOString().split('T')[0];
        let vAmount = 0;
        let vCategory = '';

        if (parseResult.success && parseResult.data) {
          const data = parseResult.data;
          if (data.vendorName) vName = data.vendorName;
          if (data.invoiceNumber) invNum = data.invoiceNumber;
          if (data.category) vCategory = data.category;
          if (data.totalAmount || data.amount) vAmount = parseFloat(data.totalAmount?.toString() || data.amount?.toString() || '0') || 0;
          if (data.date) {
            try {
              const parsedDate = new Date(data.date);
              if (!isNaN(parsedDate.getTime())) {
                vDate = parsedDate.toISOString().split('T')[0];
              }
            } catch (e) {
              // ignore
            }
          }
        }

        const newInvoice: PurchaseInvoice = {
          id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          vendorName: vName,
          invoiceNumber: invNum,
          date: vDate,
          amount: vAmount,
          category: vCategory,
          notes: 'Bulk uploaded via AI',
          fileData: base64,
          fileName: file.name,
          fileType: file.type,
          createdAt: new Date().toISOString()
        };

        currentInvoices = [newInvoice, ...currentInvoices];
        await PurchaseStorageService.saveAll(currentInvoices);
        setInvoices(currentInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
        console.error('Failed to parse file ' + file.name, err);
      }

      setBulkUploadProgress({ current: i + 1, total: validFiles.length });
    }

    setIsBulkUploading(false);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
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
        const inv = invoices.find(i => i.id === id);
        if (inv) {
          await TrashStorageService.moveToTrash({ type: 'purchase', data: inv, summary: 'Purchase Invoice ' + (inv.invoiceNumber || inv.id), originalId: inv.id });
        }
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

  const handleUpdateComment = async (id: string, comment: string) => {
    try {
      const inv = invoices.find(i => i.id === id);
      if (!inv) return;
      const updated = { ...inv, comment };
      const currentInvoices = invoices.map(i => i.id === id ? updated : i);
      setInvoices(currentInvoices);
      await PurchaseStorageService.saveAll(currentInvoices);
    } catch (e) {
      console.error("Failed to update comment", e);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !searchTerm || inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || inv.category?.toLowerCase() === filterCategory.toLowerCase();
    const matchesDateFrom = !filterDateFrom || new Date(inv.date) >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || new Date(inv.date) <= new Date(filterDateTo);
    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const allCategories = Array.from(new Set(invoices.map(i => i.category).filter(Boolean)));

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map(inv => inv.id));
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  
  const handleDriveUpload = async (inv: PurchaseInvoice) => {
    if (!inv.fileData) return;
    try {
        const base64Data = inv.fileData.split(',')[1];
        const contentType = inv.fileType || 'image/png';
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const ext = inv.fileType?.includes('pdf') ? 'pdf' : (inv.fileType?.split('/')[1] || 'png');
        const filename = inv.fileName || `invoice_${inv.invoiceNumber || inv.id}.${ext}`;
        const uploadFile = new File([blob], filename, { type: contentType });
        
        await uploadFileToDrive(uploadFile, 'CraftDaddy Purchases');
        alert('File saved to Google Drive successfully!');
    } catch (e: any) {
        console.error('Drive upload error:', e);
        alert(`Failed to save to Google Drive: ${e.message}`);
    }
  };

  const handleBulkDriveUpload = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const targetInvoices = selectedIds.length > 0 ? filteredInvoices.filter(i => selectedIds.includes(i.id)) : filteredInvoices;
      const invoicesWithFiles = targetInvoices.filter(i => i.fileData);
      if (invoicesWithFiles.length === 0) {
        alert("No files to save in the current view/selection.");
        return;
      }
      
      invoicesWithFiles.forEach(inv => {
        const base64Data = inv.fileData!.split(',')[1];
        const ext = inv.fileType?.includes('pdf') ? 'pdf' : (inv.fileType?.split('/')[1] || 'png');
        const fileName = inv.fileName || `${inv.vendorName}_${inv.invoiceNumber || inv.id}.${ext}`;
        zip.file(fileName, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([content], 'Bulk_Purchases.zip', { type: 'application/zip' });
      
      await uploadFileToDrive(zipFile, 'CraftDaddy Purchases');
      alert('Bulk purchases saved to Google Drive successfully!');
    } catch (e: any) {
      console.error("Error bulk uploading", e);
      alert(`Failed to save bulk purchases to Google Drive: ${e.message}`);
    }
  };


  const handleDownload = (inv: PurchaseInvoice) => {
    if (!inv.fileData) return;
    const a = document.createElement('a');
    a.href = inv.fileData;
    a.download = inv.fileName || `invoice_${inv.invoiceNumber || inv.id}.${inv.fileType?.includes('pdf') ? 'pdf' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBulkDownload = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const targetInvoices = selectedIds.length > 0 ? filteredInvoices.filter(i => selectedIds.includes(i.id)) : filteredInvoices;
      const invoicesWithFiles = targetInvoices.filter(i => i.fileData);
      if (invoicesWithFiles.length === 0) {
        alert("No files to download in the current view/selection.");
        return;
      }
      
      invoicesWithFiles.forEach(inv => {
        const base64Data = inv.fileData!.split(',')[1];
        const ext = inv.fileType?.includes('pdf') ? 'pdf' : (inv.fileType?.split('/')[1] || 'png');
        const fileName = inv.fileName || `${inv.vendorName}_${inv.invoiceNumber || inv.id}.${ext}`;
        zip.file(fileName, base64Data, { base64: true });
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Purchase_Invoices_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to bulk download", e);
      alert("Failed to generate zip file.");
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} purchase invoices?`)) {
      try {
        for (const id of selectedIds) {
          const inv = invoices.find(i => i.id === id);
          if (inv) {
            await TrashStorageService.moveToTrash({ type: 'purchase', data: inv, summary: 'Purchase Invoice ' + (inv.invoiceNumber || inv.id), originalId: inv.id });
          }
          await PurchaseStorageService.delete(id);
        }
        setSelectedIds([]);
        await loadInvoices();
      } catch (e) {
        console.error("Error bulk deleting", e);
        alert("Failed to delete some or all selected invoices.");
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
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*,.pdf"
            multiple
            className="hidden"
            ref={bulkFileInputRef}
            onChange={handleBulkFileChange}
          />
          <button 
            onClick={() => bulkFileInputRef.current?.click()}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Bulk Upload
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Purchase
          </button>
        </div>
      </div>

      {invoices.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search vendor or invoice..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
            <select
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition appearance-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {allCategories.map((cat, i) => (
                <option key={i} value={cat as string}>{cat as string}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-36">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">From Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-36">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">To Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          {filteredInvoices.some(i => i.fileData) && (
            <button
              onClick={handleBulkDownload}
              className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-200 transition flex items-center gap-2 whitespace-nowrap"
              title="Download all filtered attachments"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Bulk DL
            </button>
          )}
        </div>
      )}

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
        <div className="space-y-4">
          {selectedIds.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                <span className="text-indigo-800 font-bold text-sm px-3">{selectedIds.length} invoice(s) selected</span>
                <div className="flex gap-2">
                    <button onClick={handleBulkDriveUpload} className="px-3 py-1.5 bg-white text-indigo-700 text-xs font-bold rounded-lg shadow-sm border border-indigo-200 hover:bg-indigo-50 flex items-center gap-2 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                        Save to Drive
                    </button>
                    <button onClick={handleBulkDownload} className="px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 transition">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Selected
                    </button>
                    <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-white text-red-600 text-xs font-bold rounded-lg shadow-sm border border-gray-200 hover:bg-red-50 flex items-center gap-2 transition">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete Selected
                    </button>
                </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-center w-12">
                      <input 
                         type="checkbox" 
                         checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0} 
                         onChange={toggleSelectAll}
                         className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Comment</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Attachment</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className={`hover:bg-gray-50/50 transition cursor-pointer ${selectedIds.includes(inv.id) ? 'bg-indigo-50/30' : ''}`} onClick={(e) => toggleSelect(e, inv.id)}>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                         type="checkbox" 
                         checked={selectedIds.includes(inv.id)} 
                         onChange={(e) => toggleSelect(e as any, inv.id)}
                         className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{new Date(inv.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{inv.vendorName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{inv.invoiceNumber || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs font-medium max-w-[150px] align-top" onClick={(e) => e.stopPropagation()}>
                    <textarea 
                      defaultValue={inv.comment || ''}
                      placeholder="Add comment..."
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5 placeholder-gray-300 text-gray-600 font-medium text-xs resize-none overflow-hidden break-words"
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                      onInput={(e) => {
                        e.currentTarget.style.height = 'auto';
                        e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                      }}
                      onBlur={(e) => {
                        if (e.target.value !== (inv.comment || '')) {
                          handleUpdateComment(inv.id, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">₹{inv.amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-4 text-center">
                        {inv.fileData ? (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                                onClick={() => setViewingInvoice(inv)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                View
                            </button>
                            <button 
                                onClick={() => handleDownload(inv)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition"
                                title="Download"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                DL
                            </button>
                          </div>
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
        </div>
      )}

      {/* Bulk Upload Progress Modal */}
      {isBulkUploading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Processing Bills</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">
              Extracting details and saving purchases automatically...
            </p>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${(bulkUploadProgress.current / bulkUploadProgress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {bulkUploadProgress.current} / {bulkUploadProgress.total} Files
            </p>
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
