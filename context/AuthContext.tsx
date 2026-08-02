'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/types';
import { authService, UserRoleCategory, PermissionKey } from '@/services/authService';
import { auditService } from '@/services/auditService';

interface AuthContextType {
  user: UserProfile | null;
  accountOwner: UserProfile | null;
  roleCategory: UserRoleCategory | null;
  loading: boolean;
  autoLockTimeoutMinutes: number;
  logout: () => Promise<void>;
  logoutAccount: () => Promise<void>;
  lockTerminal: () => void;
  setTerminalEmployee: (emp: UserProfile) => void;
  updateAutoLockTimeout: (minutes: number) => void;
  hasPermission: (permission: PermissionKey | UserRole) => boolean;
  refreshProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accountOwner: null,
  roleCategory: null,
  loading: true,
  autoLockTimeoutMinutes: 10,
  logout: async () => {},
  logoutAccount: async () => {},
  lockTerminal: () => {},
  setTerminalEmployee: () => {},
  updateAutoLockTimeout: () => {},
  hasPermission: () => false,
  refreshProfile: async () => {},
  setUserProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accountOwner, setAccountOwner] = useState<UserProfile | null>(null);
  const [terminalUser, setTerminalUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoLockTimeoutMinutes, setAutoLockTimeoutMinutes] = useState<number>(10);
  const lastActivityRef = React.useRef<number>(Date.now());

  // Active user in context is active terminal employee if unlocked, else account owner
  const activeUser = terminalUser || accountOwner;
  const roleCategory: UserRoleCategory | null = activeUser ? authService.getRoleCategory(activeUser.role) : null;

  // Load configured auto-lock timeout from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('terminal_auto_lock_timeout_minutes');
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          setAutoLockTimeoutMinutes(parsed);
        }
      }
    }
  }, []);

  const updateAutoLockTimeout = (minutes: number) => {
    setAutoLockTimeoutMinutes(minutes);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('terminal_auto_lock_timeout_minutes', minutes.toString());
      } catch {}
    }
  };

  // Inactivity Auto-Lock Listener — skips Platform Owner entirely
  useEffect(() => {
    const isPlatformOwner = accountOwner?.role === 'platform_owner';
    if (isPlatformOwner) return;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    const intervalId = setInterval(() => {
      if (autoLockTimeoutMinutes <= 0) return; // 0 means Never / Disabled

      const isUnlocked = typeof window !== 'undefined' && sessionStorage.getItem('terminal_unlocked') === 'true';
      if (terminalUser || isUnlocked) {
        const elapsedMs = Date.now() - lastActivityRef.current;
        const timeoutMs = autoLockTimeoutMinutes * 60 * 1000;

        if (elapsedMs >= timeoutMs) {
          console.warn(`[Auto-Lock] Terminal locked after ${autoLockTimeoutMinutes} minutes of inactivity.`);
          lockTerminal();
        }
      }
    }, 3000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      clearInterval(intervalId);
    };
  }, [autoLockTimeoutMinutes, terminalUser, accountOwner]);

  const refreshProfile = async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        const profile = await authService.getUserProfile(session.user.id);
        if (profile) {
          if (profile.is_active === false) {
            await authService.logout();
            setAccountOwner(null);
            setTerminalUser(null);
          } else {
            setAccountOwner(profile);
            
            // Restore active terminal session employee if available
            if (typeof window !== 'undefined') {
              const isUnlocked = sessionStorage.getItem('terminal_unlocked') === 'true';
              const storedEmpStr = sessionStorage.getItem('terminal_active_employee_data');
              if (isUnlocked && storedEmpStr) {
                try {
                  const empData = JSON.parse(storedEmpStr);
                  setTerminalUser(empData);
                } catch {
                  setTerminalUser(profile);
                }
              }
            }
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
            setAccountOwner(null);
            setTerminalUser(null);
          } else {
            setAccountOwner(profile);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setAccountOwner(null);
        setTerminalUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setTerminalEmployee = (emp: UserProfile) => {
    // Inject photo_url from localStorage so it persists in the terminal session
    const enrichedEmp: UserProfile = {
      ...emp,
      photo_url:
        typeof window !== 'undefined'
          ? localStorage.getItem(`profile_photo_${emp.id}`) || emp.photo_url || undefined
          : emp.photo_url,
    };
    setTerminalUser(enrichedEmp);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('terminal_unlocked', 'true');
        sessionStorage.setItem('terminal_unlocked_user', emp.id);
        sessionStorage.setItem('terminal_active_employee_data', JSON.stringify(enrichedEmp));
      } catch {}
    }
    // Audit Terminal Session Unlock
    auditService.logAction(
      'TERMINAL_UNLOCK',
      'terminal_session',
      emp.id,
      { employee_name: emp.name, role: emp.role, branch_id: emp.branch_id },
      emp.id,
      emp.supermarket_id
    );
  };

  const lockTerminal = () => {
    if (terminalUser || accountOwner) {
      const activeId = terminalUser?.id || accountOwner?.id;
      const smId = terminalUser?.supermarket_id || accountOwner?.supermarket_id;
      if (activeId && smId) {
        auditService.logAction(
          'TERMINAL_LOCK',
          'terminal_session',
          activeId,
          { locked_at: new Date().toISOString() },
          activeId,
          smId
        );
      }
    }

    setTerminalUser(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('terminal_unlocked');
        sessionStorage.removeItem('terminal_unlocked_user');
        sessionStorage.removeItem('terminal_active_employee_data');
      } catch {}
      window.location.replace('/terminal-login');
    }
  };

  const logoutAccount = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout fallback:', e);
    } finally {
      setAccountOwner(null);
      setTerminalUser(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {}
        window.location.replace('/login');
      }
    }
  };

  const logout = async () => {
    if (activeUser?.role === 'platform_owner') {
      await logoutAccount();
    } else {
      lockTerminal();
    }
  };

  const hasPermission = (permission: PermissionKey | UserRole): boolean => {
    if (!activeUser) return false;
    if (typeof permission === 'string' && permission.includes('.')) {
      return authService.hasPermission(activeUser.role, permission as PermissionKey);
    }
    return authService.hasRolePermission(activeUser.role, permission as UserRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        accountOwner,
        roleCategory,
        loading,
        autoLockTimeoutMinutes,
        logout,
        logoutAccount,
        lockTerminal,
        setTerminalEmployee,
        updateAutoLockTimeout,
        hasPermission,
        refreshProfile,
        setUserProfile: (profile) => setAccountOwner(profile),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
