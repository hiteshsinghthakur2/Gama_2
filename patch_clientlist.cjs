const fs = require('fs');
let file = fs.readFileSync('components/ClientList.tsx', 'utf-8');

if (!file.includes('uploadFileToDrive')) {
  file = file.replace(
    `import { TrashStorageService } from '../services/TrashStorageService';`,
    `import { TrashStorageService } from '../services/TrashStorageService';\nimport { uploadFileToDrive } from '../services/GoogleDriveService';`
  );
}

const driveFunc = `
  const handleDriveUpload = async () => {
    try {
        const headers = ['Name,Email,Phone,Address,Joined Date'];
        const rows = clients.map(c => \`"\${c.name}","\${c.email}","\${c.phone}","\${c.address}","\${c.joinedDate}"\`);
        const csvContent = headers.concat(rows).join('\\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const uploadFile = new File([blob], 'CraftDaddy_Clients.csv', { type: 'text/csv' });
        
        await uploadFileToDrive(uploadFile, 'CraftDaddy Data');
        alert('Clients list saved to Google Drive successfully!');
    } catch (e: any) {
        console.error('Drive upload error:', e);
        alert(\`Failed to save to Google Drive: \${e.message}\`);
    }
  };
`;

if (!file.includes('handleDriveUpload')) {
  file = file.replace(
    `const handleDelete = async (id: string) => {`,
    `${driveFunc}\n\n  const handleDelete = async (id: string) => {`
  );
}

file = file.replace(
  `<button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New Client
         </button>`,
  `<button onClick={handleDriveUpload} className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-50 shadow-sm transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            Save to Drive
         </button>
         <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New Client
         </button>`
);

file = file.replace(
  `<div className="flex justify-between items-end mb-10">`,
  `<div className="flex justify-between items-end mb-10 flex-wrap gap-4">`
);

file = file.replace(
  `<div>
            <h1 className="text-3xl font-black text-gray-900">Clients</h1>
            <p className="text-gray-500 text-sm">Manage your customer relationships</p>
         </div>
         <button`,
  `<div>
            <h1 className="text-3xl font-black text-gray-900">Clients</h1>
            <p className="text-gray-500 text-sm">Manage your customer relationships</p>
         </div>
         <div className="flex gap-3">
         <button`
);

file = file.replace(
  `Add New Client
         </button>
      </div>`,
  `Add New Client
         </button>
         </div>
      </div>`
);

fs.writeFileSync('components/ClientList.tsx', file);
