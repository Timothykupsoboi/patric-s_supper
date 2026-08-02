'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Platform403Props {
  userRole?: string;
}

export function Platform403({ userRole }: Platform403Props) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-violet-950/40 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        <Badge variant="danger" className="uppercase font-mono tracking-widest text-[10px] px-3 py-1 mb-3">
          Error 403 • Access Denied
        </Badge>

        <h1 className="text-2xl font-black tracking-tight text-white mb-2">
          Platform Owner Portal Restricted
        </h1>

        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          You do not have authorization to view the global SaaS Platform Administration Console. This portal is strictly restricted to Platform Owner credentials.
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-6 text-left text-xs font-mono flex items-center justify-between text-slate-400">
          <span>Current Account Role:</span>
          <span className="font-bold text-red-400 uppercase">{userRole || 'Supermarket Owner'}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Supermarket Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 text-[11px] font-mono text-slate-600 flex items-center space-x-2">
        <Lock className="w-3.5 h-3.5" />
        <span>SaaS Multi-Tenant Security Policy Level 5</span>
      </div>
    </div>
  );
}
