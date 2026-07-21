const fs = require('fs');

const patchFile = (file) => {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Replace the textarea class to include the font styling directly
    const searchClass = `className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5 placeholder-gray-300 resize-none overflow-hidden break-words"`;
    const replaceClass = `className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5 placeholder-gray-300 text-gray-600 font-medium text-xs resize-none overflow-hidden break-words"`;
    
    if (content.includes(searchClass)) {
        content = content.replace(searchClass, replaceClass);
        fs.writeFileSync(file, content);
        console.log(`Patched ${file}`);
    } else {
        console.log(`Could not find class in ${file}`);
    }
};

patchFile('components/InvoiceList.tsx');
patchFile('components/QuotationList.tsx');
patchFile('components/DeliveryChallanList.tsx');
patchFile('components/PurchaseArchive.tsx');
