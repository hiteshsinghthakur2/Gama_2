
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Invoice, 
  Quotation, 
  Client, 
  UserBusinessProfile, 
  LineItem, 
  InvoiceStatus,
  QuotationStatus,
  CustomField,
  AdditionalCharge
} from '../types';
import { INDIAN_STATES, CRAFT_DADDY_LOGO_SVG } from '../constants';
import { calculateLineItem, numberToWords, formatCurrency } from '../services/Calculations';

interface DocumentFormProps {
  userProfile: UserBusinessProfile;
  clients: Client[];
  onSave: (document: any) => void;
  onCancel: () => void;
  initialData?: Invoice | Quotation;
  mode?: 'invoice' | 'quotation';
  onConvertToInvoice?: (quotation: Quotation) => void;
}

const InvoiceForm: React.FC<DocumentFormProps> = ({ 
  userProfile, 
  clients, 
  onSave, 
  onCancel, 
  initialData, 
  mode = 'invoice',
  onConvertToInvoice
}) => {
  // Use a generic state that matches the structure of both Invoice and Quotation
  // We'll treat 'dueDate' as 'validUntil' when in quotation mode
  const [document, setDocument] = useState<any>(() => {
    const baseDoc = initialData ? { ...initialData } : {
      id: `${mode === 'invoice' ? 'inv' : 'qt'}-${Date.now()}`,
      number: mode === 'invoice' 
        ? `CD${new Date().getFullYear().toString().slice(-2)}${Math.floor(Math.random() * 99999)}`
        : `QT${new Date().getFullYear().toString().slice(-2)}${Math.floor(Math.random() * 99999)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: '', // used as validUntil for quotation
      poNumber: '',
      status: mode === 'invoice' ? InvoiceStatus.DRAFT : QuotationStatus.DRAFT,
      clientId: clients[0]?.id || '',
      items: [
        { id: '1', description: 'REFLECTIVE JACKET', hsn: '6210', qty: 225, rate: 100, taxRate: 5 },
      ],
      placeOfSupply: 'Delhi (07)',
      bankDetails: userProfile.bankAccounts[0],
      notes: '',
      terms: '1. For questions concerning this document, please contact Email Address : sales@craftdaddy.in\n2. All the dispute are subject to delhi jurisdiction only',
      customFields: [],
      discountType: 'fixed',
      discountValue: 0,
      additionalCharges: [],
      roundOff: 0,
      showBankDetails: true
    };

    if (mode === 'quotation' && (initialData as Quotation)?.validUntil) {
       baseDoc.dueDate = (initialData as Quotation).validUntil;
    }

    if (!baseDoc.bankDetails && userProfile.bankAccounts.length > 0) {
      baseDoc.bankDetails = userProfile.bankAccounts[0];
    }

    if (baseDoc.showBankDetails === undefined) {
      baseDoc.showBankDetails = true;
    }

    if (!baseDoc.customFields || baseDoc.customFields.length === 0) {
      baseDoc.customFields = [
         { label: 'P.O. Number', value: baseDoc.poNumber || '' }
      ];
    }

    return baseDoc;
  });

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(true);
  const [showDiscount, setShowDiscount] = useState(false);
  
  const isQuotation = mode === 'quotation';

  useEffect(() => {
    if (document.discountValue && document.discountValue > 0) {
        setShowDiscount(true);
    }
  }, [document.discountValue]);

  const selectedClient = useMemo(() => clients.find(c => c.id === document.clientId), [clients, document.clientId]);
  
  const isInterState = useMemo(() => {
    // Extract code from "State (Code)" format e.g., "Delhi (07)" -> "07"
    const supplyStateMatch = document.placeOfSupply.match(/\((\d+)\)/);
    const supplyStateCode = supplyStateMatch ? supplyStateMatch[1] : null;
    
    const userStateCode = userProfile.address.stateCode;

    // Strict numeric comparison to handle "07" vs "7"
    if (supplyStateCode && userStateCode) {
        return parseInt(supplyStateCode, 10) !== parseInt(userStateCode, 10);
    }

    // Fallback: Name comparison if codes are missing
    const posLower = document.placeOfSupply.toLowerCase().trim();
    const userStateLower = userProfile.address.state.toLowerCase().trim();
    if (posLower && userStateLower) {
        // If the POS string contains the user state name, assume Intra-state
        if (posLower.includes(userStateLower)) return false;
        return true; 
    }

    return false; // Default to Intra-state
  }, [document.placeOfSupply, userProfile.address.stateCode, userProfile.address.state]);

  const totals = useMemo(() => {
    const itemTotals = (document.items || []).reduce((acc: any, item: LineItem) => {
      const calc = calculateLineItem(item, !!isInterState);
      return {
        taxable: acc.taxable + calc.taxableValue,
        cgst: acc.cgst + calc.cgst,
        sgst: acc.sgst + calc.sgst,
        igst: acc.igst + calc.igst,
        total: acc.total + calc.total
      };
    }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

    let discountAmount = 0;
    if (document.discountValue) {
      if (document.discountType === 'percentage') {
        discountAmount = (itemTotals.taxable * document.discountValue) / 100;
      } else {
        discountAmount = document.discountValue;
      }
    }

    const additionalChargesTotal = (document.additionalCharges || []).reduce((sum: number, charge: AdditionalCharge) => sum + (charge.amount || 0), 0);
    const preRoundTotal = itemTotals.total - discountAmount + additionalChargesTotal;
    const finalTotal = preRoundTotal + (document.roundOff || 0);

    return {
      ...itemTotals,
      discountAmount,
      additionalChargesTotal,
      preRoundTotal,
      finalTotal
    };
  }, [document.items, isInterState, document.discountType, document.discountValue, document.additionalCharges, document.roundOff]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClientId = e.target.value;
    const client = clients.find(c => c.id === newClientId);
    
    let newPlaceOfSupply = document.placeOfSupply;

    if (client) {
        // 1. Try to get State Code from GSTIN (First 2 chars)
        let code = '';
        if (client.gstin && client.gstin.length >= 2) {
            code = client.gstin.substring(0, 2);
        } else if (client.address?.stateCode) {
            // 2. Fallback to address state code
            code = client.address.stateCode;
        }

        // 3. Find State Name from Constants
        const stateObj = INDIAN_STATES.find(s => s.code === code);
        const name = stateObj ? stateObj.name : client.address?.state;

        // 4. Construct standard "State (Code)" string
        if (name && code) {
            newPlaceOfSupply = `${name} (${code})`;
        } else if (name) {
             newPlaceOfSupply = name;
        }
    }

    setDocument(prev => ({
        ...prev,
        clientId: newClientId,
        placeOfSupply: newPlaceOfSupply
    }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setDocument((prev: any) => ({
      ...prev,
      items: prev.items.map((item: LineItem) => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setDocument((prev: any) => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }]
    }));
  };

  const duplicateItem = (id: string) => {
    setDocument((prev: any) => {
        const index = prev.items.findIndex((i: LineItem) => i.id === id);
        if (index === -1) return prev;
        
        const itemToClone = prev.items[index];
        // Create deep copy with new ID
        const newItem = { 
            ...itemToClone, 
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
        };
        
        const newItems = [...prev.items];
        newItems.splice(index + 1, 0, newItem);
        
        return { ...prev, items: newItems };
    });
  };

  const removeItem = (id: string) => {
    if (document.items.length <= 1) return;
    setDocument((prev: any) => ({ ...prev, items: prev.items.filter((i: LineItem) => i.id !== id) }));
  };

  const addCustomField = () => {
    setDocument((prev: any) => ({
      ...prev,
      customFields: [...(prev.customFields || []), { label: '', value: '' }]
    }));
  };

  const updateCustomField = (index: number, field: keyof CustomField, value: string) => {
    const newFields = [...(document.customFields || [])];
    newFields[index] = { ...newFields[index], [field]: value };
    setDocument({ ...document, customFields: newFields });
  };

  const removeCustomField = (index: number) => {
    const newFields = [...(document.customFields || [])];
    newFields.splice(index, 1);
    setDocument({ ...document, customFields: newFields });
  };

  const addAdditionalCharge = () => {
    setDocument((prev: any) => ({
      ...prev,
      additionalCharges: [...(prev.additionalCharges || []), { id: Date.now().toString(), label: '', amount: 0 }]
    }));
  };

  const updateAdditionalCharge = (id: string, field: keyof AdditionalCharge, value: any) => {
    setDocument((prev: any) => ({
      ...prev,
      additionalCharges: (prev.additionalCharges || []).map((c: AdditionalCharge) => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const removeAdditionalCharge = (id: string) => {
    setDocument((prev: any) => ({
      ...prev,
      additionalCharges: (prev.additionalCharges || []).filter((c: AdditionalCharge) => c.id !== id)
    }));
  };

  const handleRoundUp = () => {
    const current = totals.preRoundTotal;
    const target = Math.ceil(current);
    const diff = target - current;
    setDocument({ ...document, roundOff: diff });
  };

  const handleRoundDown = () => {
    const current = totals.preRoundTotal;
    const target = Math.floor(current);
    const diff = target - current;
    setDocument({ ...document, roundOff: diff });
  };

  const handleSave = () => {
     // Format data back to specific type structure if needed
     const finalData = { ...document };
     if (isQuotation) {
        finalData.validUntil = finalData.dueDate;
        delete finalData.dueDate;
     }
     onSave(finalData);
  };

  const handlePrint = () => {
    if (window) {
        window.focus();
        setTimeout(() => {
            window.print();
        }, 100);
    }
  };

  const handleConversion = () => {
    if (onConvertToInvoice) {
        // Format data properly before converting
        const finalData = { ...document };
        if (isQuotation) {
            finalData.validUntil = finalData.dueDate;
            delete finalData.dueDate;
        }
        onConvertToInvoice(finalData);
    }
  };

  // Adjusted grid columns to give Rate more space (80px) and added 60px action column (increased from 30px)
  const GRID_COLS = "grid-cols-[20px_minmax(0,2fr)_minmax(60px,0.5fr)_minmax(55px,0.4fr)_minmax(55px,0.4fr)_minmax(80px,0.5fr)_minmax(90px,0.6fr)_minmax(70px,0.5fr)_minmax(70px,0.5fr)_minmax(90px,0.6fr)_60px]";

  return (
    <div className="min-h-screen bg-gray-50 pb-32 relative font-sans text-sm text-gray-700">
      
      {/* =====================================================================================
          EDITOR VIEW (Visible on Screen, Hidden on Print)
         ===================================================================================== */}
      <div className="print:hidden">
        {/* Top Navigation - Sticky for better UX */}
        <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm transition-all">
            <div className="max-w-6xl mx-auto py-4 px-4 flex justify-between items-center">
              <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition group">
                  <div className="bg-white p-1.5 rounded-full border border-gray-200 group-hover:border-gray-400 transition shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </div>
                  <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
              <div className="flex gap-3">
                  {/* Convert to Invoice Button (Only in Quotation Mode) */}
                  {isQuotation && onConvertToInvoice && (
                    <button 
                        type="button"
                        onClick={handleConversion} 
                        className="bg-white text-indigo-600 border border-indigo-200 px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-50 active:scale-95 flex items-center gap-2 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        Convert to Invoice
                    </button>
                  )}
                  {/* Primary Action Button for Printing */}
                  <button 
                      type="button"
                      onClick={handlePrint} 
                      className="bg-indigo-600 text-white border border-transparent px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95 flex items-center gap-2 transition transform"
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Print / Save PDF
                  </button>
              </div>
            </div>
        </div>

        {/* Main Editor Document */}
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg p-6 md:p-12 mb-8 mt-6 relative">
          {/* Header */}
          <div className="flex flex-col items-center mb-10 group relative">
              <div className="flex items-center gap-2 border-b-2 border-dashed border-gray-300 pb-1 mb-1 hover:border-gray-400 transition">
                <h1 className="text-3xl font-extrabold text-gray-900 cursor-text">
                    {isQuotation ? 'Quotation' : 'Tax Invoice'}
                </h1>
                <span className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </span>
              </div>
              <p className="text-indigo-500 text-xs font-bold mt-1 cursor-pointer">+ Add Subtitle</p>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
              {/* Left Info Fields */}
              <div className="flex-1 space-y-5 max-w-sm">
                <div className="grid grid-cols-[110px_1fr] items-center gap-2 group">
                    <label className="text-gray-500 font-semibold underline decoration-dotted cursor-help">
                        {isQuotation ? 'Quotation No' : 'Invoice No'}<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={document.number} 
                      onChange={(e) => setDocument({...document, number: e.target.value})}
                      className="w-full font-bold text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 transition-colors bg-transparent"
                    />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-gray-500 font-semibold underline decoration-dotted cursor-help">
                        {isQuotation ? 'Quotation Date' : 'Invoice Date'}<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      required
                      value={document.date} 
                      onChange={(e) => setDocument({...document, date: e.target.value})}
                      className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 transition-colors bg-transparent cursor-pointer"
                      onClick={(e) => e.currentTarget.showPicker()}
                    />
                </div>
                
                <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-gray-500 font-semibold underline decoration-dotted cursor-help">
                        {isQuotation ? 'Valid Till Date' : 'Due Date'}
                    </label>
                    <input 
                      type="date" 
                      value={document.dueDate} 
                      onChange={(e) => setDocument({...document, dueDate: e.target.value})}
                      className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 transition-colors bg-transparent cursor-pointer"
                      onClick={(e) => e.currentTarget.showPicker()}
                      placeholder="Optional"
                    />
                </div>
                
                {/* Place of Supply Input */}
                <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-gray-500 font-semibold underline decoration-dotted cursor-help">
                        Place of Supply
                    </label>
                    <input 
                      type="text" 
                      value={document.placeOfSupply} 
                      onChange={(e) => setDocument({...document, placeOfSupply: e.target.value})}
                      className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 transition-colors bg-transparent"
                      list="state-list"
                    />
                    <datalist id="state-list">
                        {INDIAN_STATES.map(s => <option key={s.code} value={`${s.name} (${s.code})`} />)}
                    </datalist>
                </div>

                {/* Custom Fields (PO Number etc) */}
                {document.customFields?.map((field: CustomField, index: number) => (
                    <div key={index} className="grid grid-cols-[110px_1fr] items-center gap-2 group">
                      <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                          className="text-gray-500 font-semibold bg-transparent outline-none border-b border-transparent focus:border-indigo-600 placeholder-gray-400 text-right pr-2"
                          placeholder="Label"
                      />
                      <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={field.value} 
                            onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                            className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 bg-transparent"
                            placeholder="Value"
                          />
                          <button onClick={() => removeCustomField(index)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-1">×</button>
                      </div>
                    </div>
                ))}
                
                <button 
                    onClick={addCustomField}
                    className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1 mt-2 transition"
                >
                    <span className="text-lg leading-none">+</span> Add Custom Fields
                </button>
              </div>

              {/* Right Logo Area */}
              <div className="w-full md:w-72 flex flex-col items-center">
                <div className="w-full h-32 border border-gray-100 rounded-lg flex items-center justify-center p-4 relative group bg-white shadow-sm hover:shadow-md transition">
                    <img src={userProfile.logoUrl || CRAFT_DADDY_LOGO_SVG} className="max-h-full max-w-full object-contain" alt="Logo" />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-400 font-medium">
                   <button className="hover:text-red-500">× Remove</button>
                   <button className="hover:text-indigo-600">✎ change</button>
                </div>
              </div>
          </div>

          {/* Billed By / Billed To Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Billed By */}
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white shadow-sm transition duration-300">
                <div className="px-5 py-3 border-b border-gray-100 bg-white flex justify-between items-center">
                    <h3 className="text-gray-800 font-bold text-base border-b-2 border-gray-800 pb-0.5 inline-block">
                        {isQuotation ? 'Quotation From' : 'Billed By'}
                    </h3>
                    <span className="text-xs text-gray-400">Your Details</span>
                </div>
                <div className="p-5 flex-1 bg-white">
                    <div className="mb-4">
                      <select className="border border-gray-200 rounded-md w-full p-2 bg-gray-50/50 text-sm focus:border-indigo-500 outline-none">
                          <option>{userProfile.companyName}</option>
                      </select>
                    </div>
                    {/* Display User Profile Details in Editor */}
                    <div className="text-xs text-gray-600 space-y-3 mt-4">
                        <div className="grid grid-cols-[100px_1fr]">
                           <span className="font-bold text-gray-700">Business Name</span>
                           <span className="font-bold text-indigo-700">{userProfile.companyName}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr]">
                           <span className="font-bold text-gray-700">Address</span>
                           <span>{userProfile.address.street}, {userProfile.address.city}, {userProfile.address.state} - {userProfile.address.pincode}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr]">
                           <span className="font-bold text-gray-700">GSTIN</span>
                           <span>{userProfile.gstin}</span>
                        </div>
                         <div className="grid grid-cols-[100px_1fr]">
                           <span className="font-bold text-gray-700">PAN</span>
                           <span>{userProfile.pan}</span>
                        </div>
                    </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white shadow-sm transition duration-300">
                <div className="px-5 py-3 border-b border-gray-100 bg-white flex justify-between items-center">
                     <h3 className="text-gray-800 font-bold text-base border-b-2 border-gray-800 pb-0.5 inline-block">
                        {isQuotation ? 'Quotation For' : 'Billed To'}
                    </h3>
                    <span className="text-xs text-gray-400">Client's Details</span>
                </div>
                <div className="p-5 flex-1 bg-white">
                    <div className="mb-4">
                      <select 
                          className="border border-gray-200 rounded-md w-full p-2 bg-white text-sm focus:border-indigo-500 outline-none"
                          value={document.clientId}
                          onChange={handleClientChange}
                      >
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {/* Display Selected Client Details in Editor */}
                    {selectedClient && (
                      <div className="text-xs text-gray-600 space-y-3 mt-4">
                        <div className="grid grid-cols-[100px_1fr]">
                           <span className="font-bold text-gray-700">Business Name</span>
                           <span className="font-bold text-indigo-700">{selectedClient.name}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr]">
                           <span className="font-bold text-gray-700">Address</span>
                           <span>{selectedClient.address.street}, {selectedClient.address.city}, {selectedClient.address.state} - {selectedClient.address.pincode}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr]">
                           <span className="font-bold text-gray-700">GSTIN</span>
                           <span>{selectedClient.gstin || 'N/A'}</span>
                        </div>
                        {selectedClient.phone && (
                          <div className="grid grid-cols-[100px_1fr]">
                             <span className="font-bold text-gray-700">Phone</span>
                             <span>{selectedClient.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
             <input type="checkbox" id="shipping" className="rounded text-indigo-600 focus:ring-indigo-500" />
             <label htmlFor="shipping" className="text-xs text-gray-500 font-medium">Add Shipping Details</label>
          </div>

          {/* Line Items Table (Desktop View) */}
          <div className="hidden md:block mb-4 rounded-t-lg border border-gray-200 overflow-hidden">
              <div className="min-w-full">
                  <div className={`bg-[#8b5cf6] text-white text-xs font-bold py-3 px-3 grid ${GRID_COLS} gap-2 items-center rounded-t-lg`}>
                    <div>#</div>
                    <div>Item</div>
                    <div className="text-center">HSN/SAC</div>
                    <div className="text-left pl-1">TAX Rate</div>
                    <div className="text-left">Quantity</div>
                    <div className="text-left">Rate</div>
                    <div className="text-left">Amount</div>
                    {isInterState ? (
                        <div className="text-center col-span-2">IGST</div>
                    ) : (
                        <>
                          <div className="text-left">CGST</div>
                          <div className="text-left">SGST</div>
                        </>
                    )}
                    <div className="text-left">Total</div>
                    <div></div>
                  </div>

                  {document.items.map((item: LineItem, idx: number) => {
                    const calc = calculateLineItem(item, !!isInterState);
                    return (
                        <div key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition group">
                          <div className={`py-4 px-3 grid ${GRID_COLS} gap-2 items-start text-xs text-gray-800`}>
                              <div className="font-bold pt-2 text-base">{idx + 1}.</div>
                              <div className="space-y-3">
                                <div className="relative">
                                    <input 
                                      type="text" 
                                      className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-indigo-500 outline-none pb-1 font-medium placeholder-gray-400 text-gray-900 text-sm"
                                      value={item.description}
                                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                                      placeholder="Item Name"
                                    />
                                </div>
                                <div className="border border-gray-200 rounded p-2 bg-white relative">
                                    <div className="flex gap-2 mb-1 border-b border-gray-100 pb-1">
                                        <button className="p-1 hover:bg-gray-100 rounded">B</button>
                                        <button className="p-1 hover:bg-gray-100 rounded italic">I</button>
                                        <button className="p-1 hover:bg-gray-100 rounded underline">U</button>
                                    </div>
                                    <textarea 
                                        className="w-full text-xs text-gray-600 outline-none resize-none bg-transparent"
                                        rows={3}
                                        placeholder="Add description..."
                                    ></textarea>
                                </div>
                              </div>
                              <div className="pt-1">
                                  <input 
                                    type="text" 
                                    className="w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none text-center"
                                    value={item.hsn}
                                    onChange={e => updateItem(item.id, 'hsn', e.target.value)}
                                    placeholder="HSN"
                                  />
                              </div>
                              <div className="pt-1">
                                  <div className="flex items-center">
                                      <span className="mr-1">%</span>
                                      <input 
                                        type="number"
                                        className="w-full bg-transparent border-none outline-none text-left"
                                        value={item.taxRate}
                                        onChange={e => updateItem(item.id, 'taxRate', parseFloat(e.target.value))}
                                      />
                                  </div>
                              </div>
                              <div className="pt-1">
                                  <input 
                                    type="number" 
                                    className="w-full text-left bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none transition-colors"
                                    value={item.qty}
                                    onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value))}
                                  />
                              </div>
                              <div className="pt-1 flex items-center">
                                  <span className="mr-1 text-gray-500 font-bold">₹</span>
                                  <input 
                                    type="number" 
                                    className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-left font-bold text-gray-900"
                                    value={item.rate}
                                    onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value))}
                                  />
                              </div>
                              <div className="pt-1 text-left font-medium">₹{calc.taxableValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                              
                              {isInterState ? (
                                  <div className="pt-1 text-center col-span-2 font-medium text-gray-700">
                                      ₹{calc.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                  </div>
                              ) : (
                                  <>
                                      <div className="pt-1 text-left text-gray-500">₹{calc.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                                      <div className="pt-1 text-left text-gray-500">₹{calc.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                                  </>
                              )}

                              <div className="pt-1 text-left font-bold text-gray-900">₹{calc.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                              <div className="pt-1 flex justify-center gap-1">
                                <button 
                                    onClick={() => duplicateItem(item.id)}
                                    className="text-gray-400 hover:text-indigo-600 transition p-1"
                                    title="Duplicate Item"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                                <button 
                                    onClick={() => removeItem(item.id)} 
                                    className="text-gray-400 hover:text-red-500 transition p-1"
                                    title="Remove Item"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                          </div>
                        </div>
                    );
                  })}
              </div>
          </div>

          {/* Line Items Cards (Mobile View) */}
          <div className="md:hidden space-y-4 mb-8">
             {document.items.map((item: LineItem, idx: number) => {
                 const calc = calculateLineItem(item, !!isInterState);
                 return (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                            <span className="font-black text-gray-500 text-lg">{idx + 1}.</span>
                            <div className="flex items-center gap-3">
                                <button onClick={() => duplicateItem(item.id)} className="text-gray-400 hover:text-indigo-600 p-1">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                                <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        
                        {/* Form Fields - Styled to match reference image (Label left, Input right) */}
                        <div className="p-4 space-y-4">
                            {/* Item Name */}
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <label className="text-xs font-semibold text-gray-500 w-1/3">Item</label>
                                <input 
                                    type="text" 
                                    className="w-2/3 text-right font-medium text-gray-900 outline-none bg-transparent focus:text-indigo-600 placeholder-gray-300"
                                    value={item.description}
                                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                                    placeholder="Item Name"
                                />
                            </div>

                            {/* HSN */}
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <label className="text-xs font-semibold text-gray-500 w-1/3">HSN/SAC</label>
                                <input 
                                    type="text" 
                                    className="w-2/3 text-right font-medium text-gray-900 outline-none bg-transparent placeholder-gray-300"
                                    value={item.hsn}
                                    onChange={e => updateItem(item.id, 'hsn', e.target.value)}
                                    placeholder="Code"
                                />
                            </div>

                             {/* Description Button (Visual placeholder to match reference, actually just spacing or could toggle optional textarea) */}
                             <div className="pb-2">
                                <button className="text-indigo-600 text-xs font-bold flex items-center gap-1">
                                    <span className="text-lg leading-none">+</span> Add Description
                                </button>
                             </div>

                            {/* GST Rate */}
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <label className="text-xs font-semibold text-gray-500 w-1/3">GST Rate</label>
                                <div className="flex items-center justify-end w-2/3">
                                    <input 
                                        type="number" 
                                        className="text-right font-medium text-gray-900 outline-none bg-transparent w-full"
                                        value={item.taxRate}
                                        onChange={e => updateItem(item.id, 'taxRate', parseFloat(e.target.value))}
                                    />
                                    <span className="text-gray-400 ml-1">%</span>
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <label className="text-xs font-semibold text-gray-500 w-1/3">Quantity</label>
                                <input 
                                    type="number" 
                                    className="w-2/3 text-right font-medium text-gray-900 outline-none bg-transparent"
                                    value={item.qty}
                                    onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value))}
                                />
                            </div>

                            {/* Rate */}
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <label className="text-xs font-semibold text-gray-500 w-1/3">Rate</label>
                                <div className="flex items-center justify-end w-2/3">
                                    <span className="text-gray-400 mr-1">₹</span>
                                    <input 
                                        type="number" 
                                        className="text-right font-medium text-gray-900 outline-none bg-transparent w-full"
                                        value={item.rate}
                                        onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Amount (Read only) */}
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <label className="text-xs font-semibold text-gray-500 w-1/3">Amount</label>
                                <span className="text-gray-700 font-medium">₹{calc.taxableValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                            </div>

                             {/* Taxes */}
                            {isInterState ? (
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <label className="text-xs font-semibold text-gray-500 w-1/3">IGST</label>
                                    <span className="text-gray-700 font-medium">₹{calc.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                        <label className="text-xs font-semibold text-gray-500 w-1/3">CGST</label>
                                        <span className="text-gray-700 font-medium">₹{calc.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                        <label className="text-xs font-semibold text-gray-500 w-1/3">SGST</label>
                                        <span className="text-gray-700 font-medium">₹{calc.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                                    </div>
                                </>
                            )}

                            {/* Total */}
                            <div className="flex justify-between items-center pt-2">
                                <label className="text-sm font-bold text-gray-800 w-1/3">Total</label>
                                <span className="text-gray-900 font-black text-lg">₹{calc.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                            </div>

                        </div>
                    </div>
                 );
             })}
          </div>

          <div className="flex justify-between mb-12">
            <div className="flex gap-4">
                 <button 
                  onClick={addItem}
                  className="border border-dashed border-indigo-400 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 transition"
              >
                  <span className="text-lg leading-none">+</span> Add New Line
              </button>
            </div>
          </div>
          
          <div className="flex justify-end mb-12">
               <div className="w-80">
                   <div className="space-y-2 text-sm">
                      <div className="flex justify-between font-bold text-gray-700">
                          <span>Amount</span>
                          <span>₹{totals.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>

                      {isInterState ? (
                           <div className="flex justify-between font-bold text-gray-700">
                               <span>IGST</span>
                               <span>₹{totals.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                           </div>
                      ) : (
                           <>
                                <div className="flex justify-between font-bold text-gray-700">
                                    <span>SGST</span>
                                    <span>₹{totals.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-700">
                                    <span>CGST</span>
                                    <span>₹{totals.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                                </div>
                           </>
                      )}

                      {/* Discount Section */}
                      {showDiscount ? (
                        <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 mt-2">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-indigo-800">Discount</label>
                                <button 
                                    onClick={() => {
                                        setDocument({...document, discountValue: 0});
                                        setShowDiscount(false);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition"
                                >×</button>
                            </div>
                            <div className="flex gap-2 mb-1">
                                <select 
                                    className="bg-white border border-gray-200 rounded text-xs p-1.5 focus:border-indigo-500 outline-none w-20"
                                    value={document.discountType}
                                    onChange={(e) => setDocument({...document, discountType: e.target.value as 'fixed' | 'percentage'})}
                                >
                                    <option value="fixed">Fixed</option>
                                    <option value="percentage">%</option>
                                </select>
                                <div className="relative flex-1">
                                    <input 
                                        type="number" 
                                        className="w-full bg-white border border-gray-200 rounded text-xs p-1.5 pl-5 focus:border-indigo-500 outline-none text-right font-medium"
                                        value={document.discountValue || ''}
                                        onChange={(e) => setDocument({...document, discountValue: parseFloat(e.target.value) || 0})}
                                        placeholder="0"
                                    />
                                    <span className="absolute left-2 top-1.5 text-gray-400 text-xs">
                                        {document.discountType === 'fixed' ? '₹' : '%'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-green-600 font-bold border-t border-indigo-100 pt-1 mt-1">
                                <span>Applied:</span>
                                <span>- ₹{totals.discountAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                            </div>
                        </div>
                      ) : (
                          <div className="pt-2">
                             <button 
                                onClick={() => setShowDiscount(true)}
                                className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline"
                             >
                                <span className="text-lg leading-none">+</span> Add Discounts
                             </button>
                          </div>
                      )}

                      {/* Additional Charges Section */}
                      {(document.additionalCharges && document.additionalCharges.length > 0) && (
                          <div className="mt-2 space-y-2">
                              {document.additionalCharges.map((charge: AdditionalCharge) => (
                                  <div key={charge.id} className="grid grid-cols-[1fr_80px_20px] gap-2 items-center group">
                                      <input 
                                          type="text" 
                                          className="text-xs border-b border-gray-200 focus:border-indigo-500 outline-none bg-transparent py-1 placeholder-gray-400"
                                          placeholder="Charge Name (e.g. Shipping)"
                                          value={charge.label}
                                          onChange={(e) => updateAdditionalCharge(charge.id, 'label', e.target.value)}
                                      />
                                      <input 
                                          type="number" 
                                          className="text-xs border-b border-gray-200 focus:border-indigo-500 outline-none bg-transparent py-1 text-right font-medium"
                                          placeholder="0"
                                          value={charge.amount || ''}
                                          onChange={(e) => updateAdditionalCharge(charge.id, 'amount', parseFloat(e.target.value) || 0)}
                                      />
                                      <button 
                                          onClick={() => removeAdditionalCharge(charge.id)}
                                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                      >
                                          ×
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}

                      <div className="pt-1">
                         <button 
                            onClick={addAdditionalCharge}
                            className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline"
                         >
                            <span className="text-lg leading-none">+</span> Add Additional Charges
                         </button>
                      </div>

                       <div className="flex items-center gap-2 mt-2">
                         <input type="checkbox" className="rounded text-indigo-600" />
                         <span className="text-xs text-gray-500">Summarise Total Quantity</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
                          <span className="font-bold text-lg text-gray-800">Total (INR)</span>
                          <span className="font-bold text-lg text-gray-900">₹{totals.finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                   </div>
               </div>
          </div>

          <div className="mb-8">
             <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg cursor-pointer">
                 <span className="font-bold text-gray-800 text-sm">Show Total in Words</span>
                 <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             </div>
             <div className="p-3 text-sm text-gray-500">
                 <p className="text-xs text-gray-400">Total (in words)</p>
                 <p>{numberToWords(Math.round(totals.finalTotal))}</p>
             </div>
          </div>

          <div className="mb-8">
             <div className="flex gap-4 border-b border-gray-100 pb-2">
                 <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 border border-dashed border-indigo-200 px-4 py-2 rounded-lg bg-indigo-50">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     Add Notes
                 </button>
                 <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 border border-dashed border-indigo-200 px-4 py-2 rounded-lg bg-white hover:bg-indigo-50">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                     Add Attachments
                 </button>
                  <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 border border-dashed border-indigo-200 px-4 py-2 rounded-lg bg-white hover:bg-indigo-50">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                     Add Contact Details
                 </button>
             </div>
          </div>
          
          <div className="flex items-center gap-3 mb-8 bg-gray-50 p-4 rounded-lg">
             <input 
                type="checkbox" 
                id="showBankDetails"
                checked={document.showBankDetails}
                onChange={(e) => setDocument({...document, showBankDetails: e.target.checked})}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
             />
             <label htmlFor="showBankDetails" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                Include Bank Details in Print/PDF
             </label>
          </div>
          
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <button 
                onClick={handleSave}
                className="bg-[#E91E63] text-white px-12 py-3 rounded-md font-bold text-sm shadow-lg hover:bg-[#D81B60] transform hover:-translate-y-0.5 transition duration-200"
            >
                Save & Continue
            </button>
          </div>
        </div>
      </div>


      {/* =====================================================================================
          PRINT VIEW (Hidden on Screen, Visible on Print)
          Uses exact specific styling from the Craft Daddy reference image
         ===================================================================================== */}
      <div id="print-view" className="hidden print:block bg-white text-black p-0 m-0 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-1">
                  <h1 className="text-4xl font-medium text-[#5c2c90] mb-4">
                      {isQuotation ? 'Quotation' : 'Tax Invoice'}
                  </h1>
                  <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                      <span className="text-gray-500 font-medium">{isQuotation ? 'Quotation No #' : 'Invoice No #'}</span>
                      <span className="font-bold text-gray-900">{document.number}</span>
                      
                      <span className="text-gray-500 font-medium">{isQuotation ? 'Date' : 'Invoice Date'}</span>
                      <span className="font-bold text-gray-900">{new Date(document.date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                      
                      {document.dueDate && (
                        <>
                            <span className="text-gray-500 font-medium">{isQuotation ? 'Valid Till' : 'Due Date'}</span>
                            <span className="font-bold text-gray-900">{new Date(document.dueDate).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                        </>
                      )}

                      {document.customFields?.map((field: CustomField, i: number) => (
                          <React.Fragment key={i}>
                              <span className="text-gray-500 font-medium">{field.label}</span>
                              <span className="font-bold text-gray-900">{field.value}</span>
                          </React.Fragment>
                      ))}
                  </div>
              </div>
              <div className="w-64 flex justify-end">
                  <img src={userProfile.logoUrl || CRAFT_DADDY_LOGO_SVG} className="max-w-full object-contain" alt="Logo" />
              </div>
          </div>

          {/* Billing Boxes */}
          <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Billed By */}
              <div className="bg-[#f8f5ff] p-3 rounded-sm">
                  <h3 className="text-[#5c2c90] font-bold text-lg mb-2">{isQuotation ? 'Quotation From' : 'Billed By'}</h3>
                  <div className="text-sm space-y-1 text-gray-800">
                      <p className="font-bold">{userProfile.companyName}</p>
                      <p className="whitespace-pre-line">{userProfile.address.street},</p>
                      <p>{userProfile.address.city},</p>
                      <p>{userProfile.address.state}, {userProfile.address.country} - {userProfile.address.pincode}</p>
                      <p className="mt-2"><span className="font-bold">GSTIN:</span> <span className="text-[#5c2c90]">{userProfile.gstin}</span></p>
                      <p><span className="font-bold">PAN:</span> {userProfile.pan}</p>
                  </div>
              </div>
              
              {/* Billed To */}
              <div className="bg-[#f8f5ff] p-3 rounded-sm">
                  <h3 className="text-[#5c2c90] font-bold text-lg mb-2">{isQuotation ? 'Quotation For' : 'Billed To'}</h3>
                  <div className="text-sm space-y-1 text-gray-800">
                      <p className="font-bold uppercase">{selectedClient?.name}</p>
                      <p className="uppercase">{selectedClient?.address.street},</p>
                      <p className="uppercase">{selectedClient?.address.city}, {selectedClient?.address.state},</p>
                      <p className="uppercase">{selectedClient?.address.country} - {selectedClient?.address.pincode}</p>
                      <p className="mt-2"><span className="font-bold">GSTIN:</span> <span className="text-[#5c2c90]">{selectedClient?.gstin || 'N/A'}</span></p>
                      <p><span className="font-bold">PAN:</span> {selectedClient?.pan || 'N/A'}</p>
                  </div>
              </div>
          </div>

          {/* Supply Place */}
          <div className="flex justify-between items-center px-2 mb-4 text-sm">
             <div>Country of Supply: <span className="font-bold text-gray-900">India</span></div>
             <div>Place of Supply: <span className="font-bold text-[#5c2c90]">{document.placeOfSupply}</span></div>
          </div>

          {/* Table */}
          <table className="w-full mb-4 border-collapse table-fixed">
              <thead className="bg-[#5c2c90] text-white">
                  <tr>
                      <th className="py-2 px-2 text-left text-xs font-bold uppercase tracking-wider w-[25%]">Item</th>
                      <th className="py-2 px-1 text-center text-xs font-bold uppercase tracking-wider w-[10%]">HSN/SAC</th>
                      <th className="py-2 px-1 text-center text-xs font-bold uppercase tracking-wider w-[5%]">GST</th>
                      <th className="py-2 px-1 text-center text-xs font-bold uppercase tracking-wider w-[5%]">Qty</th>
                      <th className="py-2 px-1 text-right text-xs font-bold uppercase tracking-wider w-[10%]">Rate</th>
                      <th className="py-2 px-1 text-right text-xs font-bold uppercase tracking-wider w-[15%]">Taxable</th>
                      {isInterState ? (
                          <th className="py-2 px-1 text-right text-xs font-bold uppercase tracking-wider w-[15%]">IGST</th>
                      ) : (
                          <>
                            <th className="py-2 px-1 text-right text-xs font-bold uppercase tracking-wider w-[10%]">CGST</th>
                            <th className="py-2 px-1 text-right text-xs font-bold uppercase tracking-wider w-[10%]">SGST</th>
                          </>
                      )}
                      <th className="py-2 px-2 text-right text-xs font-bold uppercase tracking-wider w-[15%]">Total</th>
                  </tr>
              </thead>
              <tbody className="text-xs">
                  {document.items.map((item: LineItem, idx: number) => {
                      const calc = calculateLineItem(item, !!isInterState);
                      return (
                          <tr key={item.id} className="border-b border-gray-100 break-inside-avoid page-break-inside-avoid">
                              <td className="py-2 px-2">
                                  <div className="font-bold text-gray-800">{item.description}</div>
                              </td>
                              <td className="py-2 px-1 text-center text-gray-600">{item.hsn}</td>
                              <td className="py-2 px-1 text-center">{item.taxRate}%</td>
                              <td className="py-2 px-1 text-center font-medium">{item.qty}</td>
                              <td className="py-2 px-1 text-right">₹{item.rate}</td>
                              <td className="py-2 px-1 text-right font-medium">₹{calc.taxableValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                              {isInterState ? (
                                  <td className="py-2 px-1 text-right text-gray-600">₹{calc.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                              ) : (
                                  <>
                                    <td className="py-2 px-1 text-right text-gray-600">₹{calc.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                    <td className="py-2 px-1 text-right text-gray-600">₹{calc.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                  </>
                              )}
                              <td className="py-2 px-2 text-right font-bold text-gray-900">₹{calc.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>

          {/* Total in Words - Full Width Strip */}
          <div className="mb-4 border-b border-t border-gray-100 py-2 bg-gray-50/30 break-inside-avoid">
             <p className="text-sm text-gray-700">Total in words: <span className="font-bold text-gray-900 capitalize italic">{numberToWords(Math.round(totals.finalTotal))}</span></p>
          </div>

          {/* Lower Section Grid - Optimized Layout */}
          <div className="grid grid-cols-2 gap-8 mb-4 items-start break-inside-avoid">
              {/* Left Column: Bank Details & Terms */}
              <div className="space-y-4">
                  {/* Bank Details */}
                  {document.showBankDetails && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                        <h3 className="text-[#5c2c90] font-bold text-sm mb-3 border-b border-gray-200 pb-2">BANK DETAILS</h3>
                        <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                            <span className="text-gray-500">Account Name</span>
                            <span className="font-bold text-gray-900">{document.bankDetails?.accountName}</span>

                            <span className="text-gray-500">Account No.</span>
                            <span className="font-bold text-gray-900">{document.bankDetails?.accountNumber}</span>

                            <span className="text-gray-500">IFSC Code</span>
                            <span className="font-bold text-gray-900">{document.bankDetails?.ifscCode}</span>

                            <span className="text-gray-500">Bank Name</span>
                            <span className="font-bold text-gray-900">{document.bankDetails?.bankName}</span>
                            
                            <span className="text-gray-500">Branch</span>
                            <span className="font-bold text-gray-900">{document.bankDetails?.branchName || '-'}</span>
                        </div>
                    </div>
                  )}

                  {/* Terms */}
                  <div>
                      <h4 className="font-bold text-gray-800 text-sm mb-2 uppercase">Terms and Conditions</h4>
                      <div className="text-xs text-gray-500 space-y-1 leading-relaxed">
                         {document.terms?.split('\n').map((term: string, i: number) => (
                            <p key={i} className="flex gap-2">
                                <span className="text-gray-400">{i+1}.</span>
                                <span>{term.replace(/^\d+\.\s*/, '')}</span>
                            </p>
                         ))}
                      </div>
                  </div>
              </div>

              {/* Right Column: Calculations */}
              <div className="flex flex-col">
                   <div className="space-y-2 text-sm border-b border-gray-200 pb-2">
                      <div className="flex justify-between text-gray-600">
                          <span>Taxable Amount</span>
                          <span className="font-medium">₹{totals.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                          <span>CGST</span>
                          <span className="font-medium">₹{totals.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                          <span>SGST</span>
                          <span className="font-medium">₹{totals.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                      
                      {/* Optional IGST */}
                      {totals.igst > 0 && (
                          <div className="flex justify-between text-gray-600">
                              <span>IGST</span>
                              <span className="font-medium">₹{totals.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                          </div>
                      )}

                      {totals.additionalChargesTotal > 0 && (
                          <div className="flex justify-between text-gray-600">
                              <span>Addl. Charges</span>
                              <span className="font-medium">₹{totals.additionalChargesTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                          </div>
                      )}
                      
                      {totals.discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                              <span>Discount</span>
                              <span className="font-medium">- ₹{totals.discountAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                          </div>
                      )}
                      
                      {document.roundOff !== 0 && (
                          <div className="flex justify-between text-gray-400 italic">
                              <span>Round Off</span>
                              <span>{document.roundOff > 0 ? '+' : ''} ₹{document.roundOff?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                          </div>
                      )}
                   </div>

                   <div className="flex justify-between items-center py-2 bg-[#f8f5ff] -mx-4 px-4 mt-2 rounded">
                       <span className="text-[#5c2c90] font-bold text-lg">Total Amount</span>
                       <span className="text-[#5c2c90] font-bold text-xl">₹{totals.finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                   </div>
                   
                   <div className="mt-8 text-right">
                       <p className="font-bold text-gray-900 mb-6">{userProfile.companyName}</p>
                       <p className="text-xs text-gray-400 font-medium uppercase tracking-wider border-t border-gray-200 inline-block pt-2 px-8">Authorized Signatory</p>
                   </div>
              </div>
          </div>

          {/* Footer Branding */}
          <div className="mt-auto pt-4 pb-2 text-center break-inside-avoid">
             <p className="text-xs text-gray-500 mb-2">This is an electronically generated document, no signature is required.</p>
             <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                Powered by <span className="font-bold text-[#5c2c90]">BOS-Cloud</span>
             </div>
          </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
            /* Removes browser default headers and footers */
            @page { margin: 0; size: A4; }
            
            html, body {
                height: auto !important;
                min-height: 100% !important;
                overflow: visible !important;
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            /* Hide app shell */
            nav, aside, header, .no-print, .print\\:hidden {
                display: none !important;
            }

            /* Reset layout containers to allow flow */
            #root, .h-screen, .min-h-screen, .flex-1, .relative, .pb-32 {
                display: block !important;
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                position: static !important;
                padding-bottom: 0 !important;
            }

            /* Print View Display - Add padding to simulate margins */
            #print-view {
                display: block !important;
                width: 100% !important;
                height: auto !important;
                position: static !important;
                margin: 0 !important;
                padding: 20mm !important; /* Visual margin inside the page */
                box-sizing: border-box !important;
            }
            
            /* Pagination control */
            table { width: 100% !important; }
            thead { display: table-header-group !important; }
            tbody { display: table-row-group !important; }
            tr { break-inside: avoid !important; page-break-inside: avoid !important; }
            
            .break-inside-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            
            /* Text adjustments */
            body {
                font-size: 12px;
                color: black;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
      `}} />
    </div>
  );
};

export default InvoiceForm;