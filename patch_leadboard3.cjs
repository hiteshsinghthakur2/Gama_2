const fs = require('fs');

const content = `import React, { useState } from 'react';
import { TrashStorageService } from '../services/TrashStorageService';
import { Lead, LeadStatus } from '../types';
import { formatCurrency } from '../services/Calculations';

interface LeadBoardProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

const LeadBoard: React.FC<LeadBoardProps> = ({ leads, setLeads }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({ status: LeadStatus.NEW, value: 0 });

  const statuses = Object.values(LeadStatus);

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

  const handleAddLead = () => {
    if (newLead.name && newLead.company) {
      setLeads([...leads, {
        id: \`lead-\${Date.now()}\`,
        name: newLead.name,
        company: newLead.company,
        status: newLead.status as LeadStatus,
        value: newLead.value || 0,
        createdAt: new Date().toISOString()
      }]);
      setIsAdding(false);
      setNewLead({ status: LeadStatus.NEW, value: 0 });
    }
  };

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-10">
         <div>
            <h1 className="text-3xl font-black text-gray-900">CRM Pipeline</h1>
            <p className="text-gray-500 text-sm">Visual tracking for business opportunities</p>
         </div>
         <button 
           onClick={() => setIsAdding(true)}
           className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition flex items-center gap-2"
         >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New Lead
         </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add New Lead</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Name</label>
                <input type="text" value={newLead.name || ''} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company</label>
                <input type="text" value={newLead.company || ''} onChange={e => setNewLead({...newLead, company: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expected Value</label>
                <input type="number" value={newLead.value || 0} onChange={e => setNewLead({...newLead, value: parseFloat(e.target.value) || 0})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select value={newLead.status} onChange={e => setNewLead({...newLead, status: e.target.value as LeadStatus})} className="w-full border rounded-lg p-2">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAddLead} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Save Lead</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-x-auto pb-10 custom-scrollbar">
        {statuses.map(status => (
          <div key={status} className="w-80 flex-shrink-0 flex flex-col h-full bg-gray-100/40 rounded-3xl p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="font-black text-gray-700 flex items-center gap-2 uppercase text-xs tracking-widest">
                 <span className={\`w-2.5 h-2.5 rounded-full \${status === LeadStatus.WON ? 'bg-emerald-500' : 'bg-indigo-500'}\`}></span>
                 {status}
              </h3>
              <span className="text-[10px] bg-white text-gray-400 px-3 py-1 rounded-full font-black shadow-sm border border-gray-50">
                {leads.filter(l => l.status === status).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar px-1">
              {leads.filter(l => l.status === status).map(lead => (
                <div key={lead.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                   <div className="flex justify-between items-start mb-3">
                      <p className="font-bold text-gray-900 leading-tight">{lead.company}</p>
                      <button 
                        onClick={() => deleteLead(lead.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                   </div>
                   <p className="text-sm text-gray-500 font-medium mb-4">{lead.name}</p>
                   
                   <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                     <span className="text-sm font-black text-indigo-600">{formatCurrency(lead.value)}</span>
                     <select 
                       value={lead.status}
                       onChange={(e) => moveLead(lead.id, e.target.value as LeadStatus)}
                       className="text-xs font-bold text-gray-500 bg-gray-50 border-none rounded-lg focus:ring-0 cursor-pointer"
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
`;
fs.writeFileSync('components/LeadBoard.tsx', content);
