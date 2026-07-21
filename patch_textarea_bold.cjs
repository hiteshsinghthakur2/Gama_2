const fs = require('fs');

const patchFile = (file) => {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Replace font-medium with font-bold in both td and textarea
    const searchStr1 = `className="px-6 py-4 text-gray-600 text-xs font-medium max-w-[150px] align-top"`;
    const replaceStr1 = `className="px-6 py-4 text-gray-600 text-xs font-bold max-w-[150px] align-top"`;
    
    const searchStr2 = `className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5 placeholder-gray-300 text-gray-600 font-medium text-xs resize-none overflow-hidden break-words"`;
    const replaceStr2 = `className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5 placeholder-gray-300 text-gray-600 font-bold text-xs resize-none overflow-hidden break-words"`;
    
    let modified = false;
    if (content.includes(searchStr1)) {
        content = content.replace(searchStr1, replaceStr1);
        modified = true;
    }
    if (content.includes(searchStr2)) {
        content = content.replace(searchStr2, replaceStr2);
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(file, content);
        console.log(`Patched ${file}`);
    } else {
        console.log(`Could not find strings in ${file}`);
    }
};

patchFile('components/InvoiceList.tsx');
patchFile('components/QuotationList.tsx');
patchFile('components/DeliveryChallanList.tsx');
patchFile('components/PurchaseArchive.tsx');
