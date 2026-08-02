const fs = require('fs');

let content = fs.readFileSync('components/InvoiceList.tsx', 'utf-8');

const filterUIMark = `      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">`;

const tabsUI = `      {/* Status Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-4 overflow-x-auto hide-scrollbar">
        {['All', ...Object.values(InvoiceStatus)].map((statusOption) => {
          const val = statusOption === 'All' ? '' : statusOption;
          const isActive = filterStatus === val;
          return (
            <button
              key={statusOption}
              onClick={() => { setFilterStatus(val); setSelectedIds([]); }}
              className={\`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition \${isActive ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}\`}
            >
              {statusOption === 'All' ? 'All Invoices' : \`\${statusOption} (\${invoices.filter(i => i.status === statusOption).length})\`}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">`;

content = content.replace(filterUIMark, tabsUI);

const oldStatusSelect = `        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lifecycle (Status)</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-32 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Status</option>
            {Object.values(InvoiceStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>`;

content = content.replace(oldStatusSelect, '');

fs.writeFileSync('components/InvoiceList.tsx', content);
console.log('Patched InvoiceList.tsx');
