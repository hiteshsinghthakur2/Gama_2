const fs = require('fs');
let content = fs.readFileSync('components/InvoiceList.tsx', 'utf-8');

// Fix toggleSelectAll
const oldToggleSelectAll = `  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map(inv => inv.id));
    }
  };`;
const newToggleSelectAll = `  const toggleSelectAll = () => {
    const allFilteredSelected = filteredInvoices.length > 0 && filteredInvoices.every(inv => selectedIds.includes(inv.id));
    if (allFilteredSelected) {
      const filteredIds = filteredInvoices.map(inv => inv.id);
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredInvoices.map(inv => inv.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };`;
content = content.replace(oldToggleSelectAll, newToggleSelectAll);

// Fix checkbox checked state
const oldCheckbox = `                       checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0} `;
const newCheckbox = `                       checked={filteredInvoices.length > 0 && filteredInvoices.every(inv => selectedIds.includes(inv.id))} `;
content = content.replace(oldCheckbox, newCheckbox);

// Fix tab onClick
const oldTabClick = `onClick={() => { setFilterStatus(val); setSelectedIds([]); }}`;
const newTabClick = `onClick={() => setFilterStatus(val)}`;
content = content.replace(oldTabClick, newTabClick);

fs.writeFileSync('components/InvoiceList.tsx', content);
