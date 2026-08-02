const fs = require('fs');

function patchFile(filename, isChallan) {
    let content = fs.readFileSync(filename, 'utf-8');
    
    let searchBlock = `    // Search Filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const client = getClient(inv.clientId, inv);
        const matchNumber = inv.number.toLowerCase().includes(query);
        const matchClient = client && client.name.toLowerCase().includes(query);
        const matchItems = inv.items.some(item => item.description.toLowerCase().includes(query));
        
        if (!matchNumber && !matchClient && !matchItems) return false;
    }`;

    let replaceBlock = `    // Search Filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        // Remove commas and currency symbols for numeric search
        const numericQuery = query.replace(/[,₹]/g, '').trim();
        
        const client = getClient(inv.clientId, inv);
        const matchNumber = inv.number.toLowerCase().includes(query);
        const matchClient = client && client.name.toLowerCase().includes(query);
        const matchItems = inv.items.some(item => item.description.toLowerCase().includes(query));
        const matchComment = inv.comment && inv.comment.toLowerCase().includes(query);
        
        let matchTotal = false;
        ${isChallan ? '' : `const total = calculateDocumentTotal(inv);
        // Check exact total, or formatted total string
        matchTotal = total.toString().includes(numericQuery) || formatCurrency(total).toLowerCase().includes(query);`}
        
        if (!matchNumber && !matchClient && !matchItems && !matchComment && !matchTotal) return false;
    }`;
    
    content = content.replace(searchBlock, replaceBlock);
    fs.writeFileSync(filename, content);
    console.log('Patched ' + filename);
}

patchFile('components/InvoiceList.tsx', false);
patchFile('components/QuotationList.tsx', false);
patchFile('components/DeliveryChallanList.tsx', true);

