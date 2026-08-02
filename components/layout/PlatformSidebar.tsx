'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Key,
  DollarSign,
  BarChart3,
  LifeBuoy,
  Megaphone,
  Activity,
  Flag,
  Settings,
  UserCheck,
  LogOut,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export function PlatformSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin/platform', icon: LayoutDashboard },
    { name: 'Supermarkets', href: '/admin/platform/supermarkets', icon: Store },
    { name: 'Subscriptions', href: '/admin/platform/subscriptions', icon: CreditCard },
    { name: 'Licenses', href: '/admin/platform/licenses', icon: Key },
    { name: 'Platform Revenue', href: '/admin/platform/revenue', icon: DollarSign },
    { name: 'Analytics', href: '/admin/platform/analytics', icon: BarChart3 },
    { name: 'Support Tickets', href: '/admin/platform/support', icon: LifeBuoy },
    { name: 'Announcements', href: '/admin/platform/announcements', icon: Megaphone },
    { name: 'Audit Logs', href: '/admin/platform/audit-logs', icon: Activity },
    { name: 'Feature Flags', href: '/admin/platform/feature-flags', icon: Flag },
    { name: 'Platform Settings', href: '/admin/platform/settings', icon: Settings },
    { name: 'Profile', href: '/admin/platform/profile', icon: UserCheck },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col h-screen sticky top-0 z-50 border-r border-slate-800 font-sans shadow-2xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3 bg-slate-900/60">
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/40 border border-indigo-400/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-black text-xs text-white tracking-tight leading-tight uppercase flex items-center space-x-1">
            <span>SaaS Control Center</span>
          </h1>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center mt-0.5">
            <Zap className="w-3 h-3 mr-0.5 fill-indigo-400" />
            <span>Platform Owner</span>
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider px-3 pt-2 pb-1">
          Platform Administration
        </p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950/60 border border-indigo-400/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center border border-indigo-400/30">
              {user?.name?.slice(0, 1) || 'P'}
            </div>
            <div className="truncate max-w-[120px]">
              <p className="text-xs font-extrabold text-white truncate">{user?.name || 'Platform Owner'}</p>
              <p className="text-[9px] text-indigo-400 truncate">{user?.email || 'admin@saas.com'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-800/40 text-xs font-extrabold transition-all shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout Portal</span>
        </button>
      </div>
    </aside>
  );
}
