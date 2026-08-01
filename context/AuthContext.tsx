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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  hasPermission: () => false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>({
    id: 'demo-user-cashier',
    name: 'Main Cashier',
    email: 'cashier@supermarket.co.ke',
    role: 'admin', // Demo permissions for complete navigation
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    is_active: true,
    created_at: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Listen for Auth changes (Session Refresh, Login, Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await authService.getUserProfile(session.user.id);
        if (profile) {
          setUser(profile);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    const session = await authService.getSession();
    if (session?.user) {
      const profile = await authService.getUserProfile(session.user.id);
      if (profile) setUser(profile);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return authService.hasRolePermission(user.role, requiredRole);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, hasPermission, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
