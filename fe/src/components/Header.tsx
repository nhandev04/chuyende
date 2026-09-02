import React from 'react';
import type { User, UserProfile } from '../types';
import { Sparkles, ShieldAlert, LogOut, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  profile: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenSubscription: () => void;
  onOpenRAGMealPlan?: () => void;
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
  onOpenSubscription,
  onOpenRAGMealPlan,
  onToggleAdmin,
  isAdminView,
  onLogout,
  theme,
  onToggleTheme
}) => {

  const isDark = theme === 'dark';
  const planName = user?.role === 'admin' ? 'ADMIN' : (user?.plan || 'STANDARD').toUpperCase();

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
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
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
              {/* Plan Badge / Upgrade Trigger */}
              <button
                onClick={onOpenSubscription}
                className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 border transition-all ${
                  user.role === 'admin'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : user.plan === 'pro'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-sm'
                    : user.plan === 'plus'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-800 border-slate-400 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>{planName}</span>

                {user.plan !== 'pro' && user.role !== 'admin' && (
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-bold">Upgrade</span>
                )}
              </button>



              {/* RAG AI Smart Meal Plan Button */}

              {onOpenRAGMealPlan && (
                <button
                  onClick={onOpenRAGMealPlan}
                  title="Open RAG AI Smart Meal Planner"
                  className="px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 border bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:scale-105 transition shadow-sm"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">RAG Meal AI</span>
                </button>
              )}


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
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || "Avatar"}
                    className="w-6 h-6 rounded-full object-cover border border-emerald-500 shadow-sm"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">
                    {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="max-w-[100px] truncate">{user.full_name || 'Profile'}</span>
              </button>


              <button
                onClick={onLogout}
                title="Logout"
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
              Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

