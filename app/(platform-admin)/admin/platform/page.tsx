'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { platformAdminService } from '@/services/platformAdminService';
import { auditService } from '@/services/auditService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Store,
  CheckCircle2,
  Ban,
  Clock,
  DollarSign,
  TrendingUp,
  Building,
  Users,
  HardDrive,
  Activity,
  LifeBuoy,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function PlatformDashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['platformMetrics'],
    queryFn: () => platformAdminService.getPlatformMetrics(),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['platformDashboardAuditLogs'],
    queryFn: () => auditService.getAuditLogs(5),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['platformDashboardTickets'],
    queryFn: () => platformAdminService.getSupportTickets(),
  });

  const openTicketsCount = tickets.filter((t) => t.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>SaaS Platform Control Center</span>
            <Badge variant="info" className="uppercase font-mono text-[10px] bg-indigo-950 text-indigo-300 border-indigo-800">
              Isolated Portal
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-tenant platform infrastructure, subscription revenues, system health, and tenant metrics overview
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{metrics?.systemHealth || '100% Operational'}</span>
        </div>
      </div>

      {/* Grid 1: Primary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Supermarkets</p>
              <h2 className="text-3xl font-black text-white mt-1">{metrics?.totalSupermarkets || 0}</h2>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Store className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <span className="text-emerald-400 font-bold">{metrics?.activeSupermarkets || 0} Active</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">{metrics?.trialSupermarkets || 0} Trial</span>
            <span>•</span>
            <span className="text-red-400 font-bold">{metrics?.suspendedSupermarkets || 0} Suspended</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly SaaS Revenue</p>
              <h2 className="text-3xl font-black text-emerald-400 mt-1">{formatCurrency(metrics?.monthlyRevenue || 0)}</h2>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] font-mono text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            <span>Annual Run-Rate: {formatCurrency(metrics?.annualRevenue || 0)}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Store Branches</p>
              <h2 className="text-3xl font-black text-purple-400 mt-1">{metrics?.totalBranches || 0}</h2>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Building className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400">
            <span>Across all active tenant organizations</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform System Users</p>
              <h2 className="text-3xl font-black text-blue-400 mt-1">{metrics?.totalUsers || 0}</h2>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-emerald-400 font-bold">
            <span>{metrics?.activeUsers || 0} Active Staff Credentials</span>
          </div>
        </div>
      </div>

      {/* Grid 2: Platform Infrastructure Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center space-x-3">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-xs font-bold text-slate-300">Storage Usage</p>
              <p className="text-sm font-black text-white font-mono">{metrics?.platformStorageUsage || '42.8 GB / 100 GB'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs font-bold text-slate-300">API Requests Today</p>
              <p className="text-sm font-black text-white font-mono">{metrics?.apiRequestsToday || '128,450'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center space-x-3">
            <LifeBuoy className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs font-bold text-slate-300">Open Support Tickets</p>
              <p className="text-sm font-black text-white font-mono">{openTicketsCount} Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 3: Platform Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Supermarket Growth Chart Mock Visualization */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-extrabold text-white">SaaS Revenue Growth Trend</h3>
            <Badge variant="success">Monthly Recurring Revenue</Badge>
          </div>
          <div className="h-48 bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-end justify-between space-x-2">
            {[35, 45, 60, 75, 90, 120, 150].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-lg transition-all"
                  style={{ height: `${val}%` }}
                />
                <span className="text-[10px] font-mono text-slate-500 mt-2">M{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Plan Distribution Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-extrabold text-white">Subscription Tier Distribution</h3>
            <Badge variant="info">Multi-Tenant Breakdown</Badge>
          </div>
          <div className="space-y-4 pt-2">
            {[
              { label: 'Starter Plan (1-2 Branches)', pct: 40, color: 'bg-blue-500', count: '5 Supermarkets' },
              { label: 'Professional Plan (Up to 10 Branches)', pct: 45, color: 'bg-indigo-500', count: '8 Supermarkets' },
              { label: 'Enterprise Plan (Unlimited Branches)', pct: 15, color: 'bg-purple-500', count: '3 Supermarkets' },
            ].map((plan, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">{plan.label}</span>
                  <span className="text-slate-400 font-mono">{plan.count} ({plan.pct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full ${plan.color}`} style={{ width: `${plan.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid 4: Recent Support Tickets & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Ticket Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-extrabold text-white">Recent Support Tickets</h3>
            <Link href="/admin/platform/support" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {tickets.map((t) => (
              <div key={t.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-extrabold text-white">{t.supermarket_name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t.subject}</p>
                </div>
                <Badge variant={t.priority === 'urgent' ? 'danger' : 'warning'}>{t.priority.toUpperCase()}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-extrabold text-white">Platform System Audit Activity</h3>
            <Link href="/admin/platform/audit-logs" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center">
              Full Logs <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-200">{log.action}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{log.table_name || 'System Entity'}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{formatDateTime(log.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
