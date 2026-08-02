'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authService, PermissionKey } from '@/services/authService';
import { LogoutConfirmationModal } from '@/components/auth/LogoutConfirmationModal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart2,
  Receipt,
  Truck,
  UserCheck,
  Building2,
  ShieldCheck,
  Settings,
  Store,
  LogOut,
  Lock,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, lockTerminal, logoutAccount } = useAuth();
  const role = user?.role || 'cashier';
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const allNavigation = [
    { name: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'reports.view' as PermissionKey },
    { name: 'POS Register', href: '/pos', icon: ShoppingCart, permission: 'sales.create' as PermissionKey },
    { name: 'Inventory & Stock Audit', href: '/inventory', icon: Package, permission: 'products.view' as PermissionKey },
    { name: 'Debtors & Customers', href: '/customers', icon: Users, permission: 'customers.manage' as PermissionKey },
    { name: 'Financial Analytics', href: '/reports', icon: BarChart2, permission: 'reports.view' as PermissionKey },
    { name: 'Operational Expenses', href: '/expenses', icon: Receipt, permission: 'expenses.manage' as PermissionKey },
    { name: 'Suppliers & Vendors', href: '/suppliers', icon: Truck, permission: 'suppliers.manage' as PermissionKey },
    { name: 'Staff & RBAC Roles', href: '/employees', icon: UserCheck, permission: 'employees.manage' as PermissionKey },
    { name: 'Store Branches', href: '/branches', icon: Building2, permission: 'branches.manage' as PermissionKey },
    { name: 'Business Settings', href: '/settings', icon: Settings, permission: 'settings.manage' as PermissionKey },
  ];

  // Navigation is generated strictly from supermarket role permissions
  const navigation = allNavigation.filter((item) => {
    return authService.hasPermission(role, item.permission);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-xs text-white tracking-tight leading-tight uppercase">Patrick's Supermarket</h1>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Enterprise SaaS v2.5</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer & Action Buttons */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* User identity card */}
        <div className="flex items-center space-x-2.5 px-1">
          <UserAvatar user={user} size="sm" />
          <div className="truncate flex-1 min-w-0">
            <p className="text-xs font-extrabold text-white leading-none truncate">{user?.name || 'Staff'}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate capitalize">{(user?.role || 'cashier').replace(/_/g, ' ')}</p>
          </div>
        </div>

        <button
          onClick={lockTerminal}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 hover:text-white border border-blue-800/40 text-xs font-extrabold transition-all"
          title="Lock terminal and return to PIN screen"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock Terminal</span>
        </button>

        <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1">
          <span>Supabase Multi-Tenant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>

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
    </aside>
  );
}
