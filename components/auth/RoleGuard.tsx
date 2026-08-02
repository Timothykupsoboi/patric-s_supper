'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authService, PermissionKey } from '@/services/authService';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RoleGuardProps {
  children: React.ReactNode;
}

// Map application routes to required RBAC permission key
const ROUTE_PERMISSIONS: Record<string, PermissionKey> = {
  '/dashboard': 'reports.view',
  '/pos': 'sales.create',
  '/inventory': 'products.view',
  '/customers': 'customers.manage',
  '/reports': 'reports.view',
  '/expenses': 'expenses.manage',
  '/suppliers': 'suppliers.manage',
  '/employees': 'employees.manage',
  '/branches': 'branches.manage',
  '/settings': 'settings.manage',
};

// Default redirect path per role if unauthorized
const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  supermarket_owner: '/dashboard',
  super_admin: '/dashboard',
  owner: '/dashboard',
  branch_manager: '/dashboard',
  manager: '/dashboard',
  supervisor: '/dashboard',
  cashier: '/pos',
  store_keeper: '/inventory',
  inventory_manager: '/inventory',
  accountant: '/reports',
  customer_service: '/customers',
  procurement_officer: '/suppliers',
  platform_owner: '/admin/platform',
};

export function RoleGuard({ children }: RoleGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, lockTerminal } = useAuth();

  if (loading) {
    return <>{children}</>;
  }

  if (!user) {
    return <>{children}</>;
  }

  // Find required permission for current route
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (matchedRoute) {
    const requiredPermission = ROUTE_PERMISSIONS[matchedRoute];
    const isAllowed = authService.hasPermission(user.role, requiredPermission);

    if (!isAllowed) {
      const defaultRoute = ROLE_DEFAULT_ROUTES[user.role] || '/pos';

      return (
        <div className="h-[75vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto my-6 space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center border border-red-200 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Your active terminal employee role <strong className="text-slate-900 uppercase">({user.role.replace('_', ' ')})</strong> does not have clearance to view this module.
            </p>
          </div>

          <div className="flex items-center space-x-2 py-1">
            <Badge variant="danger" className="uppercase font-mono text-[10px]">
              Missing Permission: {requiredPermission}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 w-full">
            <Button
              onClick={() => router.replace(defaultRoute)}
              className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 font-bold text-xs py-2.5"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Go to Allowed Module
            </Button>
            <Button
              variant="outline"
              onClick={lockTerminal}
              className="w-full sm:w-1/2 border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2.5"
            >
              <Lock className="w-4 h-4 mr-1.5" />
              Switch Terminal Staff
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
