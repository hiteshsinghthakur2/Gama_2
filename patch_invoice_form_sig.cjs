const fs = require('fs');
let content = fs.readFileSync('components/InvoiceForm.tsx', 'utf-8');

const signatureSearch = `                   <div className={\`\${isDeliveryChallan && document.showAmountDetails === false ? 'mt-0' : 'mt-8'} text-right\`}>
                       <p className="font-bold text-gray-900 mb-6">{userProfile.companyName}</p>
                       <p className="text-xs text-gray-400 font-medium uppercase tracking-wider border-t border-gray-200 inline-block pt-2 px-8">Authorized Signatory</p>
                   </div>`;
const signatureReplace = `                   <div className={\`\${isDeliveryChallan && document.showAmountDetails === false ? 'mt-0' : 'mt-8'} text-right\`}>
                       <p className="font-bold text-gray-900 mb-2">{userProfile.companyName}</p>
                       {userProfile.signatureUrl ? (
                           <div className="flex justify-end mb-2">
                               <img src={userProfile.signatureUrl} alt="Signature" className="h-16 object-contain" />
                           </div>
                       ) : (
                           <div className="h-16 mb-2"></div>
                       )}
                       <p className="text-xs text-gray-400 font-medium uppercase tracking-wider border-t border-gray-200 inline-block pt-2 px-8">Authorized Signatory</p>
                   </div>`;
content = content.replace(signatureSearch, signatureReplace);

fs.writeFileSync('components/InvoiceForm.tsx', content);
console.log('Patched InvoiceForm.tsx');
