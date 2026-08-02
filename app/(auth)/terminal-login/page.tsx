'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { employeeService } from '@/services/employeeService';
import { useAppDispatch } from '@/store';
import { unlockTerminal } from '@/store/authSlice';
import { UserProfile, UserRole } from '@/types';
import {
  Lock,
  ShieldCheck,
  Building2,
  User,
  Delete,
  ShieldAlert,
  LogOut,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TerminalLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, loading, logout, logoutAccount, setTerminalEmployee } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [pin, setPin] = useState('');
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // 1. Auto-focus PIN input
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 2. Guard against non-authenticated visitors & Platform Owner
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
        return;
      }

      // Platform Owner MUST NEVER use Terminal Login!
      if (user.role === 'platform_owner') {
        router.replace('/admin/platform');
        return;
      }

      setSelectedEmployeeId(user.id);

      if (user.supermarket_id) {
        employeeService
          .getEmployees(user.supermarket_id)
          .then((data) => setEmployees(data))
          .catch(() => setEmployees([]));
      }

      focusInput();
    }
  }, [user, loading, router, focusInput]);

  // 3. Lockout Countdown Timer
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
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

          // Navigate based on employee role
          const role = verifiedStaff.role;
          let dest = '/dashboard';
          if (role === 'cashier') dest = '/pos';
          else if (role === 'store_keeper' || role === 'inventory_manager') dest = '/inventory';
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
            setError('Invalid 4-digit PIN for this supermarket terminal.');
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
    [dispatch, user, selectedEmployeeId, router, verifying, lockoutTimer, failedAttempts, focusInput]
  );

  // 4. Keyboard Listener: Number Keys, Backspace, Enter, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lockoutTimer > 0) return;

      // Escape -> Clear PIN
      if (e.key === 'Escape') {
        e.preventDefault();
        setPin('');
        setError('');
        return;
      }

      // Backspace -> Delete last digit
      if (e.key === 'Backspace') {
        e.preventDefault();
        setPin((prev) => prev.slice(0, -1));
        setError('');
        return;
      }

      // Enter -> Submit if 4 digits
      if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === 4) {
          handleUnlockSubmit(pin);
        }
        return;
      }

      // Numeric keys 0-9
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (pin.length < 4) {
          const nextPin = pin + e.key;
          setPin(nextPin);
          setError('');
          if (nextPin.length === 4) {
            handleUnlockSubmit(nextPin);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, lockoutTimer, handleUnlockSubmit]);

  const handleKeypadClick = (digit: string) => {
    if (lockoutTimer > 0) return;
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        handleUnlockSubmit(nextPin);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
    focusInput();
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
    focusInput();
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
      {/* Hidden input to catch native focus */}
      <input
        ref={inputRef}
        type="password"
        value={pin}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
          setPin(val);
          if (val.length === 4) {
            handleUnlockSubmit(val);
          }
        }}
        className="opacity-0 absolute -z-10 w-0 h-0"
        maxLength={4}
        autoFocus
      />

      {/* Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10 space-y-6">
        {/* Terminal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-900/40 text-white border border-blue-400/30">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">Supermarket Terminal Login</h1>
          <div className="flex items-center justify-center space-x-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/40 py-1 px-3 rounded-full border border-emerald-800/40 w-fit mx-auto">
            <Building2 className="w-3.5 h-3.5" />
            <span>Terminal PIN Protection Active</span>
          </div>
        </div>

        {/* Employee Selection Dropdown */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <User className="w-3 h-3 text-blue-400" />
              <span>Active Terminal User</span>
            </label>
            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-blue-950 text-blue-400 rounded-md uppercase">
              {selectedStaffObj?.role?.replace('_', ' ') || 'Staff'}
            </span>
          </div>

          {employees.length > 0 ? (
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                setPin('');
                setError('');
                focusInput();
              }}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role?.replace('_', ' ')})
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center space-x-3 text-xs font-bold text-slate-200 py-1">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-extrabold text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* 4-Digit Masked Indicators (● ● ● ●) */}
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

          {/* Friendly Error Banner */}
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

          {/* Professional On-Screen Keypad */}
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
              onClick={handleClear}
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
              onClick={handleBackspace}
              className="h-14 bg-slate-950 hover:bg-slate-800 text-slate-400 font-extrabold text-xs rounded-2xl border border-slate-800 transition-all flex items-center justify-center cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Unlock Terminal Button */}
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

        {/* Footer: Sign Out Options */}
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
