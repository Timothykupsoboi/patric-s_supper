'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { unlockTerminal } from '@/store/authSlice';
import { employeeService } from '@/services/employeeService';
import { Lock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function TerminalLockModal() {
  const dispatch = useAppDispatch();
  const { isTerminalLocked } = useAppSelector((state) => state.auth);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isTerminalLocked) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Please enter terminal PIN');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const employee = await employeeService.verifyPin(pin);
      if (employee) {
        dispatch(unlockTerminal());
        setPin('');
      } else {
        setError('Invalid cashier PIN code.');
      }
    } catch {
      setError('PIN verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Terminal Locked</h2>
        <p className="text-sm text-gray-500 mb-6">Enter assigned cashier PIN to resume register operations.</p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-2xl tracking-widest font-bold py-3"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center space-x-1.5 text-xs text-red-600 font-medium">
              <ShieldAlert className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full py-3 font-bold" disabled={loading}>
            {loading ? 'Verifying...' : 'Unlock Terminal'}
          </Button>
        </form>
      </div>
    </div>
  );
}
