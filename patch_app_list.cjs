const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

content = content.replace(
  'onDelete={handleDeleteDeliveryChallan} />',
  'onDelete={handleDeleteDeliveryChallan} onConvertToInvoice={handleConvertToInvoice} />'
);

fs.writeFileSync('App.tsx', content);
