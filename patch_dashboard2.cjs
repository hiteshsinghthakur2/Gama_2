const fs = require('fs');
let content = fs.readFileSync('components/Dashboard.tsx', 'utf-8');

content = content.replace(
  `const [timeFilter, setTimeFilter] = useState<'this_year' | 'all_time'>('this_year');`,
  `const [timeFilter, setTimeFilter] = useState<'this_year' | 'financial_year' | 'all_time'>('financial_year');`
);

content = content.replace(
  `const currentYear = new Date().getFullYear();`,
  `const now = new Date();
  const currentYear = now.getFullYear();
  // Financial Year in India: Apr 1 to Mar 31.
  // Assessment Year is technically the year following FY, but users usually mean FY when they say AY in dashboards.
  const isBeforeApril = now.getMonth() < 3;
  const fyStartYear = isBeforeApril ? currentYear - 1 : currentYear;
  const fyEndYear = fyStartYear + 1;`
);

content = content.replace(
  `let targetInvoices = invoices;
    if (timeFilter === 'this_year') {
      targetInvoices = invoices.filter(inv => new Date(inv.date).getFullYear() === currentYear);
    }`,
  `let targetInvoices = invoices;
    if (timeFilter === 'this_year') {
      targetInvoices = invoices.filter(inv => new Date(inv.date).getFullYear() === currentYear);
    } else if (timeFilter === 'financial_year') {
      targetInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return (d.getFullYear() === fyStartYear && d.getMonth() >= 3) || (d.getFullYear() === fyEndYear && d.getMonth() < 3);
      });
    }`
);

content = content.replace(
  `if (timeFilter === 'this_year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      cd = months.map(m => ({ name: m, sales: 0 }));
      paid.forEach(inv => {
        const d = new Date(inv.date);
        if (d.getFullYear() === currentYear) {
           cd[d.getMonth()].sales += calculateDocumentTotal(inv);
        }
      });
    } else {`,
  `if (timeFilter === 'this_year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      cd = months.map(m => ({ name: m, sales: 0 }));
      paid.forEach(inv => {
        const d = new Date(inv.date);
        if (d.getFullYear() === currentYear) {
           cd[d.getMonth()].sales += calculateDocumentTotal(inv);
        }
      });
    } else if (timeFilter === 'financial_year') {
      const fyMonths = [
        { label: 'Apr', month: 3 }, { label: 'May', month: 4 }, { label: 'Jun', month: 5 },
        { label: 'Jul', month: 6 }, { label: 'Aug', month: 7 }, { label: 'Sep', month: 8 },
        { label: 'Oct', month: 9 }, { label: 'Nov', month: 10 }, { label: 'Dec', month: 11 },
        { label: 'Jan', month: 0 }, { label: 'Feb', month: 1 }, { label: 'Mar', month: 2 }
      ];
      cd = fyMonths.map(m => ({ name: m.label, sales: 0 }));
      paid.forEach(inv => {
        const d = new Date(inv.date);
        if ((d.getFullYear() === fyStartYear && d.getMonth() >= 3) || (d.getFullYear() === fyEndYear && d.getMonth() < 3)) {
           const index = fyMonths.findIndex(m => m.month === d.getMonth());
           if (index !== -1) cd[index].sales += calculateDocumentTotal(inv);
        }
      });
    } else {`
);

content = content.replace(
  `let targetLeads = leads;
     if (timeFilter === 'this_year') {
        targetLeads = leads.filter(l => new Date(l.createdAt).getFullYear() === currentYear);
     }`,
  `let targetLeads = leads;
     if (timeFilter === 'this_year') {
        targetLeads = leads.filter(l => new Date(l.createdAt).getFullYear() === currentYear);
     } else if (timeFilter === 'financial_year') {
        targetLeads = leads.filter(l => {
          const d = new Date(l.createdAt);
          return (d.getFullYear() === fyStartYear && d.getMonth() >= 3) || (d.getFullYear() === fyEndYear && d.getMonth() < 3);
        });
     }`
);

// We need to replace the pieData one as well which is the exact same.
content = content.replace(
  `let targetLeads = leads;
     if (timeFilter === 'this_year') {
        targetLeads = leads.filter(l => new Date(l.createdAt).getFullYear() === currentYear);
     }`,
  `let targetLeads = leads;
     if (timeFilter === 'this_year') {
        targetLeads = leads.filter(l => new Date(l.createdAt).getFullYear() === currentYear);
     } else if (timeFilter === 'financial_year') {
        targetLeads = leads.filter(l => {
          const d = new Date(l.createdAt);
          return (d.getFullYear() === fyStartYear && d.getMonth() >= 3) || (d.getFullYear() === fyEndYear && d.getMonth() < 3);
        });
     }`
);


content = content.replace(
  `<option value="this_year">This Year ({currentYear})</option>
          <option value="all_time">All Time</option>`,
  `<option value="financial_year">Financial Year ({fyStartYear}-{String(fyEndYear).slice(-2)})</option>
          <option value="this_year">Calendar Year ({currentYear})</option>
          <option value="all_time">All Time</option>`
);

fs.writeFileSync('components/Dashboard.tsx', content);
