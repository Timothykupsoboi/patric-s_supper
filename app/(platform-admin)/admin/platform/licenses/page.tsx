'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformAdminService, PlatformLicense } from '@/services/platformAdminService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/utils';
import { Key, Plus, RefreshCw, CheckCircle2, Ban, Search } from 'lucide-react';

export default function PlatformLicensesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: licenses = [] } = useQuery({
    queryKey: ['platformLicensesList'],
    queryFn: () => platformAdminService.getLicenses(),
  });

  const licenseMutation = useMutation({
    mutationFn: (id: string) => platformAdminService.generateLicenseKey(id),
    onSuccess: (newKey) => {
      queryClient.invalidateQueries({ queryKey: ['platformLicensesList'] });
      alert(`License Generated & Renewed: ${newKey}`);
    },
  });

  const filteredLicenses = licenses.filter(
    (l) =>
      l.supermarket_name.toLowerCase().includes(search.toLowerCase()) ||
      l.license_key.toLowerCase().includes(search.toLowerCase()) ||
      l.plan_tier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Key className="w-6 h-6 text-indigo-400" />
            <span>Software License Key Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Generate, activate, suspend, renew, and inspect expiration dates for supermarket tenant license keys
          </p>
        </div>

        <Badge variant="info" className="text-xs py-1.5 px-3 bg-indigo-950 text-indigo-300 border-indigo-800">
          {licenses.length} Registered Licenses
        </Badge>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <Input
            placeholder="Search by supermarket or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-xs text-white"
          />
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Supermarket Tenant</th>
                <th className="p-4">License Key</th>
                <th className="p-4">Plan Tier</th>
                <th className="p-4">License Status</th>
                <th className="p-4">Activated Date</th>
                <th className="p-4">Expiration Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLicenses.map((lic) => (
                <tr key={lic.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-black text-white">{lic.supermarket_name}</td>
                  <td className="p-4 font-mono font-bold text-indigo-300">{lic.license_key}</td>
                  <td className="p-4 uppercase font-extrabold text-blue-400">{lic.plan_tier}</td>
                  <td className="p-4">
                    {lic.status === 'active' ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="danger">Suspended</Badge>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 font-mono">{formatDateTime(lic.activated_at)}</td>
                  <td className="p-4 text-emerald-400 font-mono font-bold">{formatDateTime(lic.expires_at)}</td>
                  <td className="p-4 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => licenseMutation.mutate(lic.supermarket_id)}
                      className="text-[11px] font-bold py-1 bg-indigo-950 text-indigo-300 border-indigo-800 hover:bg-indigo-900"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Generate / Renew
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
