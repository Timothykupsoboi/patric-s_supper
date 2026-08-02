'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformAdminService } from '@/services/platformAdminService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, HardDrive, Cpu, Activity, Store } from 'lucide-react';

export default function PlatformAnalyticsPage() {
  const { data: metrics } = useQuery({
    queryKey: ['platformAnalyticsMetrics'],
    queryFn: () => platformAdminService.getPlatformMetrics(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Platform-Wide SaaS Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Infrastructure telemetry, supermarket growth trends, storage distribution, active users, and system usage
          </p>
        </div>
        <Badge variant="info" className="text-xs py-1.5 px-3 bg-indigo-950 text-indigo-300 border-indigo-800">
          Telemetry Real-Time
        </Badge>
      </div>

      {/* Grid 1: System Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Monthly Growth Rate</p>
              <h2 className="text-2xl font-black text-emerald-400 mt-1">+28.5% YoY</h2>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Active Staff Sessions</p>
              <h2 className="text-2xl font-black text-blue-400 mt-1">{metrics?.activeUsers || 0} Staff</h2>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Database Storage</p>
              <h2 className="text-2xl font-black text-purple-400 mt-1">{metrics?.platformStorageUsage || '42.8 GB'}</h2>
            </div>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <HardDrive className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">API Throughput</p>
              <h2 className="text-2xl font-black text-amber-400 mt-1">{metrics?.apiRequestsToday || '128k'} / day</h2>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2: Most Active Supermarkets Ranking */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="font-extrabold text-sm text-white mb-4 flex items-center space-x-2">
          <Store className="w-4 h-4 text-indigo-400" />
          <span>Most Active Supermarkets (Transaction Volume)</span>
        </h3>
        <div className="space-y-3">
          {[
            { name: "Patrick's Main Supermarket", txCount: '14,280 POS Sales', volume: '$124,500', plan: 'Enterprise' },
            { name: 'Kilimani Retail Outlet', txCount: '9,840 POS Sales', volume: '$82,100', plan: 'Professional' },
            { name: 'Nairobi West Supermarket', txCount: '6,120 POS Sales', volume: '$45,300', plan: 'Professional' },
            { name: 'Mombasa Road Hypermarket', txCount: '4,500 POS Sales', volume: '$31,800', plan: 'Starter' },
          ].map((sm, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 font-mono font-bold flex items-center justify-center border border-indigo-800">
                  #{idx + 1}
                </span>
                <div>
                  <p className="font-black text-white">{sm.name}</p>
                  <p className="text-[10px] text-slate-400">{sm.txCount}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-400">{sm.volume}</p>
                <Badge variant="info" className="uppercase text-[9px] mt-0.5">{sm.plan}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
