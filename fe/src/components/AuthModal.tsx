import React, { useState } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { api } from '../services/api';
import type { User } from '../types';
import { X, Sparkles, Mail, Lock, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, isNewRegistration?: boolean) => void;
}

function useClerkSafe() {
  try {
    return useClerk();
  } catch {
    return null;
  }
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const clerk = useClerkSafe();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        const user = await api.login(email, password);
        onSuccess(user, false);
      } else {
        const user = await api.register(email, password, fullName);
        onSuccess(user, true);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };




  const handleClerkGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      if (clerk && clerk.openSignIn) {
        if (clerk.session) {
          try {
            await clerk.signOut();
          } catch {
            // Ignore signout error if session was already dead
          }
        }
        clerk.openSignIn({});
      } else {
        throw new Error("⚠️ VITE_CLERK_PUBLISHABLE_KEY is not configured in fe/.env. Please add VITE_CLERK_PUBLISHABLE_KEY=pk_test_... to run live Clerk Google OAuth.");
      }
    } catch (err: any) {
      setError(err.message || "Google Sign-In via Clerk failed.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-7 h-7 text-slate-950" />
          </div>
          <h2 className="text-xl font-bold">Welcome to HealthLens AI</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in with Clerk OAuth or System Admin Account</p>
        </div>

        {/* Clerk Google Login Button */}
        <button
          onClick={handleClerkGoogleLogin}
          disabled={loading}
          className="w-full mb-4 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-3 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Sign in with Google (Clerk Auth)
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-800"></div>
          <span className="px-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Or System Account</span>
          <div className="flex-1 border-t border-slate-800"></div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-800/60 p-1 rounded-xl mb-6">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In / Admin
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'register' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Nguyen Van A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                placeholder="admin@uit.edu.vn or personal email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity"
          >
            {loading ? 'Processing...' : tab === 'login' ? 'System Sign In' : 'Create Account & Continue →'}
          </button>
        </form>
      </div>
    </div>
  );
};

