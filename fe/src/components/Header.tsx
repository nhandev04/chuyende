import React from 'react';
import type { User, UserProfile } from '../types';
import { Sparkles, ShieldAlert, LogOut, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  profile: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onToggleAdmin: () => void;
  isAdminView: boolean;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onOpenProfile,
  onToggleAdmin,
  isAdminView,
  onLogout,
  theme,
  onToggleTheme
}) => {
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 shadow-lg transition-colors duration-300 ${
      isDark ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              HealthLens AI
            </h1>
            <p className={`text-[10px] font-medium -mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tracking & Calorie Vision
            </p>
          </div>
        </div>

        {/* User Stats & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dark / Light Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={isDark ? "Chuyển sang Giao diện Sáng (Light Mode)" : "Chuyển sang Giao diện Tối (Dark Mode)"}
            className={`p-2 rounded-xl border transition-all ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <>
              {/* Admin Toggle */}
              {user.role === 'admin' && (
                <button
                  onClick={onToggleAdmin}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    isAdminView 
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                      : isDark
                        ? 'bg-slate-800 text-amber-400 border border-amber-500/30 hover:bg-slate-700'
                        : 'bg-amber-50 text-amber-600 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAdminView ? 'User Mode' : 'Admin Hub'}</span>
                </button>
              )}

              {/* Profile button */}
              <button
                onClick={onOpenProfile}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[100px] truncate">{user.full_name || 'Hồ Sơ'}</span>
              </button>

              <button
                onClick={onLogout}
                title="Đăng xuất"
                className={`p-2 rounded-full transition-colors ${
                  isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              Đăng Nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
