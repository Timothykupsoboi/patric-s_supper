'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { useBranding } from '@/context/BrandingContext';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { LogoutConfirmationModal } from '@/components/auth/LogoutConfirmationModal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { RoleBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Search,
  Lock,
  LogOut,
  Building2,
  ChevronDown,
  Sparkles,
  Plus,
  ShoppingCart,
  Check,
} from 'lucide-react';

export function Navbar() {
  const { user, lockTerminal, logoutAccount } = useAuth();
  const { activeBranch, branches, setBranch } = useTenant();
  const { branding, isPlatformOwner } = useBranding();
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs font-sans">
      {/* Left: Command Palette Search Bar & Branch Context Selector */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
            window.dispatchEvent(event);
          }}
          className="flex items-center space-x-2 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 transition-all min-w-[200px] sm:min-w-[260px] shadow-xs cursor-pointer"
        >
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate">Search commands, pages...</span>
          <kbd className="ml-auto bg-white px-1.5 py-0.5 rounded-md border border-slate-200 text-[10px] font-mono font-black text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Branch Context Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBranchMenu(!showBranchMenu)}
            className="flex items-center space-x-2 bg-blue-50/80 border border-blue-200/80 px-3 py-1.5 rounded-xl text-xs font-extrabold text-blue-700 hover:bg-blue-100 transition-all cursor-pointer shadow-xs"
          >
            <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="truncate max-w-[130px]">{activeBranch?.name || 'CBD Main Store'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          </button>

          {showBranchMenu && (
            <div className="absolute top-11 left-0 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in-50 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Switch Outlet Branch</p>
              </div>
              {branches.map((b) => {
                const isSelected = activeBranch?.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBranch(b);
                      setShowBranchMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Quick Action, Notifications, User Profile & Actions */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Quick Action Button */}
        <Link href="/pos">
          <Button variant="primary" size="sm" className="hidden sm:inline-flex shadow-sm">
            <Plus className="w-4 h-4 mr-1" />
            New POS Checkout
          </Button>
        </Link>

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 top-11 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in-50 duration-150">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-900 uppercase">System Notifications</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Live</span>
              </div>
              <div className="py-3 text-center text-xs text-slate-500 font-medium">
                No new unread alerts.
              </div>
            </div>
          )}
        </div>

        {/* User Identity & Logout Action */}
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-3 sm:pl-4">
          <UserAvatar user={user} size="sm" />
          <div className="hidden md:block text-left">
            <p className="text-xs font-black text-slate-900 leading-tight">{user?.name || 'Staff'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{branding.short_name || 'Retail'}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsLogoutOpen(true)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
            title="Logout or Lock Terminal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
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
