'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Search, Bell, Activity, Sparkles } from 'lucide-react';

export function PlatformHeader() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between text-slate-100 sticky top-0 z-40 shadow-md">
      {/* Global Search Bar */}
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search supermarkets, licenses, subscription plans, tickets..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Header Status Controls */}
      <div className="flex items-center space-x-4">
        {/* System Operational Badge */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 text-[11px] font-mono text-emerald-400">
          <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span>SaaS Engine 100% Operational</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
        </button>

        {/* Platform Owner Badge */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-extrabold text-white leading-tight">{user?.name || 'Platform Owner'}</p>
            <p className="text-[10px] text-indigo-400 font-mono font-semibold uppercase">Global SaaS Admin</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-xs shadow-md border border-indigo-400/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
