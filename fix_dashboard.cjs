const fs = require('fs');
let content = fs.readFileSync('components/Dashboard.tsx', 'utf-8');

// fix the duplicated else if in leadValue
content = content.replace(
  `} else if (timeFilter === 'financial_year') {
        targetLeads = leads.filter(l => {
          const d = new Date(l.createdAt);
          return (d.getFullYear() === fyStartYear && d.getMonth() >= 3) || (d.getFullYear() === fyEndYear && d.getMonth() < 3);
        });
     } else if (timeFilter === 'financial_year') {
        targetLeads = leads.filter(l => {
          const d = new Date(l.createdAt);
          return (d.getFullYear() === fyStartYear && d.getMonth() >= 3) || (d.getFullYear() === fyEndYear && d.getMonth() < 3);
        });
     }`,
  `} else if (timeFilter === 'financial_year') {
        targetLeads = leads.filter(l => {
          const d = new Date(l.createdAt);
          return (d.getFullYear() === fyStartYear && d.getMonth() >= 3) || (d.getFullYear() === fyEndYear && d.getMonth() < 3);
        });
     }`
);

// fix pieData
content = content.replace(
  `const pieData = useMemo(() => {
     let targetLeads = leads;
     if (timeFilter === 'this_year') {
        targetLeads = leads.filter(l => new Date(l.createdAt).getFullYear() === currentYear);
     }`,
  `const pieData = useMemo(() => {
     let targetLeads = leads;
     if (timeFilter === 'this_year') {
        targetLeads = leads.filter(l => new Date(l.createdAt).getFullYear() === currentYear);
     } else if (timeFilter === 'financial_year') {
        targetLeads = leads.filter(l => {
          const d = new Date(l.createdAt);
          return (d.getFullYear() === fyStartYear && d.getMonth() >= 3) || (d.getFullYear() === fyEndYear && d.getMonth() < 3);
        });
     }`
);

fs.writeFileSync('components/Dashboard.tsx', content);
