'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, Lock, AlertTriangle, ShieldOff } from 'lucide-react';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockTerminal: () => void;
  onAccountLogout: () => void;
  isPlatformOwner?: boolean;
}

export function LogoutConfirmationModal({
  isOpen,
  onClose,
  onLockTerminal,
  onAccountLogout,
  isPlatformOwner = false,
}: LogoutConfirmationModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Sign Out Options" className="max-w-md">
      <div className="space-y-5 text-center p-2">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900">Choose Sign Out Behavior</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isPlatformOwner
              ? 'Platform Owner session will be completely signed out.'
              : 'Lock your active terminal with PIN or log out of your account entirely.'}
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          {!isPlatformOwner && (
            <Button
              onClick={onLockTerminal}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 shadow-md text-xs flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Lock Terminal (Requires PIN to Return)</span>
            </Button>
          )}

          <Button
            onClick={onAccountLogout}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 font-extrabold py-3 text-xs flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Account (Sign Out Entirely)</span>
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full font-bold text-slate-600 text-xs py-2"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
