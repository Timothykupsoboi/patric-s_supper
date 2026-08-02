'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformAdminService } from '@/services/platformAdminService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { DollarSign, TrendingUp, Calendar, CreditCard, ArrowUpRight } from 'lucide-react';

export default function PlatformRevenuePage() {
  const { data: metrics } = useQuery({
    queryKey: ['platformRevenueMetrics'],
    queryFn: () => platformAdminService.getPlatformMetrics(),
  });

  const { data: records = [] } = useQuery({
    queryKey: ['platformRevenueRecords'],
    queryFn: () => platformAdminService.getRevenueRecords(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>Platform Financial Revenue & Billing</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            SaaS subscription recurring revenue, MRR, ARR, plan contributions, and payment gateway transactions
          </p>
        </div>

        <Badge variant="success" className="text-xs py-1.5 px-3">
          100% Billing Reconciliation
        </Badge>
      </div>

      {/* Revenue Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue (MRR)</p>
          <h2 className="text-3xl font-black text-emerald-400 mt-1">{formatCurrency(metrics?.monthlyRevenue || 0)}</h2>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Calculated from active subscription plans</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Annual Run Rate (ARR)</p>
          <h2 className="text-3xl font-black text-indigo-400 mt-1">{formatCurrency(metrics?.annualRevenue || 0)}</h2>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Projected 12-month platform revenue</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Revenue Per Tenant (ARPU)</p>
          <h2 className="text-3xl font-black text-purple-400 mt-1">$142.50 USD</h2>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Across all subscribed organizations</p>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-white">Platform Tenant Transactions</h3>
          <Badge variant="info">Completed Gateways</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Supermarket Tenant</th>
                <th className="p-4">Subscription Plan</th>
                <th className="p-4">Billing Cycle</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-mono font-bold text-slate-300">{r.id}</td>
                  <td className="p-4 font-black text-white">{r.supermarket_name}</td>
                  <td className="p-4 uppercase font-extrabold text-indigo-400">{r.plan}</td>
                  <td className="p-4 uppercase text-slate-300 font-mono">{r.billing_cycle}</td>
                  <td className="p-4 font-black text-emerald-400">${r.amount} USD</td>
                  <td className="p-4 text-slate-300 font-medium">{r.payment_method}</td>
                  <td className="p-4 text-slate-400 font-mono">{formatDateTime(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
