'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  ShieldAlert,
  Sparkles,
  LogOut,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TerminalLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, loading, logout } = useAuth();

  const [pin, setPin] = useState('');
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  // 1. Guard against non-authenticated visitors & Platform Owner
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

      // Default selected employee to current user
      setSelectedEmployeeId(user.id);

      // Fetch employees for current supermarket for optional terminal staff selector
      if (user.supermarket_id) {
        employeeService
          .getEmployees(user.supermarket_id)
          .then((data) => setEmployees(data))
          .catch(() => setEmployees([]));
      }
    }
  }, [user, loading, router]);

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleKeypadClear = () => {
    setPin('');
    setError('');
  };

  const getRoleDestination = (role?: UserRole | string): string => {
    if (!role) return '/dashboard';
    switch (role) {
      case 'supermarket_owner':
      case 'super_admin':
      case 'owner':
      case 'branch_manager':
      case 'manager':
      case 'supervisor':
        return '/dashboard';
      case 'cashier':
        return '/pos';
      case 'store_keeper':
      case 'inventory_manager':
        return '/inventory';
      case 'accountant':
        return '/reports';
      case 'customer_service':
        return '/customers';
      case 'procurement_officer':
        return '/suppliers';
      default:
        return '/dashboard';
    }
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!pin || pin.length < 4) {
      setError('Please enter a valid 4-6 digit numeric PIN.');
      return;
    }

    setVerifying(true);

    try {
      // Verify PIN strictly against the authenticated supermarket
      const verifiedStaff = await employeeService.verifyPin(
        pin,
        user?.supermarket_id,
        selectedEmployeeId || user?.id
      );

      if (verifiedStaff) {
        // Mark terminal unlocked in Redux and sessionStorage
        dispatch(unlockTerminal());
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('terminal_unlocked', 'true');
          sessionStorage.setItem('terminal_unlocked_user', verifiedStaff.id);
        }

        const destination = getRoleDestination(verifiedStaff.role);
        router.replace(destination);
      } else {
        setError('Invalid PIN for this supermarket terminal. Please check your credentials.');
      }
    } catch {
      setError('PIN verification error. Please try again.');
    } finally {
      setVerifying(false);
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
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Background Decorative Lighting */}
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
            <span>Supermarket Terminal Access Control</span>
          </div>
        </div>

        {/* Employee Selection Dropdown / Profile Badge */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <User className="w-3 h-3 text-blue-400" />
              <span>Select Active Terminal User</span>
            </label>
            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-blue-950 text-blue-400 rounded-md uppercase">
              {selectedStaffObj?.role?.replace('_', ' ') || 'Staff'}
            </span>
          </div>

          {employees.length > 0 ? (
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
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

        {/* PIN Input Display */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <div className="flex justify-center space-x-2 my-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-10 h-12 rounded-xl border flex items-center justify-center text-xl font-black transition-all ${
                      filled
                        ? 'bg-blue-600/30 border-blue-500 text-blue-400 shadow-md shadow-blue-900/30 scale-105'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {filled ? '•' : ''}
                  </div>
                );
              })}
            </div>

            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 6))}
              className="sr-only"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300 font-extrabold animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Keypad Buttons */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="h-12 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white font-extrabold text-lg rounded-2xl border border-slate-700/60 shadow-sm transition-all flex items-center justify-center active:scale-95"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleKeypadClear}
              className="h-12 bg-slate-950 hover:bg-slate-800 text-slate-400 font-extrabold text-xs rounded-2xl border border-slate-800 transition-all flex items-center justify-center"
            >
              CLEAR
            </button>

            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-12 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white font-extrabold text-lg rounded-2xl border border-slate-700/60 shadow-sm transition-all flex items-center justify-center active:scale-95"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleKeypadBackspace}
              className="h-12 bg-slate-950 hover:bg-slate-800 text-slate-400 font-extrabold text-xs rounded-2xl border border-slate-800 transition-all flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Unlock Action Button */}
          <Button
            type="submit"
            disabled={verifying}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-950/80 transition-all mt-2"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            {verifying ? 'Verifying Terminal PIN...' : 'Unlock Terminal'}
          </Button>
        </form>

        {/* Footer: Switch Account */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            onClick={() => logout()}
            className="text-slate-400 hover:text-red-400 font-bold flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
          <span className="text-[10px] text-slate-500 font-mono">Tenant Lock Active</span>
        </div>
      </div>
    </div>
  );
}
