import React, { useState } from 'react';
import { TrashStorageService } from '../services/TrashStorageService';
import { uploadFileToDrive } from '../services/GoogleDriveService';
import { Lead, LeadStatus } from '../types';
import { formatCurrency } from '../services/Calculations';

interface LeadBoardProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

const LeadBoard: React.FC<LeadBoardProps> = ({ leads, setLeads }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newLead, setNewLead] = useState<Partial<Lead>>({ status: LeadStatus.NEW, value: 0 });
  const statuses = Object.values(LeadStatus);

  const handleDriveUpload = async () => {
    try {
        const headers = ['Name,Company,Email,Phone,Value,Status,Next Follow Up,Created At,Description'];
        const rows = leads.map(l => `"${l.name}","${l.company}","${l.email || ''}","${l.phone || ''}","${l.value}","${l.status}","${l.nextFollowUp || ''}","${l.createdAt}","${(l.description || '').replace(/"/g, '""')}"`);
        const csvContent = headers.concat(rows).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const uploadFile = new File([blob], 'CraftDaddy_Leads.csv', { type: 'text/csv' });
        
        await uploadFileToDrive(uploadFile, 'CraftDaddy Data');
        alert('Leads list saved to Google Drive successfully!');
    } catch (e: any) {
        console.error('Drive upload error:', e);
        alert(`Failed to save to Google Drive: ${e.message}`);
    }
  };

  const moveLead = (id: string, newStatus: LeadStatus) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
  };

  const deleteLead = async (id: string) => {
    if (window.confirm('Delete this lead?')) {
      const lead = leads.find(l => l.id === id);
      if (lead) {
        await TrashStorageService.moveToTrash({ type: 'lead', data: lead, summary: 'Lead: ' + lead.name + ' (' + lead.company + ')', originalId: lead.id });
        setLeads(leads.filter(l => l.id !== id));
      }
    }
  };

  const handleSaveLead = () => {
    if (newLead.name && newLead.company) {
      if (isEditing) {
        setLeads(leads.map(l => l.id === isEditing ? { ...l, ...newLead } as Lead : l));
      } else {
        setLeads([...leads, {
          ...newLead,
          id: `lead-${Date.now()}`,
          name: newLead.name,
          company: newLead.company,
          status: newLead.status as LeadStatus,
          value: newLead.value || 0,
          createdAt: new Date().toISOString()
        } as Lead]);
      }
      setIsAdding(false);
      setIsEditing(null);
      setNewLead({ status: LeadStatus.NEW, value: 0 });
    }
  };
  
  const handleEditClick = (lead: Lead) => {
      setNewLead(lead);
      setIsEditing(lead.id);
      setIsAdding(true);
  };

  const closeForm = () => {
      setIsAdding(false);
      setIsEditing(null);
      setNewLead({ status: LeadStatus.NEW, value: 0 });
  };

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
         <div>
            <h1 className="text-3xl font-black text-gray-900">CRM Pipeline</h1>
            <p className="text-gray-500 text-sm">Visual tracking for business opportunities</p>
         </div>
         <div className="flex gap-3">
         <button onClick={handleDriveUpload} className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-50 shadow-sm transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            Save to Drive
         </button>
         <button 
           onClick={() => {
               setNewLead({ status: LeadStatus.NEW, value: 0 });
               setIsEditing(null);
               setIsAdding(true);
           }}
           className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition flex items-center gap-2"
         >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New Lead
         </button>
         </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold mb-4">{isEditing ? 'Edit Lead' : 'Add New Lead'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company *</label>
                <input type="text" value={newLead.company || ''} onChange={e => setNewLead({...newLead, company: e.target.value})} className="w-full border rounded-lg p-2" placeholder="Company Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Name *</label>
                <input type="text" value={newLead.name || ''} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full border rounded-lg p-2" placeholder="Full Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expected Value</label>
                <input type="number" value={newLead.value || 0} onChange={e => setNewLead({...newLead, value: parseFloat(e.target.value) || 0})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input type="email" value={newLead.email || ''} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full border rounded-lg p-2" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                <input type="text" value={newLead.phone || ''} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full border rounded-lg p-2" placeholder="+1..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select value={newLead.status} onChange={e => setNewLead({...newLead, status: e.target.value as LeadStatus})} className="w-full border rounded-lg p-2">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Next Follow Up</label>
                <input type="date" value={newLead.nextFollowUp || ''} onChange={e => setNewLead({...newLead, nextFollowUp: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description / Notes</label>
                <textarea rows={3} value={newLead.description || ''} onChange={e => setNewLead({...newLead, description: e.target.value})} className="w-full border rounded-lg p-2 resize-none" placeholder="Details about the opportunity..."></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeForm} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button 
                onClick={handleSaveLead} 
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                disabled={!newLead.name || !newLead.company}
              >
                {isEditing ? 'Update Lead' : 'Save Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-x-auto pb-10 custom-scrollbar">
        {statuses.map(status => (
          <div key={status} className="w-80 flex-shrink-0 flex flex-col h-full bg-gray-100/40 rounded-3xl p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="font-black text-gray-700 flex items-center gap-2 uppercase text-xs tracking-widest">
                 <span className={`w-2.5 h-2.5 rounded-full ${status === LeadStatus.WON ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                 {status}
              </h3>
              <span className="text-[10px] bg-white text-gray-400 px-3 py-1 rounded-full font-black shadow-sm border border-gray-50">
                {leads.filter(l => l.status === status).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar px-1">
              {leads.filter(l => l.status === status).map(lead => (
                <div key={lead.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                   <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-900 leading-tight">{lead.company}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button 
                            onClick={() => handleEditClick(lead)}
                            className="text-gray-300 hover:text-indigo-500 transition"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button 
                            onClick={() => deleteLead(lead.id)}
                            className="text-gray-300 hover:text-red-500 transition"
                            title="Delete"
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                      </div>
                   </div>
                   <p className="text-sm text-gray-500 font-medium mb-1">{lead.name}</p>
                   {lead.email && <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> <a href={`mailto:${lead.email}`} className="hover:text-indigo-500 transition">{lead.email}</a></p>}
                   {lead.phone && <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> <a href={`tel:${lead.phone}`} className="hover:text-indigo-500 transition">{lead.phone}</a></p>}
                   {lead.nextFollowUp && <p className="text-xs text-orange-500 font-bold mb-2 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Follow Up: {new Date(lead.nextFollowUp).toLocaleDateString()}</p>}
                   {lead.description && <p className="text-xs text-gray-500 mb-3 line-clamp-3 border-l-2 border-gray-200 pl-2 mt-2">{lead.description}</p>}
                   
                   <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                     <span className="text-sm font-black text-indigo-600">{formatCurrency(lead.value)}</span>
                     <select 
                       value={lead.status}
                       onChange={(e) => moveLead(lead.id, e.target.value as LeadStatus)}
                       className="text-xs font-bold text-gray-500 bg-gray-50 border-none rounded-lg focus:ring-0 cursor-pointer p-1 py-1.5 pr-6"
                     >
                       {statuses.map(s => (
                         <option key={s} value={s}>{s}</option>
                       ))}
                     </select>
                   </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadBoard;
