
import React, { useState, useEffect, useMemo } from 'react';
import { Client, Address, CustomField } from '../types';
import { INDIAN_STATES } from '../constants';
import { fetchGSTDetails } from '../services/GSTService';

// We only keep the PAN extraction logic for convenience, without strict validation blocks.
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface ClientListProps {
  clients: Client[];
  onSave: (client: Client) => void;
  onDelete: (id: string) => void;
  activeClient?: Client | null;
  onClearActiveClient?: () => void;
  cancelLabel?: string;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onSave, onDelete, activeClient, onClearActiveClient, cancelLabel }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isFetchingGST, setIsFetchingGST] = useState(false);
  const [isDataSimulated, setIsDataSimulated] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);
  const [clientType, setClientType] = useState<'gst' | 'unregistered'>('gst');

  const initialClient: Client = {
    id: `client-${Date.now()}`,
    name: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    address: {
      street: '',
      city: '',
      state: 'Delhi',
      stateCode: '07',
      pincode: '',
      country: 'India'
    },
    customFields: []
  };

  const [formData, setFormData] = useState<Client>(initialClient);

  // Handle external active client (e.g. from InvoiceForm)
  useEffect(() => {
    if (activeClient) {
        setFormData(activeClient);
        setEditingClient(activeClient);
        setClientType(activeClient.gstin ? 'gst' : 'unregistered');
        setShowForm(true);
    }
  }, [activeClient]);

  // Reset simulation flag when form opens
  useEffect(() => {
    if (showForm) {
        setIsDataSimulated(false);
        setGstError(null);
    } else {
        // When form closes, clear the external active client if it exists
        if (activeClient && onClearActiveClient) {
            onClearActiveClient();
        }
    }
  }, [showForm]);

  // Handle Client Type Switch clearing
  useEffect(() => {
      if (clientType === 'unregistered') {
          // If switching to unregistered, clear the GSTIN to avoid confusion
          setFormData(prev => ({ ...prev, gstin: '' }));
          setGstError(null);
      }
  }, [clientType]);

  // Auto PAN Extraction (Convenience feature, not validation)
  useEffect(() => {
    if (clientType === 'gst' && formData.gstin && formData.gstin.length >= 12) {
      const extractedPan = formData.gstin.substring(2, 12).toUpperCase();
      if (PAN_REGEX.test(extractedPan)) {
        if (formData.pan !== extractedPan) {
          setFormData(prev => ({ ...prev, pan: extractedPan }));
        }
      }
    } else if (clientType === 'gst' && !formData.gstin) {
      // Clear PAN if GSTIN is removed and it was likely auto-filled
      if (formData.pan && !editingClient) {
         setFormData(prev => ({ ...prev, pan: '' }));
      }
    }
  }, [formData.gstin, editingClient, clientType]);

  // Auto GST Details Fetching
  useEffect(() => {
    // Only trigger if we have exactly 15 chars and type is GST
    if (clientType === 'gst' && formData.gstin && formData.gstin.length === 15) {
      if (isFetchingGST) return;

      const fetchDetails = async () => {
        setIsFetchingGST(true);
        setIsDataSimulated(false);
        setGstError(null);
        
        try {
          const details = await fetchGSTDetails(formData.gstin!);
          
          setFormData(prev => ({
            ...prev,
            name: details.legalName, // Auto-fill Company Name
            address: {
              ...prev.address,
              street: details.address.street,
              city: details.address.city,
              state: details.address.state,
              stateCode: details.address.stateCode,
              pincode: details.address.pincode
            }
          }));
          setIsDataSimulated(true);
        } catch (error: any) {
          console.warn("Could not fetch GST details:", error);
          setGstError(error.message || "Failed to fetch GST details");
        } finally {
          setIsFetchingGST(false);
        }
      };

      const timer = setTimeout(fetchDetails, 500);
      return () => clearTimeout(timer);
    } else {
        if (gstError && formData.gstin && formData.gstin.length !== 15) {
            setGstError(null);
        }
    }
  }, [formData.gstin, clientType]);

  const handleEdit = (client: Client) => {
    setFormData(client);
    setEditingClient(client);
    setClientType(client.gstin ? 'gst' : 'unregistered');
    setShowForm(true);
  };

  const handleAdd = () => {
    setFormData({ ...initialClient, id: `client-${Date.now()}` });
    setEditingClient(null);
    setClientType('gst');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowForm(false);
  };

  const updateAddress = (field: keyof Address, value: string) => {
    setFormData({
      ...formData,
      address: { ...formData.address, [field]: value }
    });
  };

  const addCustomField = () => {
    setFormData({
      ...formData,
      customFields: [...(formData.customFields || []), { label: '', value: '' }]
    });
  };

  const updateCustomField = (index: number, field: 'label' | 'value', value: string) => {
    const newFields = [...(formData.customFields || [])];
    newFields[index] = { ...newFields[index], [field]: value };
    setFormData({ ...formData, customFields: newFields });
  };

  const removeCustomField = (index: number) => {
    const newFields = [...(formData.customFields || [])];
    newFields.splice(index, 1);
    setFormData({ ...formData, customFields: newFields });
  };

  const isFormInvalid = useMemo(() => {
    const basicInvalid = !formData.name || !formData.address.street || !formData.address.city || !formData.address.pincode;
    if (basicInvalid) return true;
    if (clientType === 'gst' && (!formData.gstin || formData.gstin.length !== 15)) return true;
    return false;
  }, [formData, clientType]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">Manage your business customers and compliance</p>
        </div>
        {!showForm && (
          <button 
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New Client
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          {cancelLabel && (
            <button 
              onClick={() => setShowForm(false)}
              className="mb-4 text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition group text-sm"
            >
                <div className="bg-gray-100 p-1 rounded-full group-hover:bg-gray-200 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </div>
                {cancelLabel}
            </button>
          )}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900">{editingClient ? 'Edit Client Profile' : 'New Client Onboarding'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="bg-gray-100/50 p-1 rounded-xl mb-8 flex gap-2">
             <button 
                type="button"
                onClick={() => setClientType('gst')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${clientType === 'gst' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                GST Registered
             </button>
             <button 
                type="button"
                onClick={() => setClientType('unregistered')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${clientType === 'unregistered' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Unregistered / Individual
             </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              
              {clientType === 'gst' ? (
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    GSTIN (Auto-Fetch) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      maxLength={15}
                      placeholder="e.g. 07AAAAA0000A1Z1"
                      className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 transition border-gray-100 uppercase font-mono text-sm pr-10 ${isFetchingGST ? 'focus:ring-indigo-300' : gstError ? 'focus:ring-red-300 border-red-200' : 'focus:ring-indigo-500'}`}
                      value={formData.gstin}
                      onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    />
                    {isFetchingGST && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {gstError && !isFetchingGST && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 group relative">
                        <svg className="w-5 h-5 text-red-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    )}
                  </div>
                  {isFetchingGST && <p className="text-[10px] text-indigo-600 font-bold mt-1 animate-pulse">Fetching details from GST Portal...</p>}
                  {isDataSimulated && !gstError && <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Details autofilled from GSTIN
                  </p>}
                  {gstError && <p className="text-[10px] text-red-500 font-bold mt-1">{gstError}</p>}
                </div>
              ) : (
                <div className="col-span-2 md:col-span-1 flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-sm text-gray-500 italic flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        GSTIN not required for consumer
                    </div>
                </div>
              )}

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  PAN {clientType === 'gst' ? '(Auto-filled)' : '(Optional)'}
                </label>
                <input 
                  type="text" 
                  readOnly={clientType === 'gst'}
                  className={`w-full p-3 border rounded-xl outline-none font-mono text-sm uppercase transition ${clientType === 'gst' ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-100' : 'bg-gray-50 text-gray-900 border-gray-100 focus:ring-2 focus:ring-indigo-500'}`}
                  value={formData.pan}
                  onChange={clientType === 'unregistered' ? (e) => setFormData({...formData, pan: e.target.value.toUpperCase()}) : undefined}
                  placeholder={clientType === 'gst' ? "Derived from GSTIN" : "ABCDE1234F"}
                  maxLength={10}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    {clientType === 'gst' ? 'Company / Registered Name' : 'Client / Full Name'} <span className="text-red-500">*</span>
                </label>
                <input 
                  required
                  type="text" 
                  className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 ${isFetchingGST ? 'opacity-50' : ''}`}
                  placeholder={clientType === 'gst' ? "e.g. Acme Corporation Pvt Ltd" : "e.g. John Doe"}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                  placeholder="billing@client.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                  placeholder="+91 98765 43210"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="col-span-2 border-t border-gray-100 pt-6">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  {clientType === 'gst' ? 'Registered Office Address' : 'Billing Address'}
                  {isFetchingGST && <span className="text-[9px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">Updating...</span>}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Street Address <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                      value={formData.address.street}
                      onChange={e => updateAddress('street', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">City <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                      value={formData.address.city}
                      onChange={e => updateAddress('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">State</label>
                    <select 
                      className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                      value={formData.address.stateCode}
                      onChange={e => {
                        const state = INDIAN_STATES.find(s => s.code === e.target.value);
                        if (state) {
                          setFormData({
                            ...formData,
                            address: { ...formData.address, state: state.name, stateCode: state.code }
                          });
                        }
                      }}
                    >
                      {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pincode <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      maxLength={6}
                      className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 font-mono"
                      value={formData.address.pincode}
                      onChange={e => updateAddress('pincode', e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Country</label>
                    <input 
                      readOnly
                      type="text" 
                      className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 outline-none cursor-not-allowed border-gray-100"
                      value={formData.address.country}
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2 border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Custom Fields</h3>
                  <button 
                    type="button"
                    onClick={addCustomField}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Field
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(formData.customFields || []).map((field, index) => (
                    <div key={index} className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="Label (e.g. Tax ID)"
                        className="flex-1 p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 text-sm"
                        value={field.label}
                        onChange={e => updateCustomField(index, 'label', e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Value"
                        className="flex-1 p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 text-sm"
                        value={field.value}
                        onChange={e => updateCustomField(index, 'value', e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  {(!formData.customFields || formData.customFields.length === 0) && (
                    <p className="text-sm text-gray-400 italic text-center py-2">No custom fields added</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="flex-1 py-4 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition"
              >
                {cancelLabel || 'Cancel'}
              </button>
              <button 
                type="submit" 
                disabled={isFormInvalid || isFetchingGST}
                className={`flex-1 py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 ${
                  isFormInvalid || isFetchingGST
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {editingClient ? 'Update Client' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Point</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Compliance (GSTIN/PAN)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50/50 transition group">
                  <td className="px-6 py-5">
                    <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{client.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{client.address.city}, {client.address.state}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-gray-600 font-medium">{client.email || <span className="text-gray-300 italic">No email provided</span>}</p>
                    {client.phone && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {client.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter w-8">GSTIN</span>
                        <span className={`text-xs font-mono font-bold ${client.gstin ? 'text-indigo-700' : 'text-gray-300'}`}>{client.gstin || 'Unregistered'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter w-8">PAN</span>
                        <span className="text-xs font-mono font-medium text-gray-500">{client.pan || '---'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(client)} 
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Client"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button 
                        onClick={() => onDelete(client.id)} 
                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                        title="Delete Client"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      <p className="font-black text-xs uppercase tracking-widest text-gray-500">No customers in your directory</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientList;
