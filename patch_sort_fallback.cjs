const fs = require('fs');

function patchFile(filename) {
    let content = fs.readFileSync(filename, 'utf-8');
    
    const oldSortStr = `if (sortBy === 'number') {
      const numA = a.number.toLowerCase();
      const numB = b.number.toLowerCase();
      if (numA < numB) return sortOrder === 'asc' ? -1 : 1;
      if (numA > numB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    }
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;`;
    
    const newSortStr = `if (sortBy === 'number') {
      const numA = a.number.toLowerCase();
      const numB = b.number.toLowerCase();
      return sortOrder === 'asc' ? numA.localeCompare(numB, undefined, { numeric: true }) : numB.localeCompare(numA, undefined, { numeric: true });
    }
    if (dateA === dateB) {
        const numA = a.number.toLowerCase();
        const numB = b.number.toLowerCase();
        return sortOrder === 'asc' ? numA.localeCompare(numB, undefined, { numeric: true }) : numB.localeCompare(numA, undefined, { numeric: true });
    }
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;`;

    content = content.replace(oldSortStr, newSortStr);
    fs.writeFileSync(filename, content);
    console.log('Patched ' + filename);
}

patchFile('components/InvoiceList.tsx');
patchFile('components/QuotationList.tsx');
patchFile('components/DeliveryChallanList.tsx');
