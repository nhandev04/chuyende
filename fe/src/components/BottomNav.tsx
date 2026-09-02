import React from 'react';
import { Home, BarChart3, Camera, User as UserIcon, ShieldAlert } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'dashboard' | 'history' | 'profile' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'history' | 'profile' | 'admin') => void;
  onOpenScanner: () => void;
  isAdmin: boolean;
  theme: 'dark' | 'light';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  isAdmin,
  theme
}) => {
  const isDark = theme === 'dark';

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t py-2 px-4 shadow-2xl md:hidden transition-colors duration-300 ${
      isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white/90 border-slate-200 text-slate-500'
    }`}>
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center space-y-1 py-1 transition-all ${
            activeTab === 'dashboard' 
              ? 'text-emerald-500 scale-105 font-bold' 
              : isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* History Tab */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center space-y-1 py-1 transition-all ${
            activeTab === 'history' 
              ? 'text-emerald-500 scale-105 font-bold' 
              : isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Progress</span>
        </button>

        {/* Main Action floating Camera Button */}
        <div className="relative -top-5">
          <button
            onClick={onOpenScanner}
            className={`w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 active:scale-95 transition-all ${
              isDark ? 'ring-4 ring-slate-900' : 'ring-4 ring-slate-100'
            }`}
            aria-label="Scan Food"
          >
            <Camera className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Profile Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center space-y-1 py-1 transition-all ${
            activeTab === 'profile' 
              ? 'text-emerald-500 scale-105 font-bold' 
              : isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px]">Profile</span>
        </button>

        {/* Admin Tab if role is admin */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center space-y-1 py-1 transition-all ${
              activeTab === 'admin' 
                ? 'text-amber-500 scale-105 font-bold' 
                : isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px]">Admin</span>
          </button>
        )}

      </div>
    </nav>
  );
};
