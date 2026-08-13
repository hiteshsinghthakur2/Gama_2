const fs = require('fs');
let content = fs.readFileSync('components/Notes.tsx', 'utf-8');

if (!content.includes('import DaddysNoteEditor')) {
  content = content.replace(/import \{ Note \} from '\.\.\/types';/, "import { Note } from '../types';\nimport DaddysNoteEditor from './DaddysNoteEditor';");
}

const handleCreateReplacement = `  const handleCreate = (type: 'text' | 'daddys_note' = 'text') => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setIsEditing(true);
    setCurrentType(type);
    setCurrentDocumentUrl('');
    setCurrentAnnotations([]);
  };

  const [currentType, setCurrentType] = useState<'text' | 'daddys_note'>('text');
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState<string>('');
  const [currentAnnotations, setCurrentAnnotations] = useState<any[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentDocumentUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };`;

if (!content.includes('setCurrentType')) {
  content = content.replace(/  const handleCreate = \(\) => \{[\s\S]*?setIsEditing\(true\);\n  \};/, handleCreateReplacement);
}

const handleSaveReplacement = `  const handleSave = () => {
    if (!title.trim() && !content.trim() && currentType === 'text') return;
    if (!title.trim() && currentType === 'daddys_note') return;

    const now = new Date().toISOString();
    if (selectedNote) {
      setNotes(prev => prev.map(n => 
        n.id === selectedNote.id 
          ? { 
              ...n, 
              title: title.trim() || 'Untitled', 
              content, 
              updatedAt: now,
              type: currentType,
              documentUrl: currentDocumentUrl,
              annotations: currentAnnotations
            } 
          : n
      ));
    } else {
      const newNote: Note = {
        id: \`note-\${Date.now()}\`,
        title: title.trim() || 'Untitled',
        content,
        createdAt: now,
        updatedAt: now,
        type: currentType,
        documentUrl: currentDocumentUrl,
        annotations: currentAnnotations
      };
      setNotes(prev => [newNote, ...prev]);
    }
    setIsEditing(false);
    setSelectedNote(null);
  };`;

if (content.includes('const handleSave = () => {') && !content.includes('type: currentType,')) {
  content = content.replace(/  const handleSave = \(\) => \{[\s\S]*?setSelectedNote\(null\);\n  \};/, handleSaveReplacement);
}

const selectionCode = `                onClick={() => {
                  setSelectedNote(note);
                  setTitle(note.title);
                  setContent(note.content || '');
                  setCurrentType(note.type || 'text');
                  setCurrentDocumentUrl(note.documentUrl || '');
                  setCurrentAnnotations(note.annotations || []);
                  setIsEditing(false);
                }}`;
if (!content.includes('setCurrentType(note.type || \'text\');')) {
  content = content.replace(/                onClick=\{\(\) => \{[\s\S]*?setIsEditing\(false\);\n                \}\}/, selectionCode);
}

const buttonsUI = `            <div className="flex gap-2 relative group">
              <button 
                onClick={() => handleCreate('text')}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm text-sm"
              >
                + Note
              </button>
              <button 
                onClick={() => handleCreate('daddys_note')}
                className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition shadow-sm text-sm"
              >
                + Daddy's Note
              </button>
            </div>`;

if (!content.includes('Daddy\'s Note')) {
  content = content.replace(/            <button [\s\S]*?<\/button>/, buttonsUI);
}

const editorBody = `            {currentType === 'text' ? (
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your note here... (Invoice references, reminders, etc.)"
                className="flex-1 p-6 resize-none outline-none text-gray-700 leading-relaxed"
              />
            ) : (
              <div className="flex-1 flex flex-col p-4 bg-gray-50 overflow-hidden">
                {!currentDocumentUrl ? (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white m-4">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <label className="cursor-pointer bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm">
                      Upload Document/Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden rounded-xl border border-gray-200">
                    <DaddysNoteEditor 
                      documentUrl={currentDocumentUrl} 
                      annotations={currentAnnotations} 
                      onChange={setCurrentAnnotations} 
                    />
                  </div>
                )}
              </div>
            )}`;

if (!content.includes('Upload Document/Image')) {
  content = content.replace(/            <textarea [\s\S]*?\/>/, editorBody);
}

const viewerBody = `              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const url = window.location.origin + window.location.pathname + '?sharedNote=' + selectedNote.id;
                    navigator.clipboard.writeText(url);
                    alert('Share link copied to clipboard!');
                  }}
                  className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Share Link
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(true);
                    setCurrentType(selectedNote.type || 'text');
                    setCurrentDocumentUrl(selectedNote.documentUrl || '');
                    setCurrentAnnotations(selectedNote.annotations || []);
                  }}
                  className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit
                </button>
              </div>`;

if (!content.includes('Share Link')) {
  content = content.replace(/              <button [\s\S]*?Edit\n              <\/button>/, viewerBody);
}

const viewerContent = `            <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
              {selectedNote.type === 'daddys_note' && selectedNote.documentUrl ? (
                <div className="flex-1 p-4">
                  <div className="w-full h-full rounded-xl border border-gray-200 overflow-hidden">
                    <DaddysNoteEditor 
                      documentUrl={selectedNote.documentUrl} 
                      annotations={selectedNote.annotations || []} 
                      onChange={() => {}} 
                      readOnly={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-full">
                    {selectedNote.content || <span className="text-gray-400 italic">No content</span>}
                  </div>
                </div>
              )}
            </div>`;

if (!content.includes('selectedNote.type === \'daddys_note\'')) {
  content = content.replace(/            <div className="flex-1 p-6 overflow-y-auto">[\s\S]*?<\/div>/, viewerContent);
}

const badgeUI = `                <h3 className={\`font-semibold text-sm truncate pr-8 \${selectedNote?.id === note.id ? 'text-indigo-900' : 'text-gray-800'}\`}>
                  {note.title}
                  {note.type === 'daddys_note' && (
                    <span className="ml-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded-full uppercase tracking-wider font-bold">Daddy's</span>
                  )}
                </h3>`;

if (!content.includes("Daddy's")) {
  content = content.replace(/                <h3 className=\{`font-semibold text-sm truncate pr-8 \$\{selectedNote\?\.id === note\.id \? 'text-indigo-900' : 'text-gray-800'\}`\}>\{note\.title\}<\/h3>/, badgeUI);
}


fs.writeFileSync('components/Notes.tsx', content);
console.log('Patched Notes.tsx');
