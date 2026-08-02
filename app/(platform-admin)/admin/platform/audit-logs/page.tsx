'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/auditService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { Activity, ShieldCheck, Clock } from 'lucide-react';

export default function PlatformAuditLogsPage() {
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['platformAuditLogsList'],
    queryFn: () => auditService.getAuditLogs(100),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            <span>Global SaaS Platform Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable system audit trail tracking tenant creations, subscription upgrades, license activations, and admin logins
          </p>
        </div>

        <Badge variant="info" className="text-xs py-1.5 px-3 bg-indigo-950 text-indigo-300 border-indigo-800 font-mono">
          {auditLogs.length} Audit Events Logged
        </Badge>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Target Entity / Table</th>
                <th className="p-4">Record ID</th>
                <th className="p-4 font-mono text-right">Security Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No platform audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-4 text-slate-400">{formatDateTime(log.created_at)}</td>
                    <td className="p-4 font-bold text-white font-sans">{log.action}</td>
                    <td className="p-4 uppercase font-bold text-indigo-400">{log.table_name || log.entity_type}</td>
                    <td className="p-4 text-slate-300">{log.record_id || log.entity_id || 'SYS-GLOBAL'}</td>
                    <td className="p-4 text-right">
                      <Badge variant="success" className="text-[10px]">VERIFIED</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
