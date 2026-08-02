'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { LogoutConfirmationModal } from '@/components/auth/LogoutConfirmationModal';
import {
  Bell,
  Search,
  User,
  Lock,
  LogOut,
  Building2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { user, lockTerminal, logoutAccount } = useAuth();
  const { activeBranch, branches, setBranch } = useTenant();
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Command Palette Search Button & Branch Selector */}
      <div className="flex items-center space-x-4">
        {/* Command Palette Trigger */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
            window.dispatchEvent(event);
          }}
          className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-100 transition-all min-w-[220px]"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>Quick command search...</span>
          <kbd className="ml-auto bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-mono font-bold text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Branch Context Selector */}
        <div className="relative">
          <button
            onClick={() => setShowBranchMenu(!showBranchMenu)}
            className="flex items-center space-x-2 bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-xl text-xs font-extrabold text-blue-700 hover:bg-blue-100 transition-all"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{activeBranch?.name || 'Main CBD Branch'}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1 text-blue-500" />
          </button>

          {showBranchMenu && (
            <div className="absolute top-10 left-0 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in-50">
              <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Switch Store Branch</p>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBranch(b);
                    setShowBranchMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                    activeBranch?.id === b.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{b.name}</span>
                  {activeBranch?.id === b.id && <Sparkles className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: User Profile & Logout */}
      <div className="flex items-center space-x-4">
        <Badge variant="info" className="uppercase text-[10px] font-extrabold py-0.5">
          <ShieldCheck className="w-3 h-3 mr-1" />
          {user?.role || 'Cashier'}
        </Badge>

        <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-extrabold text-slate-900 leading-none">{user?.name || 'Cashier User'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{user?.email || 'user@supermarket.co.ke'}</p>
          </div>
        </div>

        {user?.role === 'platform_owner' ? (
          <button
            onClick={() => setIsLogoutOpen(true)}
            className="flex items-center space-x-1.5 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-extrabold text-xs transition-colors border border-red-100"
            title="Platform Owner Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        ) : (
          <button
            onClick={lockTerminal}
            className="flex items-center space-x-1.5 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-extrabold text-xs transition-all border border-blue-200 shadow-2xs"
            title="Lock Terminal (PIN required to return)"
          >
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Lock Terminal</span>
          </button>
        )}
      </div>

      <CommandPalette />

      <LogoutConfirmationModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onLockTerminal={() => {
          setIsLogoutOpen(false);
          lockTerminal();
        }}
        onAccountLogout={() => {
          setIsLogoutOpen(false);
          logoutAccount();
        }}
        isPlatformOwner={user?.role === 'platform_owner'}
      />
    </header>
  );
}
