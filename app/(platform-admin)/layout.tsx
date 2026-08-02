'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { PlatformSidebar } from '@/components/layout/PlatformSidebar';
import { PlatformHeader } from '@/components/layout/PlatformHeader';
import { Platform403 } from '@/components/auth/Platform403';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-indigo-400">Loading SaaS Control Center...</p>
        </div>
      </div>
    );
  }

  // Security Gate: Only Platform Owners can access this isolated portal
  if (!user || user.role !== 'platform_owner') {
    return <Platform403 userRole={user?.role} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <PlatformSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PlatformHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">{children}</main>
      </div>
    </div>
  );
}
