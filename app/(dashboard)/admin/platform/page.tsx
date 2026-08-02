'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShieldCheck, Building, Key, DollarSign, Layers, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Supermarket } from '@/types';

export default function PlatformAdminPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();

  const [editTenant, setEditTenant] = useState<Supermarket | null>(null);
  const [plan, setPlan] = useState<'free_trial' | 'starter' | 'professional' | 'enterprise'>('starter');
  const [status, setStatus] = useState<'trial' | 'active' | 'suspended' | 'expired'>('active');

  const isPlatformOwner = hasPermission('super_admin');

  const { data: supermarkets = [] } = useQuery({
    queryKey: ['platformSupermarkets'],
    queryFn: () => platformService.getAllSupermarkets(),
    enabled: isPlatformOwner,
  });

  const { data: analytics } = useQuery({
    queryKey: ['platformAnalytics'],
    queryFn: () => platformService.getPlatformAnalytics(),
    enabled: isPlatformOwner,
  });

  const updateSubMutation = useMutation({
    mutationFn: ({ id, p, s }: { id: string; p: any; s: any }) =>
      platformService.updateSubscription(id, p, s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformSupermarkets'] });
      queryClient.invalidateQueries({ queryKey: ['platformAnalytics'] });
      setEditTenant(null);
    },
  });

  const handleSaveSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTenant) return;
    updateSubMutation.mutate({ id: editTenant.id, p: plan, s: status });
  };

  if (!isPlatformOwner) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Global SaaS Platform Administration requires Platform Owner or Super Admin credentials.
        </p>
        <Badge variant="danger">Role: {user?.role || 'Manager'}</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Global SaaS Platform Control Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage thousands of registered supermarket tenants, SaaS plans, licenses, and platform revenue</p>
        </div>
        <Badge variant="info" className="text-xs py-1 px-3 mt-3 sm:mt-0">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          Platform Owner Mode
        </Badge>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Organizations</p>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{analytics?.totalOrganizations || 0} Tenants</h2>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-emerald-700 uppercase">Active Subscriptions</p>
          <h2 className="text-2xl font-black text-emerald-900 mt-1">{analytics?.activeSubscriptions || 0} Active</h2>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <p className="text-xs font-bold text-purple-700 uppercase">Total Store Branches</p>
          <h2 className="text-2xl font-black text-purple-900 mt-1">{analytics?.totalBranches || 0} Branches</h2>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <p className="text-xs font-bold text-amber-700 uppercase">Platform Gross Volume</p>
          <h2 className="text-2xl font-black text-amber-900 mt-1">{formatCurrency(analytics?.totalRevenue || 0)}</h2>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supermarket Tenant Registry</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Supermarket Name</th>
                <th className="p-3">Plan Tier</th>
                <th className="p-3">Status</th>
                <th className="p-3">License Key</th>
                <th className="p-3">Max Branches</th>
                <th className="p-3">Date Registered</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supermarkets.map((sm) => (
                <tr key={sm.id} className="hover:bg-slate-50">
                  <td className="p-3 font-extrabold text-slate-900">{sm.name}</td>
                  <td className="p-3 uppercase font-extrabold text-blue-600">{sm.subscription_plan}</td>
                  <td className="p-3">
                    {sm.subscription_status === 'active' ? (
                      <Badge variant="success">Active</Badge>
                    ) : sm.subscription_status === 'suspended' ? (
                      <Badge variant="danger">Suspended</Badge>
                    ) : (
                      <Badge variant="warning">Trial</Badge>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-500">{sm.license_key || 'LIC-STD-2026'}</td>
                  <td className="p-3 font-black">{sm.max_branches}</td>
                  <td className="p-3 text-slate-400">{formatDateTime(sm.created_at)}</td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditTenant(sm);
                        setPlan(sm.subscription_plan as any);
                        setStatus(sm.subscription_status as any);
                      }}
                      className="text-[11px] font-bold"
                    >
                      Manage Plan
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit SaaS Subscription Modal */}
      <Dialog isOpen={!!editTenant} onClose={() => setEditTenant(null)} title={`Manage SaaS Subscription: ${editTenant?.name}`}>
        <form onSubmit={handleSaveSubscription} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Plan Tier</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
            >
              <option value="free_trial">Free Trial</option>
              <option value="starter">Starter Plan (1 Branch)</option>
              <option value="professional">Professional Plan (5 Branches)</option>
              <option value="enterprise">Enterprise Plan (Unlimited Branches)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
            >
              <option value="trial">Trialing</option>
              <option value="active">Active Subscription</option>
              <option value="suspended">Suspended Account</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" disabled={updateSubMutation.isPending}>
            {updateSubMutation.isPending ? 'Saving...' : 'Update Subscription'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
