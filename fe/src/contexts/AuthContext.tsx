import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { api } from '../services/api';
import type { User, UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (email: string, pass: string, fullName?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  updateProfileState: (profile: UserProfile) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useClerkSafe() {
  try {
    return useClerk();
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => api.getStoredUser());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [syncedClerkId, setSyncedClerkId] = useState<string | null>(null);

  const clerk = useClerkSafe();
  const { isSignedIn, user: clerkUser } = useUser();

  const loadUserProfile = useCallback(async (userId: number) => {
    setIsLoadingProfile(true);
    try {
      const p = await api.getProfile(userId);
      setProfile(p);
    } catch (err) {
      console.warn('Failed to load profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.user_id) {
      await loadUserProfile(user.user_id);
    }
  }, [user?.user_id, loadUserProfile]);

  // Load user profile on mount or user change
  useEffect(() => {
    if (user?.user_id) {
      loadUserProfile(user.user_id);
    } else {
      setProfile(null);
    }
  }, [user?.user_id, loadUserProfile]);

  // Synchronize Clerk OAuth with backend
  useEffect(() => {
    async function syncClerk() {
      if (isSignedIn && clerkUser && clerkUser.id !== syncedClerkId) {
        try {
          const email = clerkUser.primaryEmailAddress?.emailAddress || `${clerkUser.id}@clerk.user`;
          const fullName = clerkUser.fullName || clerkUser.firstName || '';
          const backendUser = await api.clerkSync(clerkUser.id, email, fullName);
          setSyncedClerkId(clerkUser.id);
          setUser(backendUser);
          api.setStoredUser(backendUser, backendUser.access_token);
        } catch (err) {
          console.warn('Clerk sync notice:', err);
        }
      }
    }
    syncClerk();
  }, [isSignedIn, clerkUser, syncedClerkId]);

  const login = useCallback(async (email: string, pass: string): Promise<User> => {
    const authUser = await api.login(email, pass);
    setUser(authUser);
    api.setStoredUser(authUser, authUser.access_token);
    await loadUserProfile(authUser.user_id);
    return authUser;
  }, [loadUserProfile]);

  const register = useCallback(async (email: string, pass: string, fullName?: string): Promise<User> => {
    const authUser = await api.register(email, pass, fullName);
    setUser(authUser);
    api.setStoredUser(authUser, authUser.access_token);
    await loadUserProfile(authUser.user_id);
    return authUser;
  }, [loadUserProfile]);

  const logout = useCallback(async () => {
    api.setStoredUser(null);
    setUser(null);
    setProfile(null);

    if (clerk?.signOut) {
      try {
        await clerk.signOut();
      } catch (err) {
        console.warn('Clerk signout notice:', err);
      }
    }

    localStorage.removeItem('health_app_user');
    localStorage.removeItem('health_app_token');
    sessionStorage.clear();
  }, [clerk]);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
    api.setStoredUser(updated, updated.access_token);
  }, []);

  const updateProfileState = useCallback((updated: UserProfile) => {
    setProfile(updated);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoadingProfile,
      login,
      register,
      logout,
      updateUser,
      updateProfileState,
      refreshProfile,
    }),
    [user, profile, isLoadingProfile, login, register, logout, updateUser, updateProfileState, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
