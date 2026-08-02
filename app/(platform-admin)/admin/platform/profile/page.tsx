'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, ShieldCheck, Mail, Key, ShieldAlert } from 'lucide-react';

export default function PlatformProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <span>Platform Owner Profile & Credentials</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            SaaS Platform Owner administrator account details, security credentials, and access level
          </p>
        </div>
        <Badge variant="info" className="uppercase font-mono text-xs py-1.5 px-3 bg-indigo-950 text-indigo-300 border-indigo-800">
          Level 100 System Root
        </Badge>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-2xl font-black shadow-lg border border-indigo-400/30">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">{user?.name || 'Platform Owner Administrator'}</h2>
            <p className="text-xs text-indigo-400 font-mono font-bold uppercase mt-0.5">Role: {user?.role || 'platform_owner'}</p>
            <p className="text-xs text-slate-400 mt-1">{user?.email || 'admin@patricksaas.com'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Access Clearance</span>
            <p className="font-extrabold text-emerald-400">Full Global SaaS System Root</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Supermarket Scope</span>
            <p className="font-extrabold text-indigo-400">Multi-Tenant Platform Layer (All Tenants)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
