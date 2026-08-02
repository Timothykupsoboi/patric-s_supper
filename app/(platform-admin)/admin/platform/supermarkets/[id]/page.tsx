'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformAdminService } from '@/services/platformAdminService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/utils';
import {
  Store,
  ArrowLeft,
  UserCheck,
  Building,
  Users,
  HardDrive,
  CreditCard,
  Key,
  Ban,
  CheckCircle2,
  Lock,
  Activity,
  Edit,
  Globe,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function SupermarketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const supermarketId = params.id as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'audit_logs'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  const { data: tenantDetails, isLoading } = useQuery({
    queryKey: ['platformSupermarketDetail', supermarketId],
    queryFn: () => platformAdminService.getSupermarketById(supermarketId),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      platformAdminService.suspendSupermarket(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformSupermarketDetail', supermarketId] });
      queryClient.invalidateQueries({ queryKey: ['platformSupermarketsList'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (ownerId: string) => platformAdminService.resetOwnerPassword(ownerId),
    onSuccess: () => {
      setPasswordResetSuccess(true);
      setTimeout(() => setPasswordResetSuccess(false), 4000);
    },
  });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-indigo-400">Loading Supermarket Details...</p>
      </div>
    );
  }

  if (!tenantDetails || !tenantDetails.supermarket) {
    return (
      <div className="space-y-4 text-center py-12">
        <h2 className="text-xl font-bold text-white">Supermarket Tenant Not Found</h2>
        <Link href="/admin/platform/supermarkets">
          <Button variant="outline" className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Supermarkets List
          </Button>
        </Link>
      </div>
    );
  }

  const { supermarket, owner, branchCount, employeeCount, auditLogs } = tenantDetails;

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Link href="/admin/platform/supermarkets">
          <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">{supermarket.name}</h1>
              <Badge
                variant={
                  supermarket.subscription_status === 'active'
                    ? 'success'
                    : supermarket.subscription_status === 'suspended'
                    ? 'danger'
                    : 'warning'
                }
              >
                {supermarket.subscription_status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Tenant ID: {supermarket.id}</p>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() =>
                suspendMutation.mutate({ id: supermarket.id, status: supermarket.subscription_status })
              }
              variant="outline"
              size="sm"
              className={`text-xs font-bold ${
                supermarket.subscription_status === 'suspended'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                  : 'bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900'
              }`}
            >
              {supermarket.subscription_status === 'suspended' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Reactivate Supermarket
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5 mr-1" /> Suspend Supermarket
                </>
              )}
            </Button>

            {owner && (
              <Button
                onClick={() => resetPasswordMutation.mutate(owner.id)}
                variant="outline"
                size="sm"
                className="bg-indigo-950 text-indigo-300 border-indigo-800 hover:bg-indigo-900 text-xs font-bold"
              >
                <Lock className="w-3.5 h-3.5 mr-1" /> Reset Owner Password
              </Button>
            )}
          </div>
        </div>
      </div>

      {passwordResetSuccess && (
        <div className="p-4 bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold rounded-xl text-xs">
          ✓ Password reset instructions generated & sent to Supermarket Owner email ({owner?.email})!
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Tenant Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'audit_logs'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Tenant Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organization & Subscription Overview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <Store className="w-4 h-4 text-indigo-400" />
                <span>Supermarket Tenant Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Supermarket Name</span>
                  <p className="font-black text-white text-sm">{supermarket.name}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">License Key</span>
                  <p className="font-mono font-extrabold text-indigo-300">{supermarket.license_key || 'LIC-PATRICK-2026'}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Subscription Tier</span>
                  <p className="font-black uppercase text-indigo-400">{supermarket.subscription_plan}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Account Status</span>
                  <p className="font-black uppercase text-emerald-400">{supermarket.subscription_status}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">HQ Business Address</span>
                  <p className="font-medium text-slate-200">{supermarket.address || 'Nairobi, Kenya'}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Created Date</span>
                  <p className="font-mono text-slate-300">{formatDateTime(supermarket.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Active Branches</p>
                <h4 className="text-2xl font-black text-white mt-1">{branchCount} / {supermarket.max_branches} Max</h4>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Staff & Employees</p>
                <h4 className="text-2xl font-black text-blue-400 mt-1">{employeeCount} Users</h4>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Storage Usage</p>
                <h4 className="text-2xl font-black text-purple-400 mt-1 font-mono">1.2 GB</h4>
              </div>
            </div>
          </div>

          {/* Owner Credentials Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Supermarket Owner Profile</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 font-bold text-[10px] uppercase">Owner Full Name</span>
                  <p className="font-extrabold text-white">{owner?.name || supermarket.owner_name || 'Supermarket Owner'}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 font-bold text-[10px] uppercase">Email Address</span>
                  <p className="font-mono text-slate-200">{owner?.email || supermarket.email || 'owner@supermarket.com'}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 font-bold text-[10px] uppercase">Phone Number</span>
                  <p className="font-mono text-slate-200">{owner?.phone || supermarket.phone || '+254 700 000 000'}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 font-bold text-[10px] uppercase">Assigned Role</span>
                  <Badge variant="info" className="uppercase font-mono text-[9px] mt-1">Supermarket Owner</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Entity</th>
                  <th className="p-4 font-mono text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">
                      No audit events logged for this supermarket.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="p-4 text-slate-400">{formatDateTime(log.created_at)}</td>
                      <td className="p-4 font-bold text-white font-sans">{log.action}</td>
                      <td className="p-4 uppercase text-indigo-400 font-bold">{log.table_name || 'SUPERMARKET'}</td>
                      <td className="p-4 text-right">
                        <Badge variant="success" className="text-[10px]">RECORDED</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
