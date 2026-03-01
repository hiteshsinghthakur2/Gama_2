import React, { useState } from 'react';
import { AppUser } from '../types';

interface UserProfileProps {
  currentUser: AppUser;
  onUpdateUser: (user: AppUser) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ currentUser, onUpdateUser }) => {
  const [username, setUsername] = useState(currentUser.username);
  const [password, setPassword] = useState(currentUser.password);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      username: username.trim(),
      password: password.trim()
    });
    setIsEditing(false);
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal account settings</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentUser.username}</h2>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${currentUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {currentUser.role.toUpperCase()}
              </span>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition border border-gray-200"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="p-6 md:p-8">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setUsername(currentUser.username);
                    setPassword(currentUser.password);
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Username</label>
                <p className="text-gray-900 font-medium">{currentUser.username}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Password</label>
                <p className="text-gray-900 font-medium">••••••••</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Account Role</label>
                <p className="text-gray-900 font-medium capitalize">{currentUser.role}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
