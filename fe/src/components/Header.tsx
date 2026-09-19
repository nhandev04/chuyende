import React, { useState, useRef, useEffect } from 'react';
import type { User, UserProfile } from '../types';
import { Sparkles, ShieldAlert, LogOut, Sun, Moon, Clock, User as UserIcon, Crown, ChevronDown } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  profile: UserProfile | null;
  activeTab?: 'dashboard' | 'history' | 'profile' | 'admin';
  onNavigateTab?: (tab: 'dashboard' | 'history' | 'profile' | 'admin') => void;
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
  activeTab = 'dashboard',
  onNavigateTab,
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const planName = user?.role === 'admin' ? 'ADMIN' : (user?.plan || 'STANDARD').toUpperCase();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoDashboard = () => {
    if (onNavigateTab) {
      onNavigateTab('dashboard');
    } else {
      window.location.reload();
    }
  };

  const handleGoHistory = () => {
    if (onNavigateTab) {
      onNavigateTab('history');
    }
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg transition-colors duration-300 ${isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo -> Navigates to Dashboard */}
        <div className="flex items-center space-x-2 cursor-pointer shrink-0 hover:opacity-95 transition" onClick={handleGoDashboard} title="Go to Dashboard">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              HealthLens AI
            </h1>
            <p className={`text-[10px] font-medium -mt-1 hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tracking & Calorie Vision
            </p>
          </div>
        </div>

        {/* Right Controls: Theme, History Clock Icon, and Clean Profile Dropdown */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`p-2 rounded-xl border transition-all ${isDark
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <>
              {/* History Clock Icon Button */}
              <button
                onClick={handleGoHistory}
                title="View Meal Log History & Weight Trends"
                className={`p-2 rounded-xl border transition-all flex items-center justify-center ${activeTab === 'history'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-emerald-400 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-emerald-600 hover:bg-slate-200'
                  }`}
              >
                <Clock className="w-4 h-4 stroke-[2.2]" />
              </button>

              {/* Profile Dropdown Menu Trigger */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border text-xs font-semibold transition-all ${isDark
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
                  <span className="hidden sm:inline-block max-w-[90px] truncate">{user.full_name || 'Account'}</span>

                  {/* Plan Badge */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase ${user.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : user.plan === 'pro'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                    {planName}
                  </span>

                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`} />
                </button>

                {/* Dropdown Popover Menu */}
                {isDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 backdrop-blur-xl animate-fadeIn ${isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
                    }`}>
                    {/* User Summary Header */}
                    <div className="p-3 border-b border-slate-800 mb-1 flex items-center space-x-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-emerald-500" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-sm">
                          {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="font-extrabold text-sm truncate">{user.full_name || 'User'}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1 text-xs">
                      {/* Personal Profile */}
                      <button
                        onClick={() => { setIsDropdownOpen(false); onOpenProfile(); }}
                        className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 font-semibold transition"
                      >
                        <UserIcon className="w-4 h-4 text-emerald-400" />
                        <span>Personal Health Profile</span>
                      </button>

                      {/* AI Meal Planner */}
                      {onOpenRAGMealPlan && (
                        <button
                          onClick={() => { setIsDropdownOpen(false); onOpenRAGMealPlan(); }}
                          className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-teal-500/10 hover:text-teal-400 font-semibold transition"
                        >
                          <Sparkles className="w-4 h-4 text-teal-400" />
                          <span>AI Smart Meal Planner</span>
                        </button>
                      )}

                      {/* Upgrade Subscription */}
                      <button
                        onClick={() => { setIsDropdownOpen(false); onOpenSubscription(); }}
                        className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-400 font-semibold transition"
                      >
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Upgrade Subscription ({planName})</span>
                      </button>

                      {/* Admin Mode Toggle */}
                      {user.role === 'admin' && (
                        <button
                          onClick={() => { setIsDropdownOpen(false); onToggleAdmin(); }}
                          className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-amber-500/10 hover:text-amber-400 font-semibold transition"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          <span>{isAdminView ? 'Switch to User View' : 'Admin Hub Portal'}</span>
                        </button>
                      )}

                      <div className="border-t border-slate-800 my-1 pt-1" />

                      {/* Logout */}
                      <button
                        onClick={() => { setIsDropdownOpen(false); onLogout(); }}
                        className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 font-semibold transition"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Logout Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
