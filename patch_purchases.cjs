const fs = require('fs');

let content = fs.readFileSync('components/PurchaseArchive.tsx', 'utf-8');

// Add handleUpdateComment
const updateFn = `  const handleUpdateComment = async (id: string, comment: string) => {
    try {
      const inv = invoices.find(i => i.id === id);
      if (!inv) return;
      const updated = { ...inv, comment };
      const currentInvoices = invoices.map(i => i.id === id ? updated : i);
      setInvoices(currentInvoices);
      await PurchaseStorageService.saveAll(currentInvoices);
    } catch (e) {
      console.error("Failed to update comment", e);
    }
  };

  const filteredInvoices`;

content = content.replace('  const filteredInvoices', updateFn);

// Replace the notes cell with an editable comment cell
const regex = new RegExp(`<td className="px-6 py-4 text-gray-500 text-xs truncate max-w-\\[120px\\]">\\{inv\\.notes \\|\\| '-'\\}<\\/td>`);
content = content.replace(regex, `<td className="px-6 py-4 text-gray-500 text-xs max-w-[120px]" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="text" 
                      defaultValue={inv.comment || ''}
                      placeholder="Add comment..."
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5 placeholder-gray-300"
                      onBlur={(e) => {
                        if (e.target.value !== (inv.comment || '')) {
                          handleUpdateComment(inv.id, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </td>`);

fs.writeFileSync('components/PurchaseArchive.tsx', content);

