'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { authService, PermissionKey } from '@/services/authService';
import { LogoutConfirmationModal } from '@/components/auth/LogoutConfirmationModal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { RoleBadge } from '@/components/ui/badge';
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
  Settings,
  Store,
  Lock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Wallet,
  UserGroup,
  Smartphone,
  FileText,
  Barcode,
  MessageSquare,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission: PermissionKey;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, lockTerminal, logoutAccount } = useAuth();
  const { branding, isPlatformOwner } = useBranding();
  const role = user?.role || 'cashier';
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // State to track collapsed menu groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      items: [
        { name: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'reports.view' },
      ],
    },
    {
      id: 'sales',
      title: 'Sales',
      items: [
        { name: 'POS Register', href: '/pos', icon: ShoppingCart, permission: 'sales.create' },
        { name: 'M-Pesa Transactions', href: '/mpesa-transactions', icon: Smartphone, permission: 'sales.create' },
      ],
    },
    {
      id: 'inventory',
      title: 'Inventory',
      items: [
        { name: 'Inventory & Stock Audit', href: '/inventory', icon: Package, permission: 'products.view' },
        { name: 'Barcode Management', href: '/barcodes', icon: Barcode, permission: 'products.view' },
      ],
    },
    {
      id: 'finance',
      title: 'Finance',
      items: [
        { name: 'Financial Analytics', href: '/reports', icon: BarChart2, permission: 'reports.view' },
        { name: 'Operational Expenses', href: '/expenses', icon: Receipt, permission: 'expenses.manage' },
        { name: 'Suppliers & Vendors', href: '/suppliers', icon: Truck, permission: 'suppliers.manage' },
      ],
    },
    {
      id: 'customers',
      title: 'Customers',
      items: [
        { name: 'Debtors & Customers', href: '/customers', icon: Users, permission: 'customers.manage' },
      ],
    },
    {
      id: 'staff',
      title: 'Staff & Outlets',
      items: [
        { name: 'Staff & RBAC Roles', href: '/employees', icon: UserCheck, permission: 'employees.manage' },
        { name: 'Store Branches', href: '/branches', icon: Building2, permission: 'branches.manage' },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      items: [
        { name: 'Business Settings', href: '/settings', icon: Settings, permission: 'settings.manage' },
        { name: 'Document Templates', href: '/templates', icon: FileText, permission: 'settings.manage' },
        { name: 'WhatsApp Center', href: '/whatsapp', icon: MessageSquare, permission: 'settings.manage' },
      ],
    },
  ];

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 z-40 border-r border-slate-800 shadow-xl font-sans select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/50">
        {branding.logo_url && !isPlatformOwner ? (
          <img src={branding.logo_url} alt={branding.business_name} className="w-9 h-9 object-contain rounded-xl" />
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 font-black text-sm"
            style={{ backgroundColor: branding.primary_color || '#2563EB' }}
          >
            <Store className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-black text-xs text-white tracking-tight uppercase truncate">
            {isPlatformOwner ? 'Antigravity Platform' : branding.short_name || branding.business_name || 'Supermarket'}
          </h1>
          <p
            className="text-[9px] font-extrabold uppercase tracking-wider flex items-center"
            style={{ color: branding.accent_color || '#10B981' }}
          >
            <Sparkles className="w-2.5 h-2.5 mr-1" /> {isPlatformOwner ? 'Platform Admin' : 'Retail POS'}
          </p>
        </div>
      </div>

      {/* Navigation List with Collapsible Groups */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {navGroups.map((group) => {
          // Filter items based on user role permissions
          const allowedItems = group.items.filter((item) =>
            authService.hasPermission(role, item.permission)
          );

          if (allowedItems.length === 0) return null;

          const isCollapsed = !!collapsedGroups[group.id];

          return (
            <div key={group.id} className="space-y-1">
              {/* Collapsible Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black uppercase text-slate-400 hover:text-white tracking-wider transition-colors cursor-pointer group"
              >
                <span>{group.title}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform" />
                )}
              </button>

              {/* Group Menu Items */}
              {!isCollapsed && (
                <div className="space-y-1 pl-0.5 animate-in fade-in-50 duration-150">
                  {allowedItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 ${
                          isActive
                            ? 'text-white shadow-md border border-white/20'
                            : 'text-slate-400 hover:bg-slate-800/80 hover:text-white hover:translate-x-1'
                        }`}
                        style={{
                          backgroundColor: isActive ? branding.primary_color || '#2563EB' : undefined,
                        }}
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

      {/* Modern Profile & Action Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2.5">
        {/* User Identity Box */}
        <div className="flex items-center space-x-2.5 px-1 py-1">
          <UserAvatar user={user} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-white truncate leading-tight">{user?.name || 'Staff User'}</p>
            <div className="mt-0.5">
              <RoleBadge role={user?.role || 'cashier'} className="text-[9px] px-1.5 py-0" />
            </div>
          </div>
        </div>

        {/* Lock Terminal Quick Button */}
        <button
          onClick={lockTerminal}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 active:bg-blue-600 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-extrabold transition-all cursor-pointer shadow-xs"
          title="Lock terminal session (PIN required to unlock)"
        >
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>Lock Terminal</span>
        </button>

        {/* System Online Status */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60 px-1">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Multi-Tenant RLS</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 font-bold">Online</span>
          </span>
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
