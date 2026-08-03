'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { RoleBadge } from '@/components/ui/badge';
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
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface NavGroup {
  id: string;
  title: string;
  items: { name: string; href: string; icon: React.ElementType }[];
}

export function PlatformSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'core',
      title: 'Overview & Tenants',
      items: [
        { name: 'Dashboard', href: '/admin/platform', icon: LayoutDashboard },
        { name: 'Supermarkets', href: '/admin/platform/supermarkets', icon: Store },
      ],
    },
    {
      id: 'billing',
      title: 'Billing & Subscriptions',
      items: [
        { name: 'Subscriptions', href: '/admin/platform/subscriptions', icon: CreditCard },
        { name: 'Licenses', href: '/admin/platform/licenses', icon: Key },
        { name: 'Platform Revenue', href: '/admin/platform/revenue', icon: DollarSign },
        { name: 'Analytics', href: '/admin/platform/analytics', icon: BarChart3 },
      ],
    },
    {
      id: 'operations',
      title: 'Operations & Logs',
      items: [
        { name: 'Support Tickets', href: '/admin/platform/support', icon: LifeBuoy },
        { name: 'Announcements', href: '/admin/platform/announcements', icon: Megaphone },
        { name: 'Audit Logs', href: '/admin/platform/audit-logs', icon: Activity },
        { name: 'Feature Flags', href: '/admin/platform/feature-flags', icon: Flag },
      ],
    },
    {
      id: 'system',
      title: 'System Settings',
      items: [
        { name: 'Platform Settings', href: '/admin/platform/settings', icon: Settings },
        { name: 'Profile', href: '/admin/platform/profile', icon: UserCheck },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside className="w-60 bg-slate-950 text-slate-300 flex flex-col h-screen sticky top-0 z-50 border-r border-slate-800/80 font-sans shadow-2xl select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center space-x-3 bg-slate-900/60">
        <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-900/50 border border-indigo-400/30">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-black text-xs text-white tracking-tight uppercase truncate">
            Control Center
          </h1>
          <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest flex items-center mt-0.5">
            <Zap className="w-2.5 h-2.5 mr-0.5 fill-indigo-400" /> Platform Owner
          </p>
        </div>
      </div>

      {/* Navigation Links with Collapsible Groups */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {navGroups.map((group) => {
          const isCollapsed = !!collapsedGroups[group.id];

          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black uppercase text-slate-500 hover:text-white tracking-wider transition-colors cursor-pointer group"
              >
                <span>{group.title}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-transform" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-transform" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-1 pl-0.5 animate-in fade-in-50 duration-150">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950/60 border border-indigo-400/30'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-white hover:translate-x-1'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 space-y-2.5">
        <div className="flex items-center space-x-2.5 px-1 py-1">
          <UserAvatar user={user} size="sm" shape="square" className="border border-indigo-400/30" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-white truncate leading-tight">{user?.name || 'Platform Owner'}</p>
            <div className="mt-0.5">
              <RoleBadge role="platform_owner" className="text-[9px] px-1.5 py-0" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-800/40 text-xs font-extrabold transition-all cursor-pointer shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
