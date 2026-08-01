'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { lockTerminal } from '@/store/authSlice';
import { Lock, User, RefreshCw, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-semibold text-gray-700">Branch: <span className="text-blue-600">Main Supermarket CBD</span></span>
        <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-medium">Cloud Active</span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Hotkeys Quick Reference */}
        <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <Key className="w-3.5 h-3.5 text-gray-400" />
          <span>F1: POS</span>
          <span>•</span>
          <span>F2: Inventory</span>
          <span>•</span>
          <span>F3: Debtors</span>
          <span>•</span>
          <span>F4: Reports</span>
        </div>

        {/* Lock Cashier Terminal Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(lockTerminal())}
          className="text-gray-700 hover:bg-gray-100"
        >
          <Lock className="w-4 h-4 mr-1.5 text-gray-500" />
          Lock Terminal
        </Button>

        {/* User Badge */}
        <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-800 leading-none">{user?.name || 'Cashier'}</p>
            <p className="text-[10px] text-gray-500 capitalize leading-tight mt-0.5">{user?.role || 'Cashier'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
