
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
import { parseInvoiceFromImage, parseBankStatementFromImage } from './services/geminiService';
import { calculateDocumentTotal } from './services/Calculations';
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

  const [uploadConflicts, setUploadConflicts] = useState<{
    conflicting: { parsed: Invoice; existing: Invoice }[];
    strictlyNew: Invoice[];
    updatedClients: Client[];
    totalFiles: number;
    clientsChanged: boolean;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- Bank Statement Reconciliation State ---
  const statementInputRef = React.useRef<HTMLInputElement>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<{
    transactions: { id: string; date: string; description: string; amount: number; matchedInvoiceId: string | null }[];
  } | null>(null);
  
  // --- States ---
  const [currentUser, setCurrentUser] = useState<AppUser>({ id: 'admin-1', username: 'admin', password: '', role: 'admin' });
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
      // Migrate existing documents to have clientDetails permanently
      const migrateDocs = (docs: any[], clientsList: Client[]) => docs.map((d: any) => d.clientDetails ? d : { ...d, clientDetails: clientsList.find(c => c.id === d.clientId) || null });
      
      setInvoices(migrateDocs(i, c) as Invoice[]);
      setQuotations(migrateDocs(q, c) as Quotation[]);
      setDeliveryChallans(migrateDocs(dc, c) as DeliveryChallan[]);
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
    }
  }, []); // Run once on mount

  // --- Auth Listener ---
  useEffect(() => {
    // Local auth doesn't need a listener.
    // If we want to check local storage, we already do it in the initial state.
  }, []);

  // --- Persistence Effects ---
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.USERS, users); }, [users, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.INVOICES, invoices); }, [invoices, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.QUOTATIONS, quotations); }, [quotations, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.DELIVERY_CHALLANS, deliveryChallans); }, [deliveryChallans, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.LEADS, leads); }, [leads, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.CLIENTS, clients); }, [clients, isLoading]);
  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.PROFILE, userProfile); }, [userProfile, isLoading]);

  // --- Handlers ---
  const handleSaveInvoice = (invoice: Invoice) => {
    // Enrich with client snapshot to ensure history is preserved even if client is deleted
    const clientSnapshot = clients.find(c => c.id === invoice.clientId) || invoice.clientDetails;
    const invoiceToSave = { ...invoice, clientDetails: clientSnapshot };

    setInvoices(prev => {
      const exists = prev.find(inv => inv.id === invoiceToSave.id);
      if (!exists && userProfile.invoiceSequence) {
        setUserProfile(p => ({
          ...p,
          invoiceSequence: {
            ...p.invoiceSequence!,
            nextNumber: p.invoiceSequence!.nextNumber + 1
          }
        }));
      }
      return exists ? prev.map(inv => inv.id === invoiceToSave.id ? invoiceToSave : inv) : [invoiceToSave, ...prev];
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
    const clientSnapshot = clients.find(c => c.id === quotation.clientId) || quotation.clientDetails;
    const quotationToSave = { ...quotation, clientDetails: clientSnapshot };

    setQuotations(prev => {
      const exists = prev.find(q => q.id === quotationToSave.id);
      if (!exists && userProfile.quotationSequence) {
        setUserProfile(p => ({
          ...p,
          quotationSequence: {
            ...p.quotationSequence!,
            nextNumber: p.quotationSequence!.nextNumber + 1
          }
        }));
      }
      return exists ? prev.map(q => q.id === quotationToSave.id ? quotationToSave : q) : [quotationToSave, ...prev];
    });
    setEditingQuotation(null);
  };

  const handleSaveDeliveryChallan = (challan: DeliveryChallan) => {
    const clientSnapshot = clients.find(c => c.id === challan.clientId) || challan.clientDetails;
    const challanToSave = { ...challan, clientDetails: clientSnapshot };

    setDeliveryChallans(prev => {
      const exists = prev.find(dc => dc.id === challanToSave.id);
      if (!exists && userProfile.challanSequence) {
        setUserProfile(p => ({
          ...p,
          challanSequence: {
            ...p.challanSequence!,
            nextNumber: p.challanSequence!.nextNumber + 1
          }
        }));
      }
      return exists ? prev.map(dc => dc.id === challanToSave.id ? challanToSave : dc) : [challanToSave, ...prev];
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
      clientDetails: quotation.clientDetails,
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
      clientDetails: invoice.clientDetails,
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
    
    let strictlyNew: Invoice[] = [];
    let conflicting: { parsed: Invoice; existing: Invoice }[] = [];
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

        const parseResult = await parseInvoiceFromImage(base64Data, file.type);
        
        if (parseResult && parseResult.success) {
          const parsedData = parseResult.data;
          
          const normalizeString = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

          let clientId = '';

          if (parsedData.clientName) {
            const pName = normalizeString(parsedData.clientName);
            const pGstin = normalizeString(parsedData.clientGstin);
            const pPhone = normalizeString(parsedData.clientPhone);
            
            const addr = parsedData.clientAddress || {};
            const pStreet = normalizeString(addr.street);
            const pCity = normalizeString(addr.city);

            let matchedClient = updatedClients.find(c => {
               const cName = normalizeString(c.name);
               const cGstin = normalizeString(c.gstin);
               const cPhone = normalizeString(c.phone);
               const cStreet = normalizeString(c.address?.street);
               const cCity = normalizeString(c.address?.city);
               
               if (cName !== pName) return false;
               if (pGstin && cGstin && pGstin !== cGstin) return false;
               if (pPhone && cPhone && pPhone !== cPhone) return false;
               
               if (pStreet && cStreet && !cStreet.includes(pStreet.substring(0, 10)) && !pStreet.includes(cStreet.substring(0, 10))) return false;
               if (pCity && cCity && pCity !== cCity) return false;

               return true;
            });

            if (matchedClient) {
              clientId = matchedClient.id;
            } else {
              let finalStreet = typeof addr === 'string' ? addr : addr.street || '';
              
              const newClient: Client = {
                id: `client-${Date.now()}-${i}`,
                name: parsedData.clientName,
                email: parsedData.clientEmail || '',
                phone: parsedData.clientPhone || '',
                address: {
                  street: finalStreet,
                  city: addr.city || '',
                  state: addr.state || parsedData.placeOfSupply || '',
                  stateCode: '',
                  pincode: addr.pincode || '',
                  country: addr.country || 'India'
                },
                gstin: parsedData.clientGstin || '',
                pan: parsedData.clientPan || ''
              };
              
              if (parsedData.clientRegistered && !newClient.gstin) {
                 newClient.customFields = [{ label: 'Status', value: 'Registered (GSTIN Missing)' }];
              } else if (!parsedData.clientRegistered && !newClient.gstin) {
                 newClient.customFields = [{ label: 'Status', value: 'Non-Registered' }];
              }

              updatedClients.push(newClient);
              clientId = newClient.id;
              clientsChanged = true;
            }
          }

          if (!clientId) {
            const unknownClient: Client = {
              id: `client-unknown-${Date.now()}-${i}`,
              name: 'Unknown Client',
              email: '',
              address: { street: '', city: '', state: '', stateCode: '', pincode: '', country: 'India' }
            };
            updatedClients.push(unknownClient);
            clientId = unknownClient.id;
            clientsChanged = true;
          }

          const parsedNumber = parsedData.number;
          const newNumber = parsedNumber || `CD${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

          const newInvoice: Invoice = {
            id: `inv-${Date.now()}-${i}`,
            number: newNumber,
            date: parsedData.date || new Date().toISOString().split('T')[0],
            dueDate: parsedData.dueDate || '',
            status: InvoiceStatus.DRAFT,
            clientId: clientId,
            clientDetails: updatedClients.find(c => c.id === clientId),
            items: parsedData.items && parsedData.items.length > 0 ? parsedData.items.map((item: any, index: number) => ({
              id: `item-${Date.now()}-${i}-${index}`,
              description: item.description || '',
              hsn: item.hsn || '',
              qty: item.qty || 1,
              rate: item.rate || 0,
              taxRate: item.taxRate || 18
            })) : [{ id: '1', description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }],
            additionalCharges: parsedData.additionalCharges && parsedData.additionalCharges.length > 0 ? parsedData.additionalCharges.map((charge: any, index: number) => ({
              id: `charge-${Date.now()}-${i}-${index}`,
              label: charge.label || 'Additional Charge',
              amount: charge.amount || 0
            })) : undefined,
            placeOfSupply: parsedData.placeOfSupply || `${userProfile.address.state} (${userProfile.address.stateCode})`,
            bankDetails: userProfile.bankAccounts[0],
            terms: parsedData.termsAndConditions || userProfile.defaultInvoiceTerms || '1. Subject to local jurisdiction.\n2. Payment within due date.'
          };

          let existing;
          if (parsedNumber) {
            existing = invoices.find(inv => 
              inv.number.toLowerCase() === parsedNumber.toLowerCase() && 
              inv.clientId === clientId
            );
          }
          
          if (existing) {
            conflicting.push({ parsed: newInvoice, existing });
          } else {
            strictlyNew.push(newInvoice);
          }
        } else {
          console.warn(`Could not extract details from file: ${file.name}`);
          conflicting.push({ 
            parsed: { id: `err-${Date.now()}`, number: `Error: ${file.name}`, date: '', status: InvoiceStatus.DRAFT, clientId: '', items: [], placeOfSupply: '', bankDetails: userProfile.bankAccounts[0] } as Invoice, 
            existing: { id: `msg-${Date.now()}`, number: `Extraction Failed: ${parseResult?.error || 'Unknown error'}`, date: '', status: InvoiceStatus.DRAFT, clientId: '', items: [], placeOfSupply: '', bankDetails: userProfile.bankAccounts[0] } as Invoice
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        conflicting.push({ 
            parsed: { id: `err-${Date.now()}`, number: `Error: ${file.name}`, date: '', status: InvoiceStatus.DRAFT, clientId: '', items: [], placeOfSupply: '', bankDetails: userProfile.bankAccounts[0] } as Invoice, 
            existing: { id: `msg-${Date.now()}`, number: `Processing Error: ${(error as any)?.message || error}`, date: '', status: InvoiceStatus.DRAFT, clientId: '', items: [], placeOfSupply: '', bankDetails: userProfile.bankAccounts[0] } as Invoice
        });
      }
    }

    if (conflicting.length > 0) {
      setUploadConflicts({ conflicting, strictlyNew, updatedClients, totalFiles: files.length, clientsChanged });
      setIsUploadingBill(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return; 
    } else {
      finalizeUpload(strictlyNew, updatedClients, files.length, clientsChanged);
    }
  };

  const finalizeUpload = (invoicesToApply: Invoice[], newClients: Client[], filesCount: number, hasClientsChanged: boolean) => {
    if (invoicesToApply.length === 0 && filesCount > 0) {
      setIsUploadingBill(false);
      setUploadProgress(null);
      setUploadConflicts(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    let finalInvoices = [...invoices];
    
    invoicesToApply.forEach(inv => {
      const index = finalInvoices.findIndex(existing => existing.id === inv.id);
      if (index !== -1) {
        finalInvoices[index] = inv;
      } else {
        finalInvoices.unshift(inv);
      }
    });

    if (hasClientsChanged) {
      setClients(newClients);
      StorageService.save(STORAGE_KEYS.CLIENTS, newClients);
    }

    if (filesCount === 1 && invoicesToApply.length === 1) {
      setEditingInvoice(invoicesToApply[0]);
    } else if (invoicesToApply.length > 0) {
      setInvoices(finalInvoices);
      StorageService.save(STORAGE_KEYS.INVOICES, finalInvoices);
      alert(`Successfully processed and saved ${invoicesToApply.length} invoices!`);
    }

    setIsUploadingBill(false);
    setUploadProgress(null);
    setUploadConflicts(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResolveUploads = (action: 'skip' | 'update') => {
    if (!uploadConflicts) return;

    let invoicesToSave = [...uploadConflicts.strictlyNew];

    if (action === 'update') {
      const parsedToUpdate = uploadConflicts.conflicting
        .filter(c => !c.parsed.id.startsWith('err-')) // Don't save extraction errors
        .map(c => ({
          ...c.parsed,
          id: c.existing.id // Retain existing system ID so it replaces instead of prepends
      }));
      invoicesToSave = [...invoicesToSave, ...parsedToUpdate];
    }

    finalizeUpload(invoicesToSave, uploadConflicts.updatedClients, uploadConflicts.totalFiles, uploadConflicts.clientsChanged);
  };

  const handleUploadStatement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsReconciling(true);
    setUploadProgress({ current: 1, total: 1 });

    const file = files[0]; // Process one bank statement at a time
    const reader = new FileReader();

    reader.onload = async (event) => {
      const base64String = event.target?.result?.toString().split(',')[1];
      if (base64String) {
        const parseResult = await parseBankStatementFromImage(base64String, file.type);
        if (parseResult && parseResult.success && parseResult.data?.transactions) {
          
          const unpaidInvoices = invoices.filter(inv => inv.status !== InvoiceStatus.PAID);
          
          const transactions = parseResult.data.transactions.map((tx: any, idx: number) => {
             // Attempt auto-match by exactly matching the document total
             let matchedInvoiceId: string | null = null;
             
             // Look for an exact unpaid match
             const matchedInvoice = unpaidInvoices.find(inv => {
                const total = calculateDocumentTotal(inv);
                // Allow a tiny margin of error for floating points
                return Math.abs(total - tx.amount) < 0.1;
             });

             if (matchedInvoice) {
                matchedInvoiceId = matchedInvoice.id;
             }

             return {
                id: `tx-${Date.now()}-${idx}`,
                date: tx.date || '',
                description: tx.description || '',
                amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount?.toString() || '0'),
                matchedInvoiceId
             };
          });

          setReconciliationData({ transactions });
        } else {
          alert(`Failed to extract transactions: ${parseResult?.error || 'Unknown error'}`);
        }
      }
      setIsReconciling(false);
      setUploadProgress(null);
      if (statementInputRef.current) statementInputRef.current.value = '';
    };

    reader.onerror = () => {
      alert("Failed to read file.");
      setIsReconciling(false);
      setUploadProgress(null);
    };

    reader.readAsDataURL(file);
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
        if (editingInvoice) return <InvoiceForm mode="invoice" userProfile={userProfile} clients={clients} onSave={handleSaveInvoice} onCancel={() => setEditingInvoice(null)} initialData={editingInvoice} existingInvoices={invoices} onEditClient={(client) => { setEditingClient(client); setActiveTab('clients'); }} onSaveClient={handleSaveClient} />;
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
                  ref={statementInputRef} 
                  onChange={handleUploadStatement} 
                />
                <button 
                  onClick={() => statementInputRef.current?.click()}
                  disabled={isReconciling}
                  className="w-full sm:w-auto bg-[#c5f5e8] text-emerald-900 border border-emerald-200 px-5 py-3 rounded-xl hover:bg-[#b0ecd9] transition font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReconciling ? (
                    <div className="w-5 h-5 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {isReconciling ? 'Checking Bank...' : 'Reconcile'}
                </button>
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
        if (editingQuotation) return <InvoiceForm mode="quotation" userProfile={userProfile} clients={clients} onSave={handleSaveQuotation} onCancel={() => setEditingQuotation(null)} initialData={editingQuotation} onConvertToInvoice={handleConvertToInvoice} onEditClient={(client) => { setEditingClient(client); setActiveTab('clients'); }} onSaveClient={handleSaveClient} />;
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
        if (editingDeliveryChallan) return <InvoiceForm mode="delivery-challan" userProfile={userProfile} clients={clients} onSave={handleSaveDeliveryChallan} onCancel={() => setEditingDeliveryChallan(null)} initialData={editingDeliveryChallan} onEditClient={(client) => { setEditingClient(client); setActiveTab('clients'); }} onSaveClient={handleSaveClient} />;
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

        {uploadConflicts && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Report</h3>
              <p className="text-sm text-gray-500 mb-6 font-medium">Please review these issues encountered during your upload.</p>
              
              <div className="max-h-60 overflow-y-auto mb-6 custom-scrollbar border rounded-xl shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold sticky top-0 border-b shadow-sm">
                    <tr>
                      <th className="p-3">File / Invoice #</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Issue Detected</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {uploadConflicts.conflicting.map(c => {
                      const isError = c.parsed.id.startsWith('err-');
                      return (
                      <tr key={c.parsed.id} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-900">{isError ? c.parsed.number || 'Unknown File' : c.parsed.number}</td>
                        <td className="p-3 text-gray-600">{isError ? '-' : clients.find(client => client.id === c.parsed.clientId)?.name || c.parsed.clientId || 'Unknown'}</td>
                        <td className="p-3">
                          {isError ? (
                             <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold line-clamp-2 max-w-xs" title={c.existing.number}>{c.existing.number}</span>
                          ) : (
                             <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Duplicate Found</span>
                          )}
                        </td>
                        <td className={`p-3 text-right font-semibold text-xs uppercase tracking-wider ${isError ? 'text-red-500' : 'text-orange-600'}`}>
                           {isError ? 'SKIPPED' : 'WILL OVERWRITE'}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => handleResolveUploads('skip')}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition"
                >
                  Skip Existing
                </button>
                <button 
                  onClick={() => handleResolveUploads('update')}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                  Update Existing
                </button>
              </div>
            </div>
          </div>
        )}

        {reconciliationData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <div>
                   <h3 className="text-xl font-bold text-gray-900">Bank Statement Reconciliation</h3>
                   <p className="text-sm text-gray-500 font-medium">Map incoming bank deposits to your unpaid invoices.</p>
                 </div>
                 <button onClick={() => setReconciliationData(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              
              <div className="min-h-0 flex-1 overflow-y-auto mb-6 custom-scrollbar border rounded-xl shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8fafc] text-slate-500 font-bold sticky top-0 border-b shadow-sm z-10">
                    <tr>
                      <th className="p-3 w-1/4">Date & Desc</th>
                      <th className="p-3 w-1/6">Received</th>
                      <th className="p-3">Matched Unpaid Invoice</th>
                      <th className="p-3 w-[120px] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reconciliationData.transactions.length === 0 ? (
                       <tr><td colSpan={4} className="p-8 text-center text-gray-500 font-medium">No incoming transactions found on this statement.</td></tr>
                    ) : (
                       reconciliationData.transactions.map((tx, idx) => (
                         <tr key={tx.id} className="hover:bg-slate-50/50">
                           <td className="p-3">
                             <div className="font-bold text-gray-900">{tx.date}</div>
                             <div className="text-xs text-slate-500 truncate max-w-[200px]" title={tx.description}>{tx.description}</div>
                           </td>
                           <td className="p-3 font-mono font-bold text-emerald-600 whitespace-nowrap">
                             ₹{tx.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                           </td>
                           <td className="p-3">
                              <select 
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 bg-white"
                                value={tx.matchedInvoiceId || ''}
                                onChange={(e) => {
                                   const newId = e.target.value === '' ? null : e.target.value;
                                   setReconciliationData({
                                      transactions: reconciliationData.transactions.map(t => t.id === tx.id ? {...t, matchedInvoiceId: newId} : t)
                                   });
                                }}
                              >
                                 <option value="">-- No Match --</option>
                                 {invoices.filter(i => i.status !== InvoiceStatus.PAID).map(inv => {
                                    const client = clients.find(c => c.id === inv.clientId);
                                    const invTotal = calculateDocumentTotal(inv);
                                    return (
                                      <option key={inv.id} value={inv.id}>
                                         {inv.number} - {client?.name || 'Unknown'} (₹{invTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})})
                                      </option>
                                    );
                                 })}
                              </select>
                           </td>
                           <td className="p-3 text-right">
                              {tx.matchedInvoiceId ? (
                                <button
                                   onClick={() => {
                                      // Apply payment
                                      const updatedInvoices = invoices.map(i => i.id === tx.matchedInvoiceId ? {...i, status: InvoiceStatus.PAID} : i);
                                      setInvoices(updatedInvoices);
                                      StorageService.save(STORAGE_KEYS.INVOICES, updatedInvoices);
                                      
                                      // Remove transaction from list once processed
                                      setReconciliationData({
                                         transactions: reconciliationData.transactions.filter(t => t.id !== tx.id)
                                      });
                                   }}
                                   className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                   Mark Paid
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unlinked</span>
                              )}
                           </td>
                         </tr>
                       ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between items-center shrink-0 pt-2 border-t">
                <span className="text-sm font-bold text-gray-500">
                   {reconciliationData.transactions.filter(t => t.matchedInvoiceId).length} Matches Ready
                </span>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setReconciliationData(null)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                       // Process all matched ones automatically
                       const matchedTransactions = reconciliationData.transactions.filter(t => t.matchedInvoiceId);
                       if (matchedTransactions.length === 0) return;
                       
                       let updatedInvoices = [...invoices];
                       matchedTransactions.forEach(tx => {
                          const idx = updatedInvoices.findIndex(i => i.id === tx.matchedInvoiceId);
                          if (idx !== -1) updatedInvoices[idx] = {...updatedInvoices[idx], status: InvoiceStatus.PAID};
                       });
                       
                       setInvoices(updatedInvoices);
                       StorageService.save(STORAGE_KEYS.INVOICES, updatedInvoices);
                       setReconciliationData(null);
                       alert(`Successfully marked ${matchedTransactions.length} invoices as Paid!`);
                    }}
                    disabled={reconciliationData.transactions.filter(t => t.matchedInvoiceId).length === 0}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Process All Matched
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
