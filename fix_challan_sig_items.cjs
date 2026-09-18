const fs = require('fs');
let content = fs.readFileSync('components/DeliveryChallanList.tsx', 'utf-8');

const oldMapping = `items: challan.items.map(i => ({ desc: i.description, qty: i.quantity, amt: i.amount })),`;
const newMapping = `items: challan.items.map(i => ({ desc: i.description, qty: i.qty, amt: i.qty * i.rate })),`;

content = content.replace(oldMapping, newMapping);
fs.writeFileSync('components/DeliveryChallanList.tsx', content);
