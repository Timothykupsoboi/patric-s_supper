'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();

  const navigation = [
    { name: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS Register', href: '/pos', icon: ShoppingCart },
    { name: 'Inventory & Stock Audit', href: '/inventory', icon: Package },
    { name: 'Debtors & Customers', href: '/customers', icon: Users },
    { name: 'Financial Analytics', href: '/reports', icon: BarChart2 },
    { name: 'Operational Expenses', href: '/expenses', icon: Receipt },
    { name: 'Suppliers & Vendors', href: '/suppliers', icon: Truck },
    { name: 'Staff & RBAC Roles', href: '/employees', icon: UserCheck },
    { name: 'Store Branches', href: '/branches', icon: Building2 },
    { name: 'Business Settings', href: '/settings', icon: Settings },
  ];

  if (hasPermission('super_admin')) {
    navigation.push({ name: 'SaaS Platform Control', href: '/admin/platform', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-900/30">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">CLOUD SUPERMARKET</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enterprise POS v2.0</p>
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
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>Supabase Cloud Engine</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      </div>
    </aside>
  );
}
