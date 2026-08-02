'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
  refreshProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  hasPermission: () => false,
  refreshProfile: async () => {},
  setUserProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>({
    id: 'demo-user-cashier',
    name: 'Main Cashier',
    email: 'cashier@supermarket.co.ke',
    role: 'admin',
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    is_active: true,
    created_at: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        const profile = await authService.getUserProfile(session.user.id);
        if (profile) setUser(profile);
      }
    } catch (e) {
      console.warn('Auth session profile query fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
    const supabase = createClient();

    // Listen for Auth changes (Session Refresh, Login, Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await authService.getUserProfile(session.user.id);
        if (profile) {
          setUser(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout fallback:', e);
    } finally {
      setUser(null);
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return authService.hasRolePermission(user.role, requiredRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        hasPermission,
        refreshProfile,
        setUserProfile: (profile) => setUser(profile),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
