import React, { useState, useEffect } from 'react';
import { DeletedItem, TrashStorageService } from '../services/TrashStorageService';

interface TrashViewProps {
  onRestore: (item: DeletedItem) => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ onRestore }) => {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await TrashStorageService.loadAll();
      setItems(data);
    } catch (e) {
      console.error("Failed to load trash items", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (item: DeletedItem) => {
    try {
      await TrashStorageService.deletePermanent(item.id);
      onRestore(item);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (e) {
      console.error("Failed to restore item", e);
      alert("Failed to restore item.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      try {
        await TrashStorageService.deletePermanent(id);
        setItems(prev => prev.filter(i => i.id !== id));
      } catch (e) {
        console.error("Failed to delete", e);
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (items.length === 0) return;
    if (confirm("Are you sure you want to empty the trash? All items will be deleted.")) {
      try {
        await TrashStorageService.clearTrash();
        setItems([]);
      } catch (e) {
        console.error("Failed to empty trash", e);
      }
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      invoice: 'Invoice',
      quotation: 'Quotation',
      delivery_challan: 'Delivery Challan',
      purchase: 'Purchase',
      client: 'Client',
      lead: 'Lead'
    };
    return map[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Trash
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Items in trash are permanently deleted after 30 days.</p>
        </div>
        {items.length > 0 && (
          <button 
            onClick={handleEmptyTrash}
            className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-50 transition shadow-sm"
          >
            Empty Trash
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Trash is empty</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">No items found in the trash.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Summary</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Deleted Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700">
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{item.summary}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">
                      {new Date(item.deletedAt).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleRestore(item)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition flex items-center gap-1.5"
                          title="Restore"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                          Restore
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
