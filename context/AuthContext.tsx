'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/types';
import { authService, UserRoleCategory, PermissionKey } from '@/services/authService';

interface AuthContextType {
  user: UserProfile | null;
  roleCategory: UserRoleCategory | null;
  loading: boolean;
  logout: () => Promise<void>;
  hasPermission: (permission: PermissionKey | UserRole) => boolean;
  refreshProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roleCategory: null,
  loading: true,
  logout: async () => {},
  hasPermission: () => false,
  refreshProfile: async () => {},
  setUserProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const roleCategory: UserRoleCategory | null = user ? authService.getRoleCategory(user.role) : null;

  const refreshProfile = async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        const profile = await authService.getUserProfile(session.user.id);
        if (profile) {
          if (profile.is_active === false) {
            await authService.logout();
            setUser(null);
          } else {
            setUser(profile);
          }
        }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await authService.getUserProfile(session.user.id);
        if (profile) {
          if (profile.is_active === false) {
            await authService.logout();
            setUser(null);
          } else {
            setUser(profile);
          }
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
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {}
        window.location.replace('/login');
      }
    }
  };

  const hasPermission = (permission: PermissionKey | UserRole): boolean => {
    if (!user) return false;
    if (typeof permission === 'string' && permission.includes('.')) {
      return authService.hasPermission(user.role, permission as PermissionKey);
    }
    return authService.hasRolePermission(user.role, permission as UserRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roleCategory,
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
