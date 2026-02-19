
import React, { useState, useRef } from 'react';
import { UserBusinessProfile, Address } from '../types';
import { INDIAN_STATES } from '../constants';
import { StorageService } from '../services/StorageService';

interface SettingsProps {
  profile: UserBusinessProfile;
  onSave: (profile: UserBusinessProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState<UserBusinessProfile>(profile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [supabaseUrl, setSupabaseUrl] = useState((window as any).SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState((window as any).SUPABASE_ANON_KEY || '');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateAddress = (field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    setErrorMessage('');
    
    // Temporarily inject to test
    (window as any).SUPABASE_URL = supabaseUrl;
    (window as any).SUPABASE_ANON_KEY = supabaseKey;
    localStorage.setItem('SUPABASE_CONFIG', JSON.stringify({ url: supabaseUrl, key: supabaseKey }));

    // Test the connection immediately
    if (supabaseUrl && supabaseKey) {
      const testResult = await StorageService.testConnection();
      if (!testResult.success) {
        setSaveStatus('error');
        setErrorMessage(testResult.message);
        return;
      }
    }

    onSave(formData);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      window.location.reload(); 
    }, 500);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Business Settings</h1>
        <p className="text-gray-500 text-sm">Configure your company identity, communication, and cloud storage.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Cloud Connection */}
        <div className="bg-indigo-900 p-6 rounded-2xl shadow-xl border border-indigo-700 text-white">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
              Cloud Connectivity (Supabase)
            </h2>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${StorageService.isCloudEnabled() ? 'bg-emerald-500' : 'bg-white/10 text-white/40'}`}>
              {StorageService.isCloudEnabled() ? 'Configured' : 'Offline'}
            </div>
          </div>
          
          <p className="text-indigo-200 text-xs mb-6 leading-relaxed">
            Enter your Supabase credentials. Ensure you have run the <span className="text-white font-bold">SQL Script</span> in your dashboard to create the <code className="bg-white/10 px-1 rounded">user_data</code> table.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Supabase Project URL</label>
              <input 
                type="text" 
                className="w-full p-3 border rounded-xl bg-indigo-800/50 text-white outline-none focus:ring-2 focus:ring-indigo-400 border-indigo-700 font-mono text-xs"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                placeholder="https://xyz.supabase.co"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Anon API Key</label>
              <input 
                type="password" 
                className="w-full p-3 border rounded-xl bg-indigo-800/50 text-white outline-none focus:ring-2 focus:ring-indigo-400 border-indigo-700 font-mono text-xs"
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiI..."
              />
            </div>
          </div>

          {saveStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div className="text-xs">
                <p className="font-bold text-red-200">Connection Failed</p>
                <p className="text-red-300/80">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Company Branding */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
            Company Branding
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center p-2 bg-gray-50 overflow-hidden relative group">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} className="max-h-full max-w-full object-contain" alt="Logo Preview" />
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">No Logo</p>
                </div>
              )}
              <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <span className="text-white text-xs font-bold uppercase tracking-widest">Change</span>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
              <p className="text-sm font-bold text-gray-700">Company Logo</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Visible on all documents.</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition">Select Image</button>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            General Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Legal Business Name</label>
              <input required type="text" className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 font-bold" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Registered Address</label>
              <input required type="text" className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100" value={formData.address.street} onChange={e => updateAddress('street', e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">City</label>
              <input required type="text" className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100" value={formData.address.city} onChange={e => updateAddress('city', e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">State</label>
              <select className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100" value={formData.address.stateCode} onChange={e => {
                  const state = INDIAN_STATES.find(s => s.code === e.target.value);
                  if (state) setFormData({ ...formData, address: { ...formData.address, state: state.name, stateCode: state.code } });
                }}>
                {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pin Code</label>
              <input required type="text" maxLength={6} className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 font-mono" value={formData.address.pincode} onChange={e => updateAddress('pincode', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
            Bank Accounts
          </h2>
          
          <div className="space-y-4 mb-6">
            {formData.bankAccounts.map((account, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex justify-between items-start group">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Bank Name</span>
                    <span className="font-bold text-gray-800">{account.bankName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Account Number</span>
                    <span className="font-mono text-gray-700">{account.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">IFSC Code</span>
                    <span className="font-mono text-gray-700">{account.ifscCode}</span>
                  </div>
                   <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Account Name</span>
                    <span className="text-gray-700">{account.accountName}</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const newAccounts = [...formData.bankAccounts];
                    newAccounts.splice(index, 1);
                    setFormData({ ...formData, bankAccounts: newAccounts });
                  }}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            
            {formData.bankAccounts.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-medium">No bank accounts added yet.</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Add New Bank Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Bank Name (e.g. HDFC Bank)"
                  className="w-full p-3 border rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-200 text-sm"
                  id="new-bank-name"
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Account Number"
                  className="w-full p-3 border rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-200 text-sm font-mono"
                  id="new-account-number"
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="IFSC Code"
                  className="w-full p-3 border rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-200 text-sm font-mono uppercase"
                  id="new-ifsc"
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Account Holder Name"
                  className="w-full p-3 border rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-200 text-sm"
                  id="new-account-name"
                />
              </div>
               <div>
                <input 
                  type="text" 
                  placeholder="Branch Name"
                  className="w-full p-3 border rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-200 text-sm"
                  id="new-branch-name"
                />
              </div>
              <div>
                <select 
                  className="w-full p-3 border rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-200 text-sm"
                  id="new-account-type"
                >
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button 
                  type="button"
                  onClick={() => {
                    const bankNameInput = document.getElementById('new-bank-name') as HTMLInputElement;
                    const accNumberInput = document.getElementById('new-account-number') as HTMLInputElement;
                    const ifscInput = document.getElementById('new-ifsc') as HTMLInputElement;
                    const accNameInput = document.getElementById('new-account-name') as HTMLInputElement;
                    const branchInput = document.getElementById('new-branch-name') as HTMLInputElement;
                    const typeInput = document.getElementById('new-account-type') as HTMLSelectElement;

                    if (bankNameInput.value && accNumberInput.value && ifscInput.value && accNameInput.value) {
                      const newAccount = {
                        bankName: bankNameInput.value,
                        accountNumber: accNumberInput.value,
                        ifscCode: ifscInput.value,
                        accountName: accNameInput.value,
                        branchName: branchInput.value,
                        accountType: typeInput.value
                      };
                      
                      setFormData({
                        ...formData,
                        bankAccounts: [...formData.bankAccounts, newAccount]
                      });

                      // Clear inputs
                      bankNameInput.value = '';
                      accNumberInput.value = '';
                      ifscInput.value = '';
                      accNameInput.value = '';
                      branchInput.value = '';
                    }
                  }}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Add Bank Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            Email Settings
          </h2>
          <div className="space-y-4">
              <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Default Message Template</label>
                  <div className="relative">
                      <textarea 
                          rows={6}
                          className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 text-sm font-medium"
                          value={formData.emailTemplate || ''}
                          onChange={(e) => setFormData({...formData, emailTemplate: e.target.value})}
                          placeholder="Enter your default email body..."
                      />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                      Available placeholders: 
                      <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono mx-1">{'{type}'}</span>
                      <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono mx-1">{'{number}'}</span>
                      <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono mx-1">{'{amount}'}</span>
                      <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono mx-1">{'{companyName}'}</span>
                  </p>
              </div>
          </div>
        </div>

        {/* Terms and Conditions Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
            Terms & Conditions
          </h2>
          <div className="space-y-4">
              <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Default Terms and Conditions</label>
                  <div className="relative">
                      <textarea 
                          rows={6}
                          className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 text-sm font-medium"
                          value={formData.defaultTerms || ''}
                          onChange={(e) => setFormData({...formData, defaultTerms: e.target.value})}
                          placeholder="Enter your default terms and conditions..."
                      />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                      These terms will be automatically applied to new invoices and quotations. You can override them for individual documents.
                  </p>
              </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="submit" disabled={saveStatus === 'saving'} className={`px-10 py-4 rounded-xl font-bold transition shadow-lg flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : saveStatus === 'error' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'saved' ? 'Synced Successfully' : saveStatus === 'error' ? 'Try Again' : 'Apply & Sync Cloud'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;