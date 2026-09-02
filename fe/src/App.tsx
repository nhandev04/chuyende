import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import type { User, UserProfile } from './types';

import { api } from './services/api';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { FoodScannerModal } from './components/FoodScannerModal';
import { WeightLogModal } from './components/WeightLogModal';

import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

import { SubscriptionModal } from './components/SubscriptionModal';
import { RAGMealPlanModal } from './components/RAGMealPlanModal';


function useClerkSafe() {
  try {
    return useClerk();
  } catch {
    return null;
  }
}

function ClerkUserSync({ onSynced }: { onSynced: (user: User) => void }) {

  const { isSignedIn, user: clerkUser } = useUser();
  const [syncedId, setSyncedId] = useState<string | null>(null);

  useEffect(() => {
    async function sync() {
      if (isSignedIn && clerkUser && clerkUser.id !== syncedId) {
        try {
          const email = clerkUser.primaryEmailAddress?.emailAddress || `${clerkUser.id}@clerk.user`;
          const fullName = clerkUser.fullName || clerkUser.firstName || '';
          const backendUser = await api.clerkSync(clerkUser.id, email, fullName);
          setSyncedId(clerkUser.id);
          onSynced(backendUser);
        } catch (err) {
          console.warn("Clerk sync notice:", err);
        }
      }
    }
    sync();
  }, [isSignedIn, clerkUser, syncedId, onSynced]);

  return null;
}

const getTabFromPath = (): 'dashboard' | 'history' | 'profile' | 'admin' => {
  const path = window.location.pathname.replace('/', '').toLowerCase();
  if (path === 'profile') return 'profile';
  if (path === 'history') return 'history';
  if (path === 'admin') return 'admin';
  return 'dashboard';
};

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('health_app_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [user, setUser] = useState<User | null>(() => api.getStoredUser());

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile' | 'admin'>(getTabFromPath);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const navigateTab = (tab: 'dashboard' | 'history' | 'profile' | 'admin') => {
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

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isRAGModalOpen, setIsRAGModalOpen] = useState(false);


  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('health_app_theme', nextTheme);
  };

  useEffect(() => {
    async function loadUserProfile() {
      if (user) {
        const p = await api.getProfile(user.user_id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    }
    loadUserProfile();
  }, [user, refreshKey]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      api.verifyStripeSession(sessionId).then((updatedUser) => {
        setUser(updatedUser);
        setRefreshKey(prev => prev + 1);
        window.history.replaceState({}, document.title, window.location.pathname);
        alert(`🎉 Payment Verified! Your account has been upgraded to ${(updatedUser.plan || 'PLUS').toUpperCase()} tier.`);
      }).catch((err) => {
        window.history.replaceState({}, document.title, window.location.pathname);
        alert(err.message || "❌ Unable to verify payment session. Security verification failed.");
      });
    } else if (paymentStatus === 'success' && !sessionId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      alert("❌ Invalid payment parameters. Security verification failed.");
    }
  }, []);





  const handleAuthSuccess = async (authUser: User, isNewRegistration: boolean = false) => {
    setUser(authUser);
    api.setStoredUser(authUser, authUser.access_token);
    
    const p = await api.getProfile(authUser.user_id);
    setProfile(p);

    if (authUser.role === 'admin') {
      navigateTab('admin');
    } else {
      navigateTab('dashboard');
    }

    if (isNewRegistration) {
      setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 300);
    }
  };

  const clerk = useClerkSafe();

  const handleLogout = async () => {
    api.setStoredUser(null);
    setUser(null);
    setProfile(null);

    if (clerk && clerk.signOut) {
      try {
        await clerk.signOut();
      } catch (err) {
        console.warn("Clerk signout notice:", err);
      }
    }

    localStorage.removeItem("health_app_user");
    localStorage.removeItem("health_app_token");
    sessionStorage.clear();

    navigateTab('dashboard');
  };


  const handleToggleAdmin = () => {
    if (activeTab === 'admin') {
      navigateTab('dashboard');
    } else {
      navigateTab('admin');
    }
  };

  const handleFoodLogged = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handlePlanUpgraded = (updatedUser: User) => {
    setUser(updatedUser);
    setRefreshKey(prev => prev + 1);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } font-sans selection:bg-emerald-500 selection:text-slate-950`}>
      
      <ClerkUserSync onSynced={(syncedUser) => handleAuthSuccess(syncedUser, false)} />

      {/* Header Bar */}

      <Header
        user={user}
        profile={profile}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => navigateTab('profile')}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenRAGMealPlan={() => setIsRAGModalOpen(true)}
        onToggleAdmin={handleToggleAdmin}

        isAdminView={activeTab === 'admin'}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="min-h-[calc(100vh-140px)]">
        {activeTab === 'dashboard' && (
          <Dashboard
            user={user}
            profile={profile}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenWeightModal={() => setIsWeightModalOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            theme={theme}
            refreshKey={refreshKey}
          />
        )}

        {activeTab === 'history' && (
          <History userId={user?.user_id || 0} theme={theme} />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            user={user}
            profile={profile}
            onUpdateProfile={(updated) => setProfile(updated)}
            onLogout={handleLogout}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            theme={theme}
          />
        )}


        {activeTab === 'admin' && (
          <AdminPage theme={theme} />
        )}
      </main>

      {/* Sticky Bottom Navigation (Mobile View) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={navigateTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        isAdmin={user?.role === 'admin'}
        theme={theme}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u, isNew) => handleAuthSuccess(u, isNew)}
      />

      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        currentUser={user}
        onPlanUpgraded={handlePlanUpgraded}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        userId={user?.user_id || 1}
        user={user}
        currentProfile={profile}
        onSaveProfile={(p) => {
          setProfile(p);
          setRefreshKey(prev => prev + 1);
        }}
        onOpenSubscription={() => {
          setIsOnboardingOpen(false);
          setIsSubscriptionOpen(true);
        }}
      />

      <FoodScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        userId={user?.user_id || 1}
        user={user}
        onFoodLogged={handleFoodLogged}
        onOpenSubscription={() => {
          setIsScannerOpen(false);
          setIsSubscriptionOpen(true);
        }}
      />

      <WeightLogModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        userId={user?.user_id || 1}
        currentWeight={profile?.current_weight_kg || 65}
        onWeightRecorded={(w) => {
          if (profile) {
            setProfile({ ...profile, current_weight_kg: w });
          }
          setRefreshKey(prev => prev + 1);
        }}
      />

      {isRAGModalOpen && (

        <RAGMealPlanModal
          user={user}
          onClose={() => setIsRAGModalOpen(false)}
          onOpenSubscription={() => {
            setIsRAGModalOpen(false);
            setIsSubscriptionOpen(true);
          }}
          onFoodLogged={handleFoodLogged}
          theme={theme}
        />
      )}


    </div>
  );
}

export default App;
