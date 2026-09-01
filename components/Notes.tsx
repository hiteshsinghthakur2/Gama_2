import React, { useState } from 'react';
import { Note } from '../types';
import DaddysNoteEditor from './DaddysNoteEditor';

interface NotesProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

const Notes: React.FC<NotesProps> = ({ notes, setNotes }) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentType, setCurrentType] = useState<'text' | 'daddys_note'>('text');
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState<string>('');
  const [currentAnnotations, setCurrentAnnotations] = useState<any[]>([]);
  const [showShareLink, setShowShareLink] = useState<string | null>(null);

  const handleCreate = (type: 'text' | 'daddys_note' = 'text') => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setIsEditing(true);
    setCurrentType(type);
    setCurrentDocumentUrl('');
    setCurrentAnnotations([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentDocumentUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim() && currentType === 'text') return;
    if (!title.trim() && !currentDocumentUrl && currentType === 'daddys_note') return;

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
        id: `note-${Date.now()}`,
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
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this note?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setIsEditing(false);
      }
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      <div className="w-1/3 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-gray-800">My Notes</h2>
            <div className="flex gap-2 relative group">
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
            </div>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center text-gray-400 p-4 text-sm">No notes found</div>
          ) : (
            filteredNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  setTitle(note.title);
                  setContent(note.content || '');
                  setCurrentType(note.type || 'text');
                  setCurrentDocumentUrl(note.documentUrl || '');
                  setCurrentAnnotations(note.annotations || []);
                  setIsEditing(false);
                }}
                className={`p-3 rounded-lg cursor-pointer transition group relative ${selectedNote?.id === note.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}
              >
                <h3 className={`font-semibold text-sm truncate pr-8 ${selectedNote?.id === note.id ? 'text-indigo-900' : 'text-gray-800'}`}>
                  {note.title}
                  {note.type === 'daddys_note' && (
                    <span className="ml-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded-full uppercase tracking-wider font-bold">Daddy's</span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-1">{note.type === 'daddys_note' ? 'Document attached' : (note.content || 'No content')}</p>
                <div className="text-[10px] text-gray-400 mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
                
                <button
                  onClick={(e) => handleDelete(note.id, e)}
                  className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {isEditing ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={currentType === 'daddys_note' ? "Daddy's Note Title" : "Note Title"}
                className="text-xl font-bold bg-transparent outline-none flex-1 mr-4 focus:border-b-2 focus:border-indigo-500 transition-colors"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    if (selectedNote) {
                      setTitle(selectedNote.title);
                      setContent(selectedNote.content);
                      setCurrentType(selectedNote.type || 'text');
                      setCurrentDocumentUrl(selectedNote.documentUrl || '');
                      setCurrentAnnotations(selectedNote.annotations || []);
                    } else {
                      setTitle('');
                      setContent('');
                    }
                  }}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
                >
                  Save Note
                </button>
              </div>
            </div>
            
            {currentType === 'text' ? (
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
            )}
          </div>
        ) : selectedNote ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedNote.title}
                  {selectedNote.type === 'daddys_note' && (
                    <span className="ml-3 inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[12px] rounded-full uppercase tracking-wider font-bold align-middle">Daddy's Note</span>
                  )}
                </h2>
                <div className="text-xs text-gray-400 mt-2">
                  Last edited: {new Date(selectedNote.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                {selectedNote.type === 'daddys_note' && (
                  <button 
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
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    Share Link
                  </button>
                )}
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
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
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
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-sm">Select a note or create a new one</p>
            <button 
              onClick={() => handleCreate('text')}
              className="mt-6 px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition shadow-sm"
            >
              Create First Note
            </button>
          </div>
        )}
      </div>

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


export default Notes;
