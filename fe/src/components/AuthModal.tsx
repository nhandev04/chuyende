import React, { useState } from 'react';
import { api } from '../services/api';
import type { User } from '../types';
import { X, Sparkles, Mail, Lock, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, isNewRegistration?: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
        onSuccess(user, true); // True triggers onboarding modal for body stats
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'user' | 'admin') => {
    const demoUser: User = {
      user_id: role === 'admin' ? 99 : 1,
      email: role === 'admin' ? 'admin@uit.edu.vn' : 'demouser@uit.edu.vn',
      full_name: role === 'admin' ? 'Quản Trị Viên (Admin)' : 'Nguyễn Trọng Nhân (User)',
      role: role
    };
    onSuccess(demoUser, false);
    onClose();
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
          <h2 className="text-xl font-bold">Chào mừng tới HealthLens AI</h2>
          <p className="text-xs text-slate-400 mt-1">Định lượng Calorie & Quản lý sức khỏe thông minh</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-800/60 p-1 rounded-xl mb-6">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'register' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng Ký Mới
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
              <label className="block text-xs text-slate-400 mb-1">Họ & Tên</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                placeholder="user@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Mật khẩu</label>
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
            {loading ? 'Đang xử lý...' : tab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản & Tiếp Tục →'}
          </button>
        </form>

        {/* Quick Demo Login Shortcut */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500 mb-3">Dùng thử nhanh không cần mật khẩu:</p>
          <div className="flex space-x-2">
            <button
              onClick={() => handleQuickDemo('user')}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs py-2 rounded-xl font-medium border border-emerald-500/30"
            >
              🚀 User Demo
            </button>
            <button
              onClick={() => handleQuickDemo('admin')}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs py-2 rounded-xl font-medium border border-amber-500/30"
            >
              ⚡ Admin Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
