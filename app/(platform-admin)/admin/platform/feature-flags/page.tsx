'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformAdminService, FeatureFlag } from '@/services/platformAdminService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flag, Check, X, Shield, Plus } from 'lucide-react';

export default function PlatformFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);

  const { data: initialFlags = [] } = useQuery({
    queryKey: ['platformFeatureFlagsList'],
    queryFn: async () => {
      const res = await platformAdminService.getFeatureFlags();
      setFlags(res);
      return res;
    },
  });

  const toggleFlag = (flagId: string) => {
    setFlags(
      flags.map((f) => (f.id === flagId ? { ...f, enabled: !f.enabled } : f))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Flag className="w-6 h-6 text-indigo-400" />
            <span>Platform Feature Flags & Plan Gating</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamically toggle platform modules, APIs, and assign features to subscription plan tiers
          </p>
        </div>

        <Badge variant="info" className="text-xs py-1.5 px-3 bg-indigo-950 text-indigo-300 border-indigo-800">
          {flags.filter((f) => f.enabled).length} / {flags.length} Active Flags
        </Badge>
      </div>

      {/* Feature Flags Grid */}
      <div className="space-y-4">
        {flags.map((flag) => (
          <div key={flag.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-indigo-400 font-bold">{flag.key}</span>
                <Badge variant={flag.enabled ? 'success' : 'danger'}>
                  {flag.enabled ? 'ENABLED' : 'DISABLED'}
                </Badge>
              </div>
              <h3 className="font-extrabold text-white text-sm">{flag.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{flag.description}</p>

              <div className="pt-2 flex items-center space-x-2 text-[10px] font-mono">
                <span className="text-slate-500 font-bold uppercase">Assigned Plan Tiers:</span>
                {flag.assigned_plans.map((p) => (
                  <Badge key={p} variant="info" className="uppercase">{p}</Badge>
                ))}
              </div>
            </div>

            <button
              onClick={() => toggleFlag(flag.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 border ${
                flag.enabled
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                  : 'bg-red-950 text-red-300 border-red-800 hover:bg-red-900'
              }`}
            >
              {flag.enabled ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Feature Enabled</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  <span>Feature Disabled</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
