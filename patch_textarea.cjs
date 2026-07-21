const fs = require('fs');

const patchFile = (file, varName, docId, updateCall) => {
    let content = fs.readFileSync(file, 'utf-8');

    const searchStr = `<td className="px-6 py-4 text-gray-500 text-xs max-w-[120px]" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="text" 
                      defaultValue={${varName}.comment || ''}
                      placeholder="Add comment..."
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5 placeholder-gray-300"
                      onBlur={(e) => {
                        if (${updateCall === 'handleUpdateComment' ? '' : updateCall + ' && '}e.target.value !== (${varName}.comment || '')) {
                          ${updateCall}(${docId}, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </td>`;

    const replacement = `<td className="px-6 py-4 text-gray-600 text-xs font-medium max-w-[150px] align-top" onClick={(e) => e.stopPropagation()}>
                    <textarea 
                      defaultValue={${varName}.comment || ''}
                      placeholder="Add comment..."
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5 placeholder-gray-300 resize-none overflow-hidden break-words"
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                      onInput={(e) => {
                        e.currentTarget.style.height = 'auto';
                        e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                      }}
                      onBlur={(e) => {
                        if (${updateCall === 'handleUpdateComment' ? '' : updateCall + ' && '}e.target.value !== (${varName}.comment || '')) {
                          ${updateCall}(${docId}, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </td>`;

    if (content.includes(searchStr)) {
        content = content.replace(searchStr, replacement);
        fs.writeFileSync(file, content);
        console.log(`Patched ${file}`);
    } else {
        console.log(`Could not match in ${file}`);
    }
};

patchFile('components/InvoiceList.tsx', 'inv', 'inv.id', 'onUpdateComment');
patchFile('components/QuotationList.tsx', 'qt', 'qt.id', 'onUpdateComment');
patchFile('components/DeliveryChallanList.tsx', 'challan', 'challan.id', 'onUpdateComment');
patchFile('components/PurchaseArchive.tsx', 'inv', 'inv.id', 'handleUpdateComment');

