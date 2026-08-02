'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformService, SupportTicket } from '@/services/platformService';
import { auditService } from '@/services/auditService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ShieldCheck,
  Building,
  Key,
  DollarSign,
  Layers,
  CheckCircle2,
  ShieldAlert,
  Search,
  Check,
  Ban,
  Trash2,
  RefreshCw,
  HelpCircle,
  Activity,
  Sliders,
  Store,
  Sparkles,
} from 'lucide-react';
import { Supermarket } from '@/types';

export default function PlatformAdminPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'supermarkets' | 'analytics' | 'support' | 'audit_logs' | 'settings'>(
    'supermarkets'
  );
  const [search, setSearch] = useState('');
  const [editTenant, setEditTenant] = useState<Supermarket | null>(null);
  const [plan, setPlan] = useState<'free_trial' | 'starter' | 'professional' | 'enterprise'>('starter');
  const [status, setStatus] = useState<'trial' | 'active' | 'suspended' | 'expired'>('active');

  // Global Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [trialDuration, setTrialDuration] = useState('14');
  const [systemNotice, setSystemNotice] = useState('Welcome to Patrick Supermarket SaaS v2.5');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const isPlatformOwner = user?.role === 'platform_owner';

  // Queries
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

  const { data: supportTickets = [] } = useQuery({
    queryKey: ['supportTickets'],
    queryFn: () => platformService.getSupportTickets(),
    enabled: isPlatformOwner,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => auditService.getAuditLogs(50),
    enabled: isPlatformOwner,
  });

  // Mutations
  const updateSubMutation = useMutation({
    mutationFn: ({ id, p, s }: { id: string; p: any; s: any }) =>
      platformService.updateSubscription(id, p, s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformSupermarkets'] });
      queryClient.invalidateQueries({ queryKey: ['platformAnalytics'] });
      setEditTenant(null);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => platformService.approveSupermarket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformSupermarkets'] });
      queryClient.invalidateQueries({ queryKey: ['platformAnalytics'] });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      platformService.suspendSupermarket(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformSupermarkets'] });
      queryClient.invalidateQueries({ queryKey: ['platformAnalytics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformService.deleteSupermarket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformSupermarkets'] });
      queryClient.invalidateQueries({ queryKey: ['platformAnalytics'] });
    },
  });

  const licenseMutation = useMutation({
    mutationFn: (id: string) => platformService.generateLicenseKey(id),
    onSuccess: (newKey) => {
      queryClient.invalidateQueries({ queryKey: ['platformSupermarkets'] });
      alert(`New License Key Generated: ${newKey}`);
    },
  });

  const handleSaveSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTenant) return;
    updateSubMutation.mutate({ id: editTenant.id, p: plan, s: status });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  if (!isPlatformOwner) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Global SaaS Platform Control Center requires Platform Owner role credentials.
        </p>
        <Badge variant="danger">Role: {user?.role || 'Supermarket Owner'}</Badge>
      </div>
    );
  }

  const filteredSupermarkets = supermarkets.filter(
    (sm) =>
      sm.name.toLowerCase().includes(search.toLowerCase()) ||
      sm.subscription_plan.toLowerCase().includes(search.toLowerCase()) ||
      (sm.license_key && sm.license_key.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Global SaaS Platform Control Center
            </h1>
            <Badge variant="info" className="uppercase text-[10px] font-black">
              Platform Owner
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registered supermarket tenants, SaaS subscription plans, license keys, and platform revenue
          </p>
        </div>
        <Badge variant="success" className="text-xs py-1 px-3 mt-3 sm:mt-0">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          SaaS Engine Online
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

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: 'supermarkets', label: `Supermarket Registry (${supermarkets.length})`, icon: Store },
          { id: 'support', label: `Support Tickets (${supportTickets.length})`, icon: HelpCircle },
          { id: 'audit_logs', label: `Platform Audit Logs (${auditLogs.length})`, icon: Activity },
          { id: 'settings', label: `Platform Settings`, icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Supermarket Registry */}
      {activeTab === 'supermarkets' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle>Registered Supermarket Tenants</CardTitle>
            <div className="w-full sm:w-64 mt-2 sm:mt-0 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search tenant name or license..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs py-1.5"
              />
            </div>
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
                  <th className="p-3">Registered Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSupermarkets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">
                      No supermarket tenants found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSupermarkets.map((sm) => (
                    <tr key={sm.id} className="hover:bg-slate-50">
                      <td className="p-3 font-extrabold text-slate-900">{sm.name}</td>
                      <td className="p-3 uppercase font-extrabold text-blue-600">{sm.subscription_plan}</td>
                      <td className="p-3">
                        {sm.subscription_status === 'active' ? (
                          <Badge variant="success">Active</Badge>
                        ) : sm.subscription_status === 'suspended' ? (
                          <Badge variant="danger">Suspended</Badge>
                        ) : (
                          <Badge variant="warning">Trialing</Badge>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">{sm.license_key || 'LIC-STD-2026'}</td>
                      <td className="p-3 font-black">{sm.max_branches || 1}</td>
                      <td className="p-3 text-slate-400">{formatDateTime(sm.created_at)}</td>
                      <td className="p-3 text-right space-x-1">
                        {/* Approve Supermarket */}
                        {sm.subscription_status !== 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveMutation.mutate(sm.id)}
                            className="text-[11px] font-bold py-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            title="Approve Supermarket"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                        )}

                        {/* Suspend / Activate */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            suspendMutation.mutate({ id: sm.id, status: sm.subscription_status })
                          }
                          className={`text-[11px] font-bold py-1 ${
                            sm.subscription_status === 'suspended'
                              ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                              : 'text-amber-700 border-amber-300 hover:bg-amber-50'
                          }`}
                          title={sm.subscription_status === 'suspended' ? 'Activate Supermarket' : 'Suspend Supermarket'}
                        >
                          {sm.subscription_status === 'suspended' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Activate
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5 mr-1" />
                              Suspend
                            </>
                          )}
                        </Button>

                        {/* Manage Subscription Plan */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditTenant(sm);
                            setPlan(sm.subscription_plan as any);
                            setStatus(sm.subscription_status as any);
                          }}
                          className="text-[11px] font-bold py-1 text-blue-700 border-blue-300 hover:bg-blue-50"
                        >
                          Manage Plan
                        </Button>

                        {/* Generate / Renew License Key */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => licenseMutation.mutate(sm.id)}
                          className="text-[11px] font-bold py-1 text-purple-700 border-purple-300 hover:bg-purple-50"
                          title="Generate / Renew License Key"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </Button>

                        {/* Delete Supermarket */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete supermarket tenant "${sm.name}"?`)) {
                              deleteMutation.mutate(sm.id);
                            }
                          }}
                          className="text-[11px] font-bold py-1 text-red-600 border-red-200 hover:bg-red-50"
                          title="Delete Supermarket Tenant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Support Tickets */}
      {activeTab === 'support' && (
        <Card>
          <CardHeader>
            <CardTitle>SaaS Supermarket Tenant Support Queue</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Ticket ID</th>
                  <th className="p-3">Supermarket Tenant</th>
                  <th className="p-3">Subject / Issue</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supportTickets.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{st.id}</td>
                    <td className="p-3 font-extrabold text-slate-800">{st.supermarket_name}</td>
                    <td className="p-3 font-bold text-slate-700">{st.subject}</td>
                    <td className="p-3">
                      {st.priority === 'urgent' || st.priority === 'high' ? (
                        <Badge variant="danger">{st.priority.toUpperCase()}</Badge>
                      ) : (
                        <Badge variant="warning">{st.priority.toUpperCase()}</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="success">{st.status.toUpperCase()}</Badge>
                    </td>
                    <td className="p-3 text-slate-400">{formatDateTime(st.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Platform Audit Logs */}
      {activeTab === 'audit_logs' && (
        <Card>
          <CardHeader>
            <CardTitle>Global Platform Audit Trail</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User Action</th>
                  <th className="p-3">Table / Entity</th>
                  <th className="p-3">Record ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400">{formatDateTime(log.created_at)}</td>
                    <td className="p-3 font-bold text-slate-900">{log.action}</td>
                    <td className="p-3 uppercase font-extrabold text-blue-600">{log.table_name || log.entity_type}</td>
                    <td className="p-3 font-mono text-slate-500">{log.record_id || log.entity_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Platform Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Global Platform Configurations</CardTitle>
            </CardHeader>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <Input
                label="Global Broadcast System Notice"
                value={systemNotice}
                onChange={(e) => setSystemNotice(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Default Free Trial Duration (Days)"
                  type="number"
                  value={trialDuration}
                  onChange={(e) => setTrialDuration(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance Mode</label>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-extrabold border transition-all ${
                      maintenanceMode
                        ? 'bg-red-600 text-white border-red-700'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {maintenanceMode ? 'Maintenance Mode ACTIVE' : 'System Operating Normally'}
                  </button>
                </div>
              </div>

              {settingsSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl">
                  Platform Settings Updated Successfully!
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
                Save Platform Settings
              </Button>
            </form>
          </Card>
        </div>
      )}

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
