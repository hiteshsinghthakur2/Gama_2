const fs = require('fs');
let content = fs.readFileSync('components/InvoiceForm.tsx', 'utf-8');

const datalist = `
      <datalist id="past-items-list">
        {pastItems?.map((pi, i) => (
            <option key={i} value={pi.description} />
        ))}
      </datalist>
`;

content = content.replace(
    '<div className="min-h-screen bg-gray-50 pb-32 relative font-sans text-sm text-gray-700">',
    '<div className="min-h-screen bg-gray-50 pb-32 relative font-sans text-sm text-gray-700">' + datalist
);

fs.writeFileSync('components/InvoiceForm.tsx', content);
console.log('Patched again.');
