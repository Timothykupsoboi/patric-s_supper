'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService, Branch } from '@/services/branchService';
import { useTenant } from '@/context/TenantContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { Building2, Plus, MapPin, CheckCircle, Edit3 } from 'lucide-react';

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const { supermarketId, activeBranch, setBranch } = useTenant();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', supermarketId],
    queryFn: () => branchService.getBranches(supermarketId),
  });

  const createMutation = useMutation({
    mutationFn: (newBranch: Partial<Branch>) => branchService.createBranch(newBranch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsOpen(false);
      setName('');
      setLocation('');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      supermarket_id: supermarketId,
      name,
      location,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Supermarket Branch Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage store locations, branch assignments, and multi-branch data isolation</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 font-bold text-xs mt-3 sm:mt-0">
          <Plus className="w-4 h-4 mr-1.5" />
          + Add New Store Branch
        </Button>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map((b) => {
          const isCurrent = activeBranch?.id === b.id;
          return (
            <Card
              key={b.id}
              className={`transition-all hover:shadow-md ${
                isCurrent ? 'border-2 border-blue-600 bg-blue-50/30' : 'border border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{b.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {b.location || 'Central CBD'}
                    </p>
                  </div>
                </div>
                {isCurrent && <Badge variant="success">Active Context</Badge>}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400">Created: {formatDateTime(b.created_at)}</span>
                <Button
                  size="sm"
                  variant={isCurrent ? 'outline' : 'default'}
                  onClick={() => setBranch(b)}
                  className="font-bold text-[11px] py-1"
                >
                  {isCurrent ? 'Current' : 'Switch Context'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Branch Modal */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Register Supermarket Branch">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input label="Branch Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eldoret West Branch" required />
          <Input label="Physical Location / City" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Uganda Road, Eldoret" required />
          <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Registering...' : 'Save Branch'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
