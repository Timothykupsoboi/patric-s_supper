'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { platformAdminService } from '@/services/platformAdminService';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, Loader2 } from 'lucide-react';
import { Supermarket } from '@/types';

interface EditSupermarketModalProps {
  supermarket: Supermarket | null;
  onClose: () => void;
}

export function EditSupermarketModal({ supermarket, onClose }: EditSupermarketModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [plan, setPlan] = useState('starter');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    if (supermarket) {
      setName(supermarket.name || '');
      setAddress(supermarket.address || '');
      setLogoUrl(supermarket.logo_url || '');
      setPlan(supermarket.subscription_plan || 'starter');
      setStatus(supermarket.subscription_status || 'active');
    }
  }, [supermarket]);

  const editMutation = useMutation({
    mutationFn: () =>
      platformAdminService.updateSupermarketTenant(supermarket!.id, {
        name,
        address,
        logo_url: logoUrl,
        subscription_plan: plan,
        subscription_status: status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformSupermarketsList'] });
      queryClient.invalidateQueries({ queryKey: ['platformMetrics'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supermarket) return;
    editMutation.mutate();
  };

  return (
    <Dialog isOpen={!!supermarket} onClose={onClose} title={`Edit Supermarket: ${supermarket?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <Input
          label="Supermarket Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-slate-950 border-slate-800 text-white"
          required
        />

        <Input
          label="Business Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="bg-slate-950 border-slate-800 text-white"
        />

        <Input
          label="Logo URL"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="bg-slate-950 border-slate-800 text-white"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Subscription Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-bold"
            >
              <option value="free_trial">Free Trial</option>
              <option value="starter">Starter Plan</option>
              <option value="professional">Professional Plan</option>
              <option value="enterprise">Enterprise Plan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-bold"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trialing</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-slate-900 border-slate-800 text-slate-300 font-bold">
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={editMutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs flex items-center justify-center space-x-2"
          >
            {editMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
