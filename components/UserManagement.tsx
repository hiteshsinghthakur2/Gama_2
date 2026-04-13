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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AppUser>({
    id: `user-${Date.now()}`,
    username: '',
    password: '',
    role: 'user'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedUsername = formData.username.trim();
    const trimmedPassword = formData.password.trim();
    
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }
    
    // Check for duplicate username
    const existingUser = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.id !== formData.id);
    if (existingUser) {
      setError('A user with this username already exists.');
      return;
    }

    onSaveUser({
      ...formData,
      username: trimmedUsername,
      password: trimmedPassword
    });
    
    setShowForm(false);
    setIsEditing(false);
    setFormData({
      id: `user-${Date.now()}`,
      username: '',
      password: '',
      role: 'user'
    });
  };

  const handleEdit = (user: AppUser) => {
    setFormData(user);
    setIsEditing(true);
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setError('');
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
            <h2 className="text-xl font-black text-gray-900">{isEditing ? 'Edit User' : 'Create New User'}</h2>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 transition">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}
          
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
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
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
                onClick={handleCancel}
                className="flex-1 py-4 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              >
                {isEditing ? 'Save Changes' : 'Create User'}
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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="p-2 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition"
                          title="Edit User"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
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

export default UserManagement;
