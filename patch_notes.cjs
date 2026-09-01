const fs = require('fs');
let content = fs.readFileSync('components/Notes.tsx', 'utf-8');

// Fix Save bug
content = content.replace(
  "if (!title.trim() && currentType === 'daddys_note') return;",
  "if (!title.trim() && !currentDocumentUrl && currentType === 'daddys_note') return;"
);

// Add showShareLink state
if (!content.includes('const [showShareLink, setShowShareLink]')) {
  content = content.replace(
    "const [currentAnnotations, setCurrentAnnotations] = useState<any[]>([]);",
    "const [currentAnnotations, setCurrentAnnotations] = useState<any[]>([]);\n  const [showShareLink, setShowShareLink] = useState<string | null>(null);"
  );
}

// Fix Share button
const shareBtnCode = `<button 
                    onClick={() => {
                      const url = window.location.origin + window.location.pathname + '?sharedNote=' + selectedNote.id;
                      try {
                        navigator.clipboard.writeText(url).then(() => {
                          setShowShareLink(url);
                        }).catch(() => {
                          setShowShareLink(url);
                        });
                      } catch(e) {
                        setShowShareLink(url);
                      }
                    }}
                    className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 shadow-sm"
                  >`;

content = content.replace(/<button \s*onClick=\{\(\) => \{\s*const url = window\.location\.origin[^}]*\}\}\s*className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 shadow-sm"\s*>/g, shareBtnCode);


// Add Share modal
const shareModal = `
      {showShareLink && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Share Daddy's Note</h3>
            <p className="text-sm text-gray-500 mb-4">Anyone with this link can view and annotate this note.</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={showShareLink} 
                className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none"
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button 
                onClick={() => setShowShareLink(null)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

if (!content.includes('Share Daddy\'s Note')) {
  content = content.replace(/    <\/div>\n  \);\n\};\n\nexport default Notes;/g, shareModal + "\n\nexport default Notes;");
}

fs.writeFileSync('components/Notes.tsx', content);
