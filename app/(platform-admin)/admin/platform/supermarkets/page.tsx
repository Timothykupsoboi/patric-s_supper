'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformAdminService } from '@/services/platformAdminService';
import { CreateSupermarketModal } from '@/components/platform/CreateSupermarketModal';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/utils';
import {
  Store,
  Search,
  Check,
  Ban,
  Trash2,
  Key,
  Building,
  Info,
  CheckCircle2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Supermarket } from '@/types';

export default function PlatformSupermarketsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: supermarkets = [] } = useQuery({
    queryKey: ['platformSupermarketsList'],
    queryFn: () => platformAdminService.getSupermarkets(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => platformAdminService.approveSupermarket(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformSupermarketsList'] }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      platformAdminService.suspendSupermarket(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformSupermarketsList'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformAdminService.deleteSupermarket(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformSupermarketsList'] }),
  });

  const filteredSupermarkets = supermarkets.filter((sm) => {
    const matchesSearch =
      sm.name.toLowerCase().includes(search.toLowerCase()) ||
      sm.subscription_plan.toLowerCase().includes(search.toLowerCase()) ||
      (sm.license_key && sm.license_key.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || sm.subscription_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Store className="w-6 h-6 text-indigo-400" />
            <span>Supermarket Tenant Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Register new supermarkets, manage subscription tiers, suspend, reactivate, or inspect tenant accounts
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-xs"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Supermarket
        </Button>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <Input
            placeholder="Search supermarket, plan, or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-xs text-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 px-3 py-2 rounded-xl"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trial">Trialing</option>
          </select>
        </div>
      </div>

      {/* Supermarkets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Supermarket Name</th>
                <th className="p-4">Plan Tier</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">License Key</th>
                <th className="p-4">Max Branches</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSupermarkets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 font-mono">
                    No supermarkets found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSupermarkets.map((sm) => (
                  <tr key={sm.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-black text-white">{sm.name}</td>
                    <td className="p-4 uppercase font-extrabold text-indigo-400">{sm.subscription_plan}</td>
                    <td className="p-4">
                      {sm.subscription_status === 'active' ? (
                        <Badge variant="success">Active</Badge>
                      ) : sm.subscription_status === 'suspended' ? (
                        <Badge variant="danger">Suspended</Badge>
                      ) : (
                        <Badge variant="warning">Trial</Badge>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-300">{sm.license_key || 'LIC-PATRICK-2026'}</td>
                    <td className="p-4 font-black text-slate-200">{sm.max_branches || 1}</td>
                    <td className="p-4 text-slate-400 font-mono">{formatDateTime(sm.created_at)}</td>
                    <td className="p-4 text-right space-x-1.5">
                      {/* Navigate to Dedicated Details Page */}
                      <Link href={`/admin/platform/supermarkets/${sm.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] font-bold py-1 bg-slate-950 text-indigo-300 border-slate-800 hover:bg-slate-800"
                        >
                          <Info className="w-3.5 h-3.5 mr-1" />
                          Details
                        </Button>
                      </Link>

                      {/* Approve Supermarket */}
                      {sm.subscription_status !== 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => approveMutation.mutate(sm.id)}
                          className="text-[11px] font-bold py-1 bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                      )}

                      {/* Suspend / Reactivate */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => suspendMutation.mutate({ id: sm.id, status: sm.subscription_status })}
                        className={`text-[11px] font-bold py-1 ${
                          sm.subscription_status === 'suspended'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                            : 'bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900'
                        }`}
                      >
                        {sm.subscription_status === 'suspended' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Reactivate
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            Suspend
                          </>
                        )}
                      </Button>

                      {/* Soft Delete */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete supermarket organization "${sm.name}"?`)) {
                            deleteMutation.mutate(sm.id);
                          }
                        }}
                        className="text-[11px] font-bold py-1 bg-red-950 text-red-300 border-red-800 hover:bg-red-900"
                        title="Delete Supermarket"
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
      </div>

      {/* Create Supermarket Modal Component */}
      <CreateSupermarketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
