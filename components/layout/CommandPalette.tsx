'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Search,
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
} from 'lucide-react';

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { label: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { label: 'POS Terminal Register', href: '/pos', icon: ShoppingCart, category: 'Sales' },
    { label: 'Inventory & Stock Audit', href: '/inventory', icon: Package, category: 'Stock' },
    { label: 'Customer Accounts & Debtors', href: '/customers', icon: Users, category: 'Accounts' },
    { label: 'Financial & Valuation Reports', href: '/reports', icon: BarChart2, category: 'Analytics' },
    { label: 'Store Operational Expenses', href: '/expenses', icon: Receipt, category: 'Finance' },
    { label: 'Vendor Directory & POs', href: '/suppliers', icon: Truck, category: 'Procurement' },
    { label: 'Staff & RBAC Permissions', href: '/employees', icon: UserCheck, category: 'Admin' },
    { label: 'Store Branch Directory', href: '/branches', icon: Building2, category: 'Supermarket' },
    { label: 'Platform Owner Control Center', href: '/admin/platform', icon: ShieldCheck, category: 'SaaS Platform' },
    { label: 'Business Profile & Settings', href: '/settings', icon: Settings, category: 'Settings' },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Quick Navigation Command Palette (Ctrl+K)">
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
          <Input
            placeholder="Type a command or jump to page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 py-2.5 bg-slate-50 border-slate-200 text-sm font-semibold"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1 divide-y divide-slate-100">
          {filteredCommands.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No commands found matching "{query}"</p>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(cmd.href)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-blue-50/70 hover:text-blue-600 rounded-xl transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">{cmd.label}</span>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Dialog>
  );
}
