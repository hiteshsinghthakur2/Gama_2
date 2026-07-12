const fs = require('fs');
let file = fs.readFileSync('components/LeadBoard.tsx', 'utf-8');

if (!file.includes('TrashStorageService')) {
  file = file.replace(
    `import React from 'react';`,
    `import React from 'react';\nimport { TrashStorageService } from '../services/TrashStorageService';`
  );

  file = file.replace(
    `  const deleteLead = (id: string) => {
    if (window.confirm('Delete this lead?')) {
      setLeads(leads.filter(l => l.id !== id));
    }
  };`,
    `  const deleteLead = async (id: string) => {
    if (window.confirm('Move this lead to trash?')) {
      const lead = leads.find(l => l.id === id);
      if (lead) {
        await TrashStorageService.moveToTrash({ type: 'lead', data: lead, summary: 'Lead: ' + lead.name + ' (' + lead.company + ')', originalId: lead.id });
        setLeads(leads.filter(l => l.id !== id));
      }
    }
  };`
  );
  
  fs.writeFileSync('components/LeadBoard.tsx', file);
}
