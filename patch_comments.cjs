const fs = require('fs');

const addCommentPropAndCell = (file, propType, varName, docId) => {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Add prop
    if (content.includes(`interface ${propType}Props {`) && !content.includes('onUpdateComment?:')) {
        content = content.replace(
            `interface ${propType}Props {`,
            `interface ${propType}Props {\n  onUpdateComment?: (id: string, comment: string) => void;`
        );
    }
    
    // Add to destructuring
    if (content.includes(`const ${propType}: React.FC<${propType}Props> = ({`) && !content.includes('onUpdateComment,')) {
        content = content.replace(
            `const ${propType}: React.FC<${propType}Props> = ({`,
            `const ${propType}: React.FC<${propType}Props> = ({\n  onUpdateComment,`
        );
    }

    // Replace the notes cell with an editable comment cell
    const regex = new RegExp(`<td className="px-6 py-4 text-gray-500 text-xs truncate max-w-\\[120px\\]">\\{${varName}\\.notes \\|\\| '-'\\}<\\/td>`);
    content = content.replace(regex, `<td className="px-6 py-4 text-gray-500 text-xs max-w-[120px]" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="text" 
                      defaultValue={${varName}.comment || ''}
                      placeholder="Add comment..."
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5 placeholder-gray-300"
                      onBlur={(e) => {
                        if (onUpdateComment && e.target.value !== (${varName}.comment || '')) {
                          onUpdateComment(${docId}, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </td>`);

    fs.writeFileSync(file, content);
};

addCommentPropAndCell('components/InvoiceList.tsx', 'InvoiceList', 'inv', 'inv.id');
addCommentPropAndCell('components/QuotationList.tsx', 'QuotationList', 'qt', 'qt.id');
addCommentPropAndCell('components/DeliveryChallanList.tsx', 'DeliveryChallanList', 'challan', 'challan.id');

