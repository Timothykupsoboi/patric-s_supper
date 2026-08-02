'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { employeeService } from '@/services/employeeService';
import { useAppDispatch } from '@/store';
import { unlockTerminal } from '@/store/authSlice';
import { UserProfile } from '@/types';
import {
  Lock,
  ShieldCheck,
  Building2,
  User,
  Delete,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRole(role?: string) {
  return (role || 'Staff').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'from-purple-600 to-indigo-600',
  admin: 'from-purple-600 to-indigo-600',
  owner: 'from-purple-600 to-indigo-600',
  manager: 'from-blue-600 to-cyan-600',
  cashier: 'from-emerald-600 to-teal-600',
  store_keeper: 'from-amber-600 to-orange-600',
  accountant: 'from-rose-600 to-pink-600',
  default: 'from-slate-600 to-slate-700',
};

function roleColor(role?: string) {
  return ROLE_COLORS[role || ''] || ROLE_COLORS.default;
}

// ─── Employee Avatar ─────────────────────────────────────────────────────────

function EmployeeAvatar({ emp, size = 'md' }: { emp: UserProfile; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  if (emp.photo_url) {
    return (
      <img
        src={emp.photo_url}
        alt={emp.name}
        className={`${sz} rounded-full object-cover flex-shrink-0 border border-slate-700`}
      />
    );
  }
  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br ${roleColor(emp.role)} flex items-center justify-center font-extrabold text-white flex-shrink-0 border border-white/10`}
    >
      {getInitials(emp.name)}
    </div>
  );
}

// ─── Employee Dropdown ───────────────────────────────────────────────────────

interface EmployeeDropdownProps {
  employees: UserProfile[];
  selectedId: string;
  onSelect: (emp: UserProfile) => void;
}

function EmployeeDropdown({ employees, selectedId, onSelect }: EmployeeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = employees.find((e) => e.id === selectedId) || employees[0];

  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      (emp.role && formatRole(emp.role).toLowerCase().includes(q)) ||
      (emp.email && emp.email.toLowerCase().includes(q))
    );
  });

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Auto-focus search when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
      const idx = filtered.findIndex((e) => e.id === selectedId);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [open]);

  // Keyboard navigation inside dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[focusedIndex]) {
        onSelect(filtered[focusedIndex]);
        setOpen(false);
        setSearch('');
      }
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-emp-item]');
      const item = items[focusedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleDropdownKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
          setSearch('');
          setFocusedIndex(0);
        }}
        className="w-full flex items-center space-x-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl px-3 py-2.5 transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500/60 cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <EmployeeAvatar emp={selected} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-white truncate">{selected.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{formatRole(selected.role)}</p>
            </div>
          </>
        ) : (
          <div className="flex-1 text-xs text-slate-400 font-bold">Select employee...</div>
        )}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Box */}
          <div className="p-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 bg-slate-950 rounded-xl px-3 py-2 border border-slate-800">
              <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFocusedIndex(0);
                }}
                placeholder="Search by name or role..."
                className="flex-1 bg-transparent text-xs font-medium text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Employee List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-52 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-slate-500 font-bold">
                No employees match your search.
              </li>
            ) : (
              filtered.map((emp, idx) => {
                const isSelected = emp.id === selectedId;
                const isFocused = idx === focusedIndex;
                return (
                  <li
                    key={emp.id}
                    data-emp-item
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(emp);
                      setOpen(false);
                      setSearch('');
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`flex items-center space-x-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      isFocused ? 'bg-blue-600/20' : 'hover:bg-slate-800'
                    } ${isSelected ? 'bg-blue-950/40' : ''}`}
                  >
                    <EmployeeAvatar emp={emp} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold text-white truncate">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{formatRole(emp.role)}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          emp.is_active !== false ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                        title={emp.is_active !== false ? 'Active' : 'Inactive'}
                      />
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Employee count */}
          <div className="px-3 py-1.5 border-t border-slate-800 text-[10px] text-slate-500 font-bold">
            {filtered.length} of {employees.length} employees
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TerminalLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, loading, logoutAccount, setTerminalEmployee } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [pin, setPin] = useState('');
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Auto-focus PIN input
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Guard: redirect unauthenticated or Platform Owner
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
        return;
      }
      if (user.role === 'platform_owner') {
        router.replace('/admin/platform');
        return;
      }

      setSelectedEmployeeId(user.id);

      if (user.supermarket_id) {
        employeeService
          .getEmployees(user.supermarket_id)
          .then((data) => {
            // Filter: active only, exclude platform_owner, exclude deleted
            const active = data.filter(
              (e) =>
                e.role !== 'platform_owner' &&
                e.is_active !== false &&
                e.deleted !== true
            );
            setEmployees(active);
          })
          .catch(() => setEmployees([]));
      }

      focusInput();
    }
  }, [user, loading, router, focusInput]);

  // Lockout countdown
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setInterval(() => setLockoutTimer((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTimer]);

  const handleUnlockSubmit = useCallback(
    async (currentPin: string) => {
      if (currentPin.length !== 4 || verifying || lockoutTimer > 0) return;

      setVerifying(true);
      setError('');

      try {
        const verifiedStaff = await employeeService.verifyPin(
          currentPin,
          user?.supermarket_id,
          selectedEmployeeId || user?.id
        );

        if (verifiedStaff) {
          dispatch(unlockTerminal());
          setTerminalEmployee(verifiedStaff);

          const role = verifiedStaff.role;
          let dest = '/dashboard';
          if (role === 'cashier') dest = '/pos';
          else if (role === 'store_keeper') dest = '/inventory';
          else if (role === 'accountant') dest = '/reports';
          else if (role === 'customer_service') dest = '/customers';
          else if (role === 'procurement_officer') dest = '/suppliers';

          router.replace(dest);
        } else {
          const nextFailed = failedAttempts + 1;
          setFailedAttempts(nextFailed);
          setPin('');
          if (nextFailed >= 5) {
            setLockoutTimer(30);
            setFailedAttempts(0);
            setError('Too many failed PIN attempts. Terminal locked for 30 seconds.');
          } else {
            setError(`Incorrect PIN. ${5 - nextFailed} attempt(s) remaining.`);
          }
          focusInput();
        }
      } catch {
        setError('PIN verification error. Please try again.');
        setPin('');
        focusInput();
      } finally {
        setVerifying(false);
      }
    },
    [dispatch, user, selectedEmployeeId, router, verifying, lockoutTimer, failedAttempts, focusInput, setTerminalEmployee]
  );

  // Global keyboard handler for PIN input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when dropdown search is focused
      const active = document.activeElement as HTMLElement;
      if (active && active.tagName === 'INPUT' && active !== inputRef.current) return;

      if (lockoutTimer > 0) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setPin('');
        setError('');
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        setPin((prev) => prev.slice(0, -1));
        setError('');
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === 4) handleUnlockSubmit(pin);
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (pin.length < 4) {
          const next = pin + e.key;
          setPin(next);
          setError('');
          if (next.length === 4) handleUnlockSubmit(next);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, lockoutTimer, handleUnlockSubmit]);

  const handleKeypadClick = (digit: string) => {
    if (lockoutTimer > 0 || verifying) return;
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError('');
      if (next.length === 4) handleUnlockSubmit(next);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
        <div className="flex items-center space-x-3 bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-extrabold tracking-wide">Loading Terminal Authentication...</span>
        </div>
      </div>
    );
  }

  const selectedStaffObj = employees.find((e) => e.id === selectedEmployeeId) || user;

  return (
    <div
      className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden select-none"
      onClick={focusInput}
    >
      {/* Hidden input to capture native keyboard */}
      <input
        ref={inputRef}
        type="password"
        value={pin}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
          setPin(val);
          if (val.length === 4) handleUnlockSubmit(val);
        }}
        className="opacity-0 absolute -z-10 w-0 h-0"
        maxLength={4}
        autoFocus
      />

      {/* Decorative Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-900/40 text-white border border-blue-400/30">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">Supermarket Terminal</h1>
          <div className="flex items-center justify-center space-x-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/40 py-1 px-3 rounded-full border border-emerald-800/40 w-fit mx-auto">
            <Building2 className="w-3.5 h-3.5" />
            <span>Terminal PIN Protection Active</span>
          </div>
        </div>

        {/* Employee Selector */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <User className="w-3 h-3 text-blue-400" />
            <span>Active Terminal Employee</span>
          </label>

          {employees.length > 0 ? (
            <EmployeeDropdown
              employees={employees}
              selectedId={selectedEmployeeId}
              onSelect={(emp) => {
                setSelectedEmployeeId(emp.id);
                setPin('');
                setError('');
                // Small delay to allow dropdown close animation, then focus PIN
                setTimeout(() => focusInput(), 80);
              }}
            />
          ) : (
            <div className="flex items-center space-x-3 py-1">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>
            </div>
          )}

          {/* Selected employee role badge */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold">
              Enter PIN for{' '}
              <span className="text-white font-extrabold">{selectedStaffObj?.name}</span>
            </span>
            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-blue-950 text-blue-400 rounded-md uppercase">
              {formatRole(selectedStaffObj?.role)}
            </span>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="space-y-4">
          <div className="flex justify-center space-x-3 my-2">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-12 h-14 rounded-2xl border flex items-center justify-center text-2xl font-black transition-all ${
                    filled
                      ? 'bg-blue-600/30 border-blue-500 text-blue-400 shadow-md shadow-blue-900/40 scale-105'
                      : 'bg-slate-950 border-slate-800 text-slate-700'
                  }`}
                >
                  {filled ? '●' : ''}
                </div>
              );
            })}
          </div>

          {/* Error / Lockout Banner */}
          {error && (
            <div className="flex items-center justify-center space-x-1.5 p-3 rounded-2xl bg-red-950/80 border border-red-800/80 text-xs text-red-200 font-extrabold text-center animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {lockoutTimer > 0 && (
            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-800/80 text-xs text-amber-300 font-extrabold text-center">
              Security lockout active. Please wait {lockoutTimer}s.
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                disabled={lockoutTimer > 0 || verifying}
                onClick={() => handleKeypadClick(num)}
                className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 disabled:opacity-50 text-white font-black text-xl rounded-2xl border border-slate-700/60 shadow-sm transition-all flex items-center justify-center active:scale-95 cursor-pointer"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              disabled={lockoutTimer > 0 || verifying}
              onClick={() => { setPin(''); setError(''); focusInput(); }}
              className="h-14 bg-slate-950 hover:bg-slate-800 text-slate-400 font-extrabold text-xs rounded-2xl border border-slate-800 transition-all flex items-center justify-center cursor-pointer"
            >
              CLEAR
            </button>

            <button
              type="button"
              disabled={lockoutTimer > 0 || verifying}
              onClick={() => handleKeypadClick('0')}
              className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 disabled:opacity-50 text-white font-black text-xl rounded-2xl border border-slate-700/60 shadow-sm transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            >
              0
            </button>

            <button
              type="button"
              disabled={lockoutTimer > 0 || verifying}
              onClick={() => { setPin((prev) => prev.slice(0, -1)); setError(''); focusInput(); }}
              className="h-14 bg-slate-950 hover:bg-slate-800 text-slate-400 font-extrabold text-xs rounded-2xl border border-slate-800 transition-all flex items-center justify-center cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Unlock Button */}
          <Button
            type="button"
            disabled={pin.length !== 4 || verifying || lockoutTimer > 0}
            onClick={() => handleUnlockSubmit(pin)}
            className={`w-full py-4 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all mt-2 ${
              pin.length === 4
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-950/80 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            {verifying ? 'Verifying PIN...' : 'Unlock Terminal'}
          </Button>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            onClick={() => logoutAccount()}
            className="text-slate-400 hover:text-red-400 font-bold flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out of Account</span>
          </button>
          <span className="text-[10px] text-slate-500 font-mono">Terminal Security</span>
        </div>
      </div>
    </div>
  );
}
