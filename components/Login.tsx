import React, { useState } from 'react';
import { AppUser } from '../types';
import { getClient } from '../services/StorageService';

interface LoginProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const client = getClient();

    if (client) {
      try {
        if (isSignUp) {
          const { data, error } = await client.auth.signUp({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            onLogin({ id: data.user.id, username: email, password: '', role: 'user' });
          } else {
            setError('Check your email for the confirmation link.');
          }
        } else {
          const { data, error } = await client.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            onLogin({ id: data.user.id, username: email, password: '', role: 'user' });
          }
        }
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to local auth if Supabase is not configured
      const user = users.find(u => u.username.trim().toLowerCase() === email.trim().toLowerCase() && u.password.trim() === password.trim());
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password (Local Auth)');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create an account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getClient() ? 'Using Secure Supabase Auth' : 'Using Local Auth (Supabase not configured)'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label className="sr-only">Email / Username</label>
              <input
                type={getClient() ? "email" : "text"}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={getClient() ? "Email address" : "Username"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only">Password</label>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign up' : 'Sign in')}
            </button>
          </div>
          
          {getClient() && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
