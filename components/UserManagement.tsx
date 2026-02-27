import React, { useState } from 'react';
import { AppUser } from '../types';

interface UserManagementProps {
  users: AppUser[];
  onSaveUser: (user: AppUser) => void;
  onDeleteUser: (id: string) => void;
  currentUser: AppUser;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onSaveUser, onDeleteUser, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AppUser>({
    id: `user-${Date.now()}`,
    username: '',
    password: '',
    role: 'user'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUser({
      ...formData,
      username: formData.username.trim(),
      password: formData.password.trim()
    });
    setShowForm(false);
    setFormData({
      id: `user-${Date.now()}`,
      username: '',
      password: '',
      role: 'user'
    });
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8 text-center text-gray-500">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-xs md:text-sm text-gray-500">Manage access to the application</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New User
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900">Create New User</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                required 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                required 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value as 'admin' | 'user'})}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="flex-1 py-4 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition group">
                    <td className="px-6 py-5 font-bold text-gray-900">{user.username}</td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {user.id !== currentUser.id && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this user?')) {
                              onDeleteUser(user.id);
                            }
                          }}
                          className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                          title="Delete User"
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
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

export default UserManagement;
