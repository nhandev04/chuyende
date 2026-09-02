import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
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

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('health_app_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [user, setUser] = useState<User | null>(() => api.getStoredUser());

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile' | 'admin'>('dashboard');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

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



  const handleAuthSuccess = async (authUser: User, isNewRegistration: boolean = false) => {
    setUser(authUser);
    api.setStoredUser(authUser, authUser.access_token);
    
    const p = await api.getProfile(authUser.user_id);
    setProfile(p);

    if (authUser.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('dashboard');
    }

    if (isNewRegistration) {
      setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 300);
    }
  };

  const handleLogout = () => {
    api.setStoredUser(null);
    setUser(null);
    setProfile(null);
    setActiveTab('dashboard');
  };

  const handleToggleAdmin = () => {
    if (activeTab === 'admin') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('admin');
    }
  };

  const handleFoodLogged = () => {
    setActiveTab('dashboard');
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
        onOpenProfile={() => setActiveTab('profile')}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
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
        setActiveTab={setActiveTab}
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
        onFoodLogged={handleFoodLogged}
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

    </div>
  );
}

export default App;

