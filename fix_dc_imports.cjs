const fs = require('fs');
let content = fs.readFileSync('components/DeliveryChallanList.tsx', 'utf-8');
content = `import { uploadFileToDrive } from '../services/GoogleDriveService';\nimport LZString from 'lz-string';\n` + content;
fs.writeFileSync('components/DeliveryChallanList.tsx', content);
