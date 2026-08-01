'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  Truck,
  TrendingDown,
  UserCheck,
  Settings,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'POS Checkout (F1)', icon: ShoppingCart, highlight: true },
  { href: '/inventory', label: 'Inventory (F2)', icon: Package },
  { href: '/customers', label: 'Customers (F3)', icon: Users },
  { href: '/reports', label: 'Reports (F4)', icon: Receipt },
  { href: '/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/employees', label: 'Employees', icon: UserCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shadow-xl border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-wide text-white">ANTIGRAVITY POS</h1>
          <p className="text-xs text-blue-400 font-medium">Cloud Supermarket v2.0</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                item.highlight && !isActive && 'border border-blue-500/30 text-blue-400 hover:bg-blue-500/10'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Cloud Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Supabase Cloud Connected</span>
        </div>
      </div>
    </aside>
  );
}
