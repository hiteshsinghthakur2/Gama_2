
import React, { useState, useEffect } from 'react';
import { 
  Invoice, 
  InvoiceStatus, 
  Quotation,
  QuotationStatus,
  Lead, 
  LeadStatus, 
  Client, 
  UserBusinessProfile,
} from './types';
import { INITIAL_USER_PROFILE } from './constants';
import { StorageService } from './services/StorageService';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import QuotationList from './components/QuotationList';
import LeadBoard from './components/LeadBoard';
import ClientList from './components/ClientList';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';

const STORAGE_KEYS = {
  INVOICES: 'bos_cloud_invoices',
  QUOTATIONS: 'bos_cloud_quotations',
  LEADS: 'bos_cloud_leads',
  CLIENTS: 'bos_cloud_clients',
  PROFILE: 'bos_cloud_user_profile'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'quotations' | 'leads' | 'clients' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncState, setSyncState] = useState(StorageService.getSyncInfo());
  
  // --- States ---
  const [userProfile, setUserProfile] = useState<UserBusinessProfile>(INITIAL_USER_PROFILE);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

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
      const [p, i, q, l, c] = await Promise.all([
        StorageService.load(STORAGE_KEYS.PROFILE, INITIAL_USER_PROFILE),
        StorageService.load(STORAGE_KEYS.INVOICES, []),
        StorageService.load(STORAGE_KEYS.QUOTATIONS, []),
        StorageService.load(STORAGE_KEYS.LEADS, []),
        StorageService.load(STORAGE_KEYS.CLIENTS, [])
      ]);
      
      setUserProfile(p);
      setInvoices(i);
      setQuotations(q);
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
      setIsLoading(false);
    };
    hydrate();
  }, []);

  // --- Persistence Effects ---
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.INVOICES, invoices); }, [invoices, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.QUOTATIONS, quotations); }, [quotations, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.LEADS, leads); }, [leads, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.CLIENTS, clients); }, [clients, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.PROFILE, userProfile); }, [userProfile, isLoading]);

  // --- Handlers ---
  const handleSaveInvoice = (invoice: Invoice) => {
    setInvoices(prev => {
      const exists = prev.find(inv => inv.id === invoice.id);
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
      return exists ? prev.map(q => q.id === quotation.id ? quotation : q) : [quotation, ...prev];
    });
    setEditingQuotation(null);
  };

  const handleSaveClient = (client: Client) => {
    setClients(prev => {
      const exists = prev.find(c => c.id === client.id);
      return exists ? prev.map(c => c.id === client.id ? client : c) : [client, ...prev];
    });
  };

  const handleConvertToInvoice = (quotation: Quotation) => {
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: `CD${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: quotation.validUntil || '',
      poNumber: '',
      status: InvoiceStatus.DRAFT,
      clientId: quotation.clientId,
      items: quotation.items.map(item => ({...item})),
      notes: quotation.notes,
      terms: quotation.terms || '1. Subject to local jurisdiction.\n2. Payment within due date.',
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
        if (editingInvoice) return <InvoiceForm mode="invoice" userProfile={userProfile} clients={clients} onSave={handleSaveInvoice} onCancel={() => setEditingInvoice(null)} initialData={editingInvoice} />;
        return (
          <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Invoices</h1>
                <p className="text-xs md:text-sm text-gray-500">Manage billing for {userProfile.companyName}</p>
              </div>
              <button 
                onClick={() => setEditingInvoice({ 
                  id: `inv-${Date.now()}`, 
                  number: `CD${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`, 
                  date: new Date().toISOString().split('T')[0], 
                  dueDate: '', 
                  status: InvoiceStatus.DRAFT, 
                  clientId: clients[0]?.id || '', 
                  items: [{ id: '1', description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }],
                  placeOfSupply: `${userProfile.address.state} (${userProfile.address.stateCode})`,
                  bankDetails: userProfile.bankAccounts[0],
                  terms: '1. Subject to local jurisdiction.\n2. Payment within due date.'
                })}
                className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Invoice
              </button>
            </div>
            <InvoiceList invoices={invoices} clients={clients} userProfile={userProfile} onEdit={setEditingInvoice} onDuplicate={(inv) => setInvoices([{...inv, id: `inv-${Date.now()}`, number: `COPY-${inv.number}`}, ...invoices])} onUpdateStatus={handleUpdateInvoiceStatus} onDelete={handleDeleteInvoice} />
          </div>
        );
      case 'quotations':
        if (editingQuotation) return <InvoiceForm mode="quotation" userProfile={userProfile} clients={clients} onSave={handleSaveQuotation} onCancel={() => setEditingQuotation(null)} initialData={editingQuotation} onConvertToInvoice={handleConvertToInvoice} />;
        return (
          <div className="p-4 md:p-6 lg:p-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Quotations</h1>
                <p className="text-xs md:text-sm text-gray-500">Estimates for {userProfile.companyName}</p>
              </div>
              <button 
                onClick={() => setEditingQuotation({ 
                  id: `qt-${Date.now()}`, 
                  number: `QT${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`, 
                  date: new Date().toISOString().split('T')[0], 
                  validUntil: '', 
                  status: QuotationStatus.DRAFT, 
                  clientId: clients[0]?.id || '', 
                  items: [{ id: '1', description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }],
                  placeOfSupply: `${userProfile.address.state} (${userProfile.address.stateCode})`,
                  bankDetails: userProfile.bankAccounts[0],
                  terms: 'Valid for 30 days.'
                })}
                className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Quotation
              </button>
            </div>
            <QuotationList quotations={quotations} clients={clients} userProfile={userProfile} onEdit={setEditingQuotation} onDuplicate={(qt) => setQuotations([{...qt, id: `qt-${Date.now()}`, number: `COPY-${qt.number}`}, ...quotations])} onUpdateStatus={(id, status) => setQuotations(prev => prev.map(q => q.id === id ? {...q, status} : q))} onDelete={(id) => setQuotations(prev => prev.filter(q => q.id !== id))} onConvertToInvoice={handleConvertToInvoice} />
          </div>
        );
      case 'leads': return <LeadBoard leads={leads} setLeads={setLeads} />;
      case 'clients': return <ClientList clients={clients} onSave={handleSaveClient} onDelete={(id) => setClients(prev => prev.filter(c => c.id !== id))} />;
      case 'settings': return <Settings profile={userProfile} onSave={setUserProfile} />;
      default: return <Dashboard invoices={invoices} leads={leads} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative print:h-auto print:overflow-visible print:block">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm no-print" onClick={() => setIsSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} no-print`}>
        <Sidebar 
          activeTab={activeTab} 
          logoUrl={userProfile.logoUrl}
          companyName={userProfile.companyName}
          onTabChange={(tab) => { setActiveTab(tab); setEditingInvoice(null); setEditingQuotation(null); setIsSidebarOpen(false); }} 
          onClose={() => setIsSidebarOpen(false)}
          syncState={syncState}
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
          <img src={userProfile.logoUrl || "https://picsum.photos/32/32"} className="w-8 h-8 rounded-full object-contain bg-gray-50" alt="Profile" />
        </header>
        <main className="flex-1 overflow-y-auto print:block">{renderContent()}</main>
      </div>
    </div>
  );
};

export default App;
