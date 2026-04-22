const fs = require('fs');

const path = 'App.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. the select dropdown added in App
const selectReplacement = `
                <select
                  value={extractionMode}
                  onChange={(e) => setExtractionMode(e.target.value as any)}
                  disabled={isUploadingBill}
                  className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-xl hover:bg-gray-50 transition font-bold shadow-sm outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="ai-batch">Smart AI Batch (Fast)</option>
                  <option value="ai-single">AI Standard (Single)</option>
                  <option value="local">Pure Code (No AI, Lower Accuracy)</option>
                </select>
                <button 
                  onClick={() => fileInputRef.current?.click()}
`;

content = content.replace(/<button \n                  onClick={\(\) => fileInputRef\.current\?.click\(\)}\n                  disabled={isUploadingBill}/, selectReplacement.trim());


// 2. Modify handleUploadBill
// We replace the loop inside handleUploadBill
// from "for (let i = 0; i < files.length; i++) {" 
// up to "if (conflicting.length > 0) {"

const searchString = \`    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });
      
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const parseResult = await parseInvoiceFromImage(base64Data, file.type);\`;


// I will just use sed or string replace based on file indexes.
// It's safer to grep the exact line numbers and slice.

