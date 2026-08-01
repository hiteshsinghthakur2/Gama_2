const fs = require('fs');
let content = fs.readFileSync('components/Settings.tsx', 'utf-8');

const refSearch = `  const fileInputRef = useRef<HTMLInputElement>(null);`;
const refReplace = `  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);`;
content = content.replace(refSearch, refReplace);

const handlerSearch = `  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {`;
const handlerReplace = `  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, signatureUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {`;
content = content.replace(handlerSearch, handlerReplace);

const uiSearch = `          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center p-2 bg-gray-50 overflow-hidden relative group">`;
const uiReplace = `          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center p-2 bg-gray-50 overflow-hidden relative group">`;
content = content.replace(uiSearch, uiReplace);

const afterLogoSearch = `              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition">Select Image</button>
            </div>
          </div>`;
const afterLogoReplace = `              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition">Select Image</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 border-t border-gray-100 md:border-t-0 md:border-l md:pl-6 pt-6 md:pt-0">
            <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center p-2 bg-gray-50 overflow-hidden relative group">
              {formData.signatureUrl ? (
                <img src={formData.signatureUrl} className="max-h-full max-w-full object-contain" alt="Signature Preview" />
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">No Sign</p>
                </div>
              )}
              <div onClick={() => signatureInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <span className="text-white text-xs font-bold uppercase tracking-widest">Change</span>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <input type="file" ref={signatureInputRef} onChange={handleSignatureUpload} className="hidden" accept="image/*" />
              <p className="text-sm font-bold text-gray-700">Digital Signature</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Visible on all documents.</p>
              <button type="button" onClick={() => signatureInputRef.current?.click()} className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition">Select Signature</button>
            </div>
          </div>
          </div>`;
content = content.replace(afterLogoSearch, afterLogoReplace);

fs.writeFileSync('components/Settings.tsx', content);
console.log('Patched Settings.tsx');
