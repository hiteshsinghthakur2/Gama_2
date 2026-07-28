const fs = require('fs');
let content = fs.readFileSync('components/QuotationList.tsx', 'utf-8');

content = content.replace(
    /const \[sortOrder, setSortOrder\] = useState<'asc' \| 'desc'>\('desc'\);/,
    `const [sortBy, setSortBy] = useState<'date' | 'number'>('date');\n  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');`
);

content = content.replace(
    /return sortOrder === 'desc' \? dateB - dateA : dateA - dateB;/,
    `if (sortBy === 'number') {
      const numA = a.number.toLowerCase();
      const numB = b.number.toLowerCase();
      if (numA < numB) return sortOrder === 'asc' ? -1 : 1;
      if (numA > numB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    }
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;`
);

const sortSelectStr = `        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sort Order</label>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="w-full sm:w-32 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="desc">Latest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>`;

const newSortSelectStr = `        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sort By</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'date' | 'number')}
            className="w-full sm:w-32 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="date">Date</option>
            <option value="number">Identity</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Order</label>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="w-full sm:w-32 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>`;

content = content.replace(sortSelectStr, newSortSelectStr);

fs.writeFileSync('components/QuotationList.tsx', content);
console.log('Patched QuotationList.tsx');
