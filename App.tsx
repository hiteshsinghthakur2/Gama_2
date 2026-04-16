
import React, { useState, useEffect } from 'react';
import { 
  Invoice, 
  InvoiceStatus, 
  Quotation,
  QuotationStatus,
  DeliveryChallan,
  DeliveryChallanStatus,
  Lead, 
  LeadStatus, 
  Client, 
  UserBusinessProfile,
  AppUser
} from './types';
import { INITIAL_USER_PROFILE } from './constants';
import { StorageService } from './services/StorageService';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import QuotationList from './components/QuotationList';
import DeliveryChallanList from './components/DeliveryChallanList';
import LeadBoard from './components/LeadBoard';
import ClientList from './components/ClientList';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import UserProfile from './components/UserProfile';
import ExportInvoicesModal from './components/ExportInvoicesModal';
import { parseInvoiceFromImage } from './services/geminiService';
import Tools from './components/Tools';

const STORAGE_KEYS = {
  INVOICES: 'bos_cloud_invoices',
  QUOTATIONS: 'bos_cloud_quotations',
  DELIVERY_CHALLANS: 'bos_cloud_delivery_challans',
  LEADS: 'bos_cloud_leads',
  CLIENTS: 'bos_cloud_clients',
  PROFILE: 'bos_cloud_user_profile',
  USERS: 'bos_cloud_users'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'quotations' | 'delivery-challans' | 'leads' | 'clients' | 'tools' | 'settings' | 'users' | 'my-profile'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncState, setSyncState] = useState(StorageService.getSyncInfo());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // --- States ---
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('bos_cloud_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState<AppUser[]>([]);
  const [userProfile, setUserProfile] = useState<UserBusinessProfile>(INITIAL_USER_PROFILE);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [editingDeliveryChallan, setEditingDeliveryChallan] = useState<DeliveryChallan | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // --- Sync Listener ---
  useEffect(() => {
    const handleSyncChange = () => setSyncState(StorageService.getSyncInfo());
    window.addEventListener('sync-status-change', handleSyncChange);
    return () => window.removeEventListener('sync-status-change', handleSyncChange);
  }, []);

  // --- Async Hydration ---
  useEffect(() => {
    const hydrate = async () => {
      setIsLoading(true);
      const [p, i, q, dc, l, c, u] = await Promise.all([
        StorageService.load(STORAGE_KEYS.PROFILE, INITIAL_USER_PROFILE),
        StorageService.load(STORAGE_KEYS.INVOICES, []),
        StorageService.load(STORAGE_KEYS.QUOTATIONS, []),
        StorageService.load(STORAGE_KEYS.DELIVERY_CHALLANS, []),
        StorageService.load(STORAGE_KEYS.LEADS, []),
        StorageService.load(STORAGE_KEYS.CLIENTS, []),
        StorageService.load(STORAGE_KEYS.USERS, [])
      ]);
      
      setUserProfile(p);
      setInvoices(i);
      setQuotations(q);
      setDeliveryChallans(dc);
      setLeads(l.length ? l : [
        { id: 'lead-1', name: 'John Doe', company: 'Nexus Inc', value: 50000, status: LeadStatus.NEW, createdAt: '2024-05-15' },
        { id: 'lead-2', name: 'Jane Smith', company: 'Global SCM', value: 120000, status: LeadStatus.PROPOSAL, createdAt: '2024-05-14' },
      ]);
      setClients(c.length ? c : [
        { 
          id: 'client-1', 
          name: 'Nexus Inc', 
          email: 'billing@nexus.com', 
          gstin: '27AADCN1234F1Z1',
          address: { street: '123 Tech Park', city: 'Mumbai', state: 'Maharashtra', stateCode: '27', pincode: '400001', country: 'India' }
        }
      ]);
      
      const defaultUsers: AppUser[] = [
        { id: 'admin-1', username: 'admin', password: 'password', role: 'admin' }
      ];
      setUsers(u.length ? u : defaultUsers);
      
      setIsLoading(false);
    };
    
    if (currentUser) {
      hydrate();
    } else {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  // --- Auth Listener ---
  useEffect(() => {
    // Local auth doesn't need a listener.
    // If we want to check local storage, we already do it in the initial state.
  }, []);

  // --- Persistence Effects ---
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bos_cloud_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('bos_cloud_current_user');
    }
  }, [currentUser]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.USERS, users); }, [users, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.INVOICES, invoices); }, [invoices, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.QUOTATIONS, quotations); }, [quotations, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.DELIVERY_CHALLANS, deliveryChallans); }, [deliveryChallans, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.LEADS, leads); }, [leads, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.CLIENTS, clients); }, [clients, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.PROFILE, userProfile); }, [userProfile, isLoading]);

  // --- Handlers ---
  const handleSaveInvoice = (invoice: Invoice) => {
    setInvoices(prev => {
      const exists = prev.find(inv => inv.id === invoice.id);
      if (!exists && userProfile.invoiceSequence) {
        setUserProfile(p => ({
          ...p,
          invoiceSequence: {
            ...p.invoiceSequence!,
            nextNumber: p.invoiceSequence!.nextNumber + 1
          }
        }));
      }
      return exists ? prev.map(inv => inv.id === invoice.id ? invoice : inv) : [invoice, ...prev];
    });
    setEditingInvoice(null);
  };

  const handleUpdateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Delete this invoice?')) setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const handleSaveQuotation = (quotation: Quotation) => {
    setQuotations(prev => {
      const exists = prev.find(q => q.id === quotation.id);
      if (!exists && userProfile.quotationSequence) {
        setUserProfile(p => ({
          ...p,
          quotationSequence: {
            ...p.quotationSequence!,
            nextNumber: p.quotationSequence!.nextNumber + 1
          }
        }));
      }
      return exists ? prev.map(q => q.id === quotation.id ? quotation : q) : [quotation, ...prev];
    });
    setEditingQuotation(null);
  };

  const handleSaveDeliveryChallan = (challan: DeliveryChallan) => {
    setDeliveryChallans(prev => {
      const exists = prev.find(dc => dc.id === challan.id);
      if (!exists && userProfile.challanSequence) {
        setUserProfile(p => ({
          ...p,
          challanSequence: {
            ...p.challanSequence!,
            nextNumber: p.challanSequence!.nextNumber + 1
          }
        }));
      }
      return exists ? prev.map(dc => dc.id === challan.id ? challan : dc) : [challan, ...prev];
    });
    setEditingDeliveryChallan(null);
  };

  const handleSaveClient = (client: Client) => {
    setClients(prev => {
      const exists = prev.find(c => c.id === client.id);
      return exists ? prev.map(c => c.id === client.id ? client : c) : [client, ...prev];
    });
  };

  const handleConvertToInvoice = (quotation: Quotation) => {
    let newNumber = `CD${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
    if (userProfile.invoiceSequence) {
      const seq = userProfile.invoiceSequence;
      const paddedNumber = seq.nextNumber.toString().padStart(seq.padding || 0, '0');
      newNumber = `${seq.prefix || ''}${seq.suffix || ''}${paddedNumber}`;
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: newNumber,
      date: new Date().toISOString().split('T')[0],
      dueDate: quotation.validUntil || '',
      poNumber: '',
      status: InvoiceStatus.DRAFT,
      clientId: quotation.clientId,
      items: quotation.items.map(item => ({...item})),
      notes: quotation.notes,
      terms: quotation.terms || userProfile.defaultInvoiceTerms || '1. Subject to local jurisdiction.\n2. Payment within due date.',
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
  };

  const handleConvertToDeliveryChallan = (invoice: Invoice) => {
    let newNumber = `DC${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
    if (userProfile.challanSequence) {
      const seq = userProfile.challanSequence;
      const paddedNumber = seq.nextNumber.toString().padStart(seq.padding || 0, '0');
      newNumber = `${seq.prefix || ''}${seq.suffix || ''}${paddedNumber}`;
    }

    const newChallan: DeliveryChallan = {
      id: `dc-${Date.now()}`,
      number: newNumber,
      date: new Date().toISOString().split('T')[0],
      status: DeliveryChallanStatus.DRAFT,
      clientId: invoice.clientId,
      items: invoice.items.map(item => ({...item})),
      placeOfSupply: invoice.placeOfSupply,
      terms: invoice.terms || userProfile.defaultChallanTerms || '1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.'
    };

    setActiveTab('delivery-challans');
    setEditingDeliveryChallan(newChallan);
    setEditingInvoice(null);
  };

  const handleUploadBill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingBill(true);
    setUploadProgress({ current: 0, total: files.length });
    
    let newInvoices: Invoice[] = [];
    let updatedClients = [...clients];
    let clientsChanged = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });
      
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const parsedData = await parseInvoiceFromImage(base64Data, file.type);
        
        if (parsedData) {
          // Try to match client by name or GSTIN
          let matchedClient = updatedClients.find(c => 
            (parsedData.clientName && c.name.toLowerCase() === parsedData.clientName.toLowerCase()) ||
            (parsedData.clientGstin && c.gstin === parsedData.clientGstin)
          );

          let clientId = matchedClient?.id;

          if (!clientId && parsedData.clientName) {
            // Create a new client from the extracted data
            const newClient: Client = {
              id: `client-${Date.now()}-${i}`,
              name: parsedData.clientName,
              email: parsedData.clientEmail || '',
              phone: parsedData.clientPhone || '',
              address: parsedData.clientAddress || '',
              gstin: parsedData.clientGstin || '',
              pan: parsedData.clientPan || '',
              state: parsedData.placeOfSupply || '',
              stateCode: ''
            };
            updatedClients.push(newClient);
            clientId = newClient.id;
            clientsChanged = true;
          } else if (!clientId) {
            clientId = updatedClients[0]?.id || '';
          }

          const newInvoice: Invoice = {
            id: `inv-${Date.now()}-${i}`,
            number: parsedData.number || `CD${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
            date: parsedData.date || new Date().toISOString().split('T')[0],
            dueDate: parsedData.dueDate || '',
            status: InvoiceStatus.DRAFT,
            clientId: clientId,
            items: parsedData.items && parsedData.items.length > 0 ? parsedData.items.map((item: any, index: number) => ({
              id: `item-${Date.now()}-${i}-${index}`,
              description: item.description || '',
              hsn: item.hsn || '',
              qty: item.qty || 1,
              rate: item.rate || 0,
              taxRate: item.taxRate || 18
            })) : [{ id: '1', description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }],
            placeOfSupply: parsedData.placeOfSupply || `${userProfile.address.state} (${userProfile.address.stateCode})`,
            bankDetails: userProfile.bankAccounts[0],
            terms: userProfile.defaultInvoiceTerms || '1. Subject to local jurisdiction.\n2. Payment within due date.'
          };
          newInvoices.push(newInvoice);
        } else {
          console.warn(`Could not extract details from file: ${file.name}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    if (newInvoices.length > 0) {
      if (files.length === 1) {
        // If only one file, open it in the editor for review
        setEditingInvoice(newInvoices[0]);
        if (clientsChanged) {
          setClients(updatedClients);
          StorageService.save(STORAGE_KEYS.CLIENTS, updatedClients);
        }
      } else {
        // If multiple files, save them directly to the list
        const finalInvoices = [...newInvoices, ...invoices];
        setInvoices(finalInvoices);
        StorageService.save(STORAGE_KEYS.INVOICES, finalInvoices);
        
        if (clientsChanged) {
          setClients(updatedClients);
          StorageService.save(STORAGE_KEYS.CLIENTS, updatedClients);
        }
        alert(`Successfully processed and saved ${newInvoices.length} out of ${files.length} invoices!`);
      }
    } else {
      alert("Could not extract invoice details from the uploaded files.");
    }

    setIsUploadingBill(false);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Hydrating Cloud Data...</p>
      </div>
    );

    switch (activeTab) {
      case 'dashboard': return <Dashboard invoices={invoices} leads={leads} />;
      case 'invoices':
        if (editingInvoice) return <InvoiceForm mode="invoice" userProfile={userProfile} clients={clients} onSave={handleSaveInvoice} onCancel={() => setEditingInvoice(null)} initialData={editingInvoice} existingInvoices={invoices} onEditClient={(client) => { setEditingClient(client); setActiveTab('clients'); }} />;
        return (
          <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Invoices</h1>
                <p className="text-xs md:text-sm text-gray-500">Manage billing for {userProfile.companyName}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleUploadBill} 
                  multiple
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingBill}
                  className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-xl hover:bg-gray-50 transition font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingBill ? (
                    <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  )}
                  {isUploadingBill ? (uploadProgress ? `Processing ${uploadProgress.current}/${uploadProgress.total}...` : 'Processing...') : 'Upload Bill(s)'}
                </button>
                <button 
                  onClick={() => setIsExportModalOpen(true)}
                  className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-xl hover:bg-gray-50 transition font-bold shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export
                </button>
                <button 
                  onClick={() => {
                    let newNumber = `CD${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
                    
                    // Recommendation based on last invoice
                    if (invoices.length > 0) {
                      const lastInvoice = invoices[0]; // Assuming newest is first
                      const lastNumber = lastInvoice.number;
                      const match = lastNumber.match(/^(.*?)(\d+)$/);
                      if (match) {
                        const prefix = match[1];
                        const numberStr = match[2];
                        const nextNumber = (parseInt(numberStr) + 1).toString().padStart(numberStr.length, '0');
                        newNumber = prefix + nextNumber;
                      }
                    } else if (userProfile.invoiceSequence) {
                      const seq = userProfile.invoiceSequence;
                      const paddedNumber = seq.nextNumber.toString().padStart(seq.padding || 0, '0');
                      newNumber = `${seq.prefix || ''}${seq.suffix || ''}${paddedNumber}`;
                    }

                    setEditingInvoice({ 
                      id: `inv-${Date.now()}`, 
                      number: newNumber, 
                      date: new Date().toISOString().split('T')[0], 
                      dueDate: '', 
                      status: InvoiceStatus.DRAFT, 
                      clientId: clients[0]?.id || '', 
                      items: [{ id: '1', description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }],
                      placeOfSupply: `${userProfile.address.state} (${userProfile.address.stateCode})`,
                      bankDetails: userProfile.bankAccounts[0],
                      terms: userProfile.defaultInvoiceTerms || '1. Subject to local jurisdiction.\n2. Payment within due date.'
                    });
                  }}
                  className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New Invoice
                </button>
              </div>
            </div>
            <InvoiceList invoices={invoices} clients={clients} userProfile={userProfile} onEdit={setEditingInvoice} onDuplicate={(inv) => setInvoices([{...inv, id: `inv-${Date.now()}`, number: `COPY-${inv.number}`}, ...invoices])} onUpdateStatus={handleUpdateInvoiceStatus} onDelete={handleDeleteInvoice} onConvertToDeliveryChallan={handleConvertToDeliveryChallan} />
            <ExportInvoicesModal 
              isOpen={isExportModalOpen} 
              onClose={() => setIsExportModalOpen(false)} 
              invoices={invoices} 
              clients={clients} 
              userProfile={userProfile} 
            />
          </div>
        );
      case 'quotations':
        if (editingQuotation) return <InvoiceForm mode="quotation" userProfile={userProfile} clients={clients} onSave={handleSaveQuotation} onCancel={() => setEditingQuotation(null)} initialData={editingQuotation} onConvertToInvoice={handleConvertToInvoice} onEditClient={(client) => { setEditingClient(client); setActiveTab('clients'); }} />;
        return (
          <div className="p-4 md:p-6 lg:p-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Quotations</h1>
                <p className="text-xs md:text-sm text-gray-500">Estimates for {userProfile.companyName}</p>
              </div>
              <button 
                onClick={() => {
                  let newNumber = `QT${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
                  if (userProfile.quotationSequence) {
                    const seq = userProfile.quotationSequence;
                    const paddedNumber = seq.nextNumber.toString().padStart(seq.padding || 0, '0');
                    newNumber = `${seq.prefix || ''}${seq.suffix || ''}${paddedNumber}`;
                  }
                  setEditingQuotation({ 
                    id: `qt-${Date.now()}`, 
                    number: newNumber, 
                    date: new Date().toISOString().split('T')[0], 
                    validUntil: '', 
                    status: QuotationStatus.DRAFT, 
                    clientId: clients[0]?.id || '', 
                    items: [{ id: '1', description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }],
                    placeOfSupply: `${userProfile.address.state} (${userProfile.address.stateCode})`,
                    bankDetails: userProfile.bankAccounts[0],
                    terms: userProfile.defaultQuotationTerms || 'Valid for 30 days.'
                  });
                }}
                className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Quotation
              </button>
            </div>
            <QuotationList quotations={quotations} clients={clients} userProfile={userProfile} onEdit={setEditingQuotation} onDuplicate={(qt) => setQuotations([{...qt, id: `qt-${Date.now()}`, number: `COPY-${qt.number}`}, ...quotations])} onUpdateStatus={(id, status) => setQuotations(prev => prev.map(q => q.id === id ? {...q, status} : q))} onDelete={(id) => setQuotations(prev => prev.filter(q => q.id !== id))} onConvertToInvoice={handleConvertToInvoice} />
          </div>
        );
      case 'delivery-challans':
        if (editingDeliveryChallan) return <InvoiceForm mode="delivery-challan" userProfile={userProfile} clients={clients} onSave={handleSaveDeliveryChallan} onCancel={() => setEditingDeliveryChallan(null)} initialData={editingDeliveryChallan} onEditClient={(client) => { setEditingClient(client); setActiveTab('clients'); }} />;
        return (
          <div className="p-4 md:p-6 lg:p-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Delivery Challans</h1>
                <p className="text-xs md:text-sm text-gray-500">Transport documents for {userProfile.companyName}</p>
              </div>
              <button 
                onClick={() => {
                  let newNumber = `DC${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
                  if (userProfile.challanSequence) {
                    const seq = userProfile.challanSequence;
                    const paddedNumber = seq.nextNumber.toString().padStart(seq.padding || 0, '0');
                    newNumber = `${seq.prefix || ''}${seq.suffix || ''}${paddedNumber}`;
                  }
                  setEditingDeliveryChallan({ 
                    id: `dc-${Date.now()}`, 
                    number: newNumber, 
                    date: new Date().toISOString().split('T')[0], 
                    status: DeliveryChallanStatus.DRAFT, 
                    clientId: clients[0]?.id || '', 
                    items: [{ id: '1', description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }],
                    placeOfSupply: `${userProfile.address.state} (${userProfile.address.stateCode})`,
                    terms: userProfile.defaultChallanTerms || '1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.'
                  });
                }}
                className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Challan
              </button>
            </div>
            <DeliveryChallanList challans={deliveryChallans} clients={clients} userProfile={userProfile} onEdit={setEditingDeliveryChallan} onDuplicate={(dc) => setDeliveryChallans([{...dc, id: `dc-${Date.now()}`, number: `COPY-${dc.number}`}, ...deliveryChallans])} onUpdateStatus={(id, status) => setDeliveryChallans(prev => prev.map(dc => dc.id === id ? {...dc, status} : dc))} onDelete={(id) => setDeliveryChallans(prev => prev.filter(dc => dc.id !== id))} />
          </div>
        );
      case 'leads': return <LeadBoard leads={leads} setLeads={setLeads} />;
      case 'clients': return (
        <ClientList 
          clients={clients} 
          onSave={handleSaveClient} 
          onDelete={(id) => setClients(prev => prev.filter(c => c.id !== id))} 
          activeClient={editingClient} 
          onClearActiveClient={() => {
            setEditingClient(null);
            if (editingInvoice) setActiveTab('invoices');
            else if (editingQuotation) setActiveTab('quotations');
            else if (editingDeliveryChallan) setActiveTab('delivery-challans');
          }}
          cancelLabel={editingInvoice ? "Back to Invoice" : editingQuotation ? "Back to Quotation" : editingDeliveryChallan ? "Back to Challan" : undefined}
        />
      );
      case 'tools': return <Tools invoices={invoices} clients={clients} userProfile={userProfile} />;
      case 'settings': return <Settings profile={userProfile} onSave={setUserProfile} />;
      case 'users': return (
        <UserManagement 
          users={users} 
          onSaveUser={(user) => setUsers(prev => {
            const exists = prev.find(u => u.id === user.id);
            return exists ? prev.map(u => u.id === user.id ? user : u) : [...prev, user];
          })}
          onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
          currentUser={currentUser!}
        />
      );
      case 'my-profile': return (
        <UserProfile
          currentUser={currentUser!}
          onUpdateUser={(updatedUser) => {
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
          }}
        />
      );
      default: return <Dashboard invoices={invoices} leads={leads} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login users={users} onLogin={setCurrentUser} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative print:h-auto print:overflow-visible print:block">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm no-print" onClick={() => setIsSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} no-print`}>
        <Sidebar 
          activeTab={activeTab} 
          logoUrl={userProfile.logoUrl}
          companyName={userProfile.companyName}
          onTabChange={(tab) => { setActiveTab(tab); setEditingInvoice(null); setEditingQuotation(null); setEditingDeliveryChallan(null); setIsSidebarOpen(false); }} 
          onClose={() => setIsSidebarOpen(false)}
          syncState={syncState}
          currentUser={currentUser}
          onLogout={async () => {
            // Clear all local storage keys related to the app to ensure data safety on shared devices
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('bos_cloud_')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            setCurrentUser(null);
          }}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:block">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b no-print">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
             </button>
             <h2 className="font-black text-indigo-600 tracking-tighter uppercase">{userProfile.companyName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">{currentUser.username}</span>
            <img src={userProfile.logoUrl || "https://picsum.photos/32/32"} className="w-8 h-8 rounded-full object-contain bg-gray-50" alt="Profile" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto print:block">{renderContent()}</main>
      </div>
    </div>
  );
};

export default App;
