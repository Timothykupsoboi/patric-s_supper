'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, AlertTriangle } from 'lucide-react';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggingOut?: boolean;
}

export function LogoutConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoggingOut = false,
}: LogoutConfirmationModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Confirm Sign Out" className="max-w-md">
      <div className="space-y-5 text-center p-2">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900">Are you sure you want to sign out?</h3>
          <p className="text-xs text-slate-500 mt-1">
            Your active session will be securely terminated and all cached data cleared.
          </p>
        </div>

        <div className="flex items-center justify-center space-x-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoggingOut}
            className="w-1/2 font-bold text-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-md shadow-red-900/20"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            {isLoggingOut ? 'Signing out...' : 'Yes, Sign Out'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
