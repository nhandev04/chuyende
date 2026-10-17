import { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useData } from './contexts/DataContext';
import { useToast } from './components/Toast';
import { api } from './services/api';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { GlobalModals } from './components/modals/GlobalModals';
import { LoadingFallback } from './components/LoadingFallback';

// Code-split pages via React.lazy for high performance and fast initial load
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const History = lazy(() =>
  import('./pages/History').then((m) => ({ default: m.History }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);

type ActiveTab = 'dashboard' | 'history' | 'profile' | 'admin';

const getTabFromPath = (): ActiveTab => {
  const path = window.location.pathname.replace('/', '').toLowerCase();
  if (path === 'profile') return 'profile';
  if (path === 'history') return 'history';
  if (path === 'admin') return 'admin';
  return 'dashboard';
};

export function App() {
  const { isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const { invalidateData } = useData();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>(getTabFromPath);

  const navigateTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    const targetPath = tab === 'dashboard' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle Stripe Payment Redirect Verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      api.verifyStripeSession(sessionId).then((updatedUser) => {
        updateUser(updatedUser);
        invalidateData('all');
        window.history.replaceState({}, document.title, window.location.pathname);
        toast.success(
          `Your account has been upgraded to ${(updatedUser.plan || 'PLUS').toUpperCase()} tier.`,
          '🎉 Payment Verified'
        );
      }).catch((err: unknown) => {
        window.history.replaceState({}, document.title, window.location.pathname);
        const errMsg = err instanceof Error ? err.message : 'Unable to verify payment session.';
        toast.error(errMsg, 'Payment Failed');
      });
    } else if (paymentStatus === 'success' && !sessionId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.error('Invalid payment parameters. Security verification failed.', 'Payment Error');
    }
  }, [updateUser, invalidateData, toast]);

  const handleToggleAdmin = () => {
    navigateTab(activeTab === 'admin' ? 'dashboard' : 'admin');
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      } font-sans selection:bg-emerald-500 selection:text-slate-950`}
    >
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        onNavigateTab={navigateTab}
        onToggleAdmin={handleToggleAdmin}
        isAdminView={activeTab === 'admin'}
      />

      {/* Main Content Area with Suspense Code-splitting */}
      <main className="min-h-[calc(100vh-140px)] pb-28 pt-2 sm:pb-12 sm:pt-4 px-2 sm:px-4">
        <Suspense fallback={<LoadingFallback message="Loading view..." />}>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'history' && <History />}
          {activeTab === 'profile' && <ProfilePage />}
          {activeTab === 'admin' && <AdminPage />}
        </Suspense>
      </main>

      {/* Sticky Bottom Navigation (Mobile View) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={navigateTab}
        isAdmin={user?.role === 'admin'}
      />

      {/* Centralized Global Modals */}
      <GlobalModals />
    </div>
  );
}

export default App;
