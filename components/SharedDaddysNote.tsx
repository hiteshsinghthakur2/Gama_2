import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import DaddysNoteEditor, { Annotation } from './DaddysNoteEditor';
import { Note } from '../types';

const STORAGE_KEYS = { NOTES: 'bos_cloud_notes' };

const SharedDaddysNote: React.FC<{ noteId: string }> = ({ noteId }) => {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      const notesArray = await StorageService.load(STORAGE_KEYS.NOTES, []);
      const foundNote = notesArray.find((n: Note) => n.id === noteId);
      if (foundNote) {
        setNote(foundNote);
      }
      setLoading(false);
    };
    fetchNote();
  }, [noteId]);

  const handleAnnotationsChange = async (annotations: Annotation[]) => {
    if (!note) return;
    
    // Optimistic update
    const updatedNote = { ...note, annotations };
    setNote(updatedNote);
    
    // Save to cloud
    setSaving(true);
    const notesArray = await StorageService.load(STORAGE_KEYS.NOTES, []);
    const updatedNotesArray = notesArray.map((n: Note) => n.id === noteId ? updatedNote : n);
    await StorageService.save(STORAGE_KEYS.NOTES, updatedNotesArray);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!note || note.type !== 'daddys_note') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 max-w-md">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Note Not Found</h1>
          <p className="text-gray-500 mb-6">This note doesn't exist, was deleted, or is not a shared Daddy's Note.</p>
          <a href="/" className="inline-block px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold shadow-inner">
            D
          </div>
          <div>
            <h1 className="font-bold text-gray-900">{note.title}</h1>
            <p className="text-xs text-gray-500">Daddy's Note - Collaborative View</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
            {saving ? (
              <><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Saving...</>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Synced</>
            )}
          </span>
          <a href="/" className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-indigo-100 shadow-sm">
            Open App
          </a>
        </div>
      </header>
      <main className="flex-1 overflow-hidden p-6">
        <div className="w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {note.documentUrl ? (
            <DaddysNoteEditor 
              documentUrl={note.documentUrl} 
              annotations={note.annotations || []} 
              onChange={handleAnnotationsChange} 
              readOnly={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No document uploaded for this note.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SharedDaddysNote;
