'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformAdminService } from '@/services/platformAdminService';
import { CreateSupermarketModal } from '@/components/platform/CreateSupermarketModal';
import { EditSupermarketModal } from '@/components/platform/EditSupermarketModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/utils';
import {
  Store,
  Search,
  Check,
  Ban,
  Trash2,
  Info,
  CheckCircle2,
  Plus,
  Edit,
  UserCheck,
  Mail,
  Building,
} from 'lucide-react';
import { Supermarket } from '@/types';

export default function PlatformSupermarketsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSupermarket, setEditingSupermarket] = useState<Supermarket | null>(null);

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
      (sm.email && sm.email.toLowerCase().includes(search.toLowerCase())) ||
      (sm.owner_name && sm.owner_name.toLowerCase().includes(search.toLowerCase())) ||
      (sm.license_key && sm.license_key.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || sm.subscription_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 relative pb-16">
      {/* Header with Top-Right Create Button */}
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

        {/* Header Action Button */}
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-indigo-900/40 border border-indigo-400/30 transition-all flex items-center space-x-2 py-2.5 px-4 rounded-xl mt-3 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Supermarket</span>
        </Button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <Input
            placeholder="Search supermarket, owner, email, plan..."
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
            <option value="all">All Statuses ({supermarkets.length})</option>
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
                <th className="p-4">Logo & Supermarket</th>
                <th className="p-4">Owner Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Plan Tier</th>
                <th className="p-4">Status</th>
                <th className="p-4">Branches</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSupermarkets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-mono">
                    No supermarkets found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSupermarkets.map((sm) => (
                  <tr key={sm.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Logo & Supermarket Name */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {sm.logo_url ? (
                          <img
                            src={sm.logo_url}
                            alt={sm.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 font-black text-xs">
                            {sm.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-black text-white">{sm.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {sm.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Owner Name */}
                    <td className="p-4 font-bold text-slate-200">
                      {sm.owner_name || 'Supermarket Owner'}
                    </td>

                    {/* Email */}
                    <td className="p-4 text-slate-400 font-mono">
                      {sm.email || 'owner@supermarket.com'}
                    </td>

                    {/* Plan Tier */}
                    <td className="p-4 uppercase font-extrabold text-indigo-400">
                      {sm.subscription_plan}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {sm.subscription_status === 'active' ? (
                        <Badge variant="success">Active</Badge>
                      ) : sm.subscription_status === 'suspended' ? (
                        <Badge variant="danger">Suspended</Badge>
                      ) : (
                        <Badge variant="warning">Trial</Badge>
                      )}
                    </td>

                    {/* Branches */}
                    <td className="p-4 font-black text-slate-200">
                      {sm.max_branches || 1} Max
                    </td>

                    {/* Created Date */}
                    <td className="p-4 text-slate-400 font-mono">
                      {formatDateTime(sm.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* View Tenant Details */}
                      <Link href={`/admin/platform/supermarkets/${sm.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] font-bold py-1 bg-slate-950 text-indigo-300 border-slate-800 hover:bg-slate-800"
                          title="View Tenant Info"
                        >
                          <Info className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                      </Link>

                      {/* Edit Supermarket */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSupermarket(sm)}
                        className="text-[11px] font-bold py-1 bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                        title="Edit Supermarket"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>

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

      {/* Floating Action Plus (+) Button (FAB) at Bottom-Right */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-90 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-900/80 border-2 border-white/20 transition-all hover:scale-110 group"
        title="Create Supermarket Tenant"
      >
        <Plus className="w-7 h-7 transform group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Create Supermarket Modal */}
      <CreateSupermarketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Supermarket Modal */}
      <EditSupermarketModal
        supermarket={editingSupermarket}
        onClose={() => setEditingSupermarket(null)}
      />
    </div>
  );
}
