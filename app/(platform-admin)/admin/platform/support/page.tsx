'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformAdminService, PlatformSupportTicket } from '@/services/platformAdminService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/utils';
import { LifeBuoy, MessageSquare, CheckCircle2, UserCheck, Send, Clock } from 'lucide-react';

export default function PlatformSupportPage() {
  const [tickets, setTickets] = useState<PlatformSupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<PlatformSupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');

  const { data: initialTickets = [] } = useQuery({
    queryKey: ['platformSupportTicketsList'],
    queryFn: async () => {
      const res = await platformAdminService.getSupportTickets();
      setTickets(res);
      return res;
    },
  });

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !responseText.trim()) return;

    const newResponse = {
      id: `RESP-${Date.now()}`,
      sender: 'Platform Owner Support',
      message: responseText,
      timestamp: new Date().toISOString(),
    };

    const updated = {
      ...activeTicket,
      status: 'in_progress' as const,
      responses: [...activeTicket.responses, newResponse],
    };

    setTickets(tickets.map((t) => (t.id === activeTicket.id ? updated : t)));
    setActiveTicket(updated);
    setResponseText('');
  };

  const handleCloseTicket = (ticketId: string) => {
    setTickets(
      tickets.map((t) => (t.id === ticketId ? { ...t, status: 'closed' as const } : t))
    );
    if (activeTicket?.id === ticketId) {
      setActiveTicket({ ...activeTicket, status: 'closed' as const });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <LifeBuoy className="w-6 h-6 text-indigo-400" />
            <span>SaaS Tenant Support Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage, respond to, assign, and resolve customer support tickets submitted by supermarket owners
          </p>
        </div>

        <Badge variant="info" className="text-xs py-1.5 px-3 bg-indigo-950 text-indigo-300 border-indigo-800">
          {tickets.filter((t) => t.status === 'open').length} Open Tickets
        </Badge>
      </div>

      {/* Tickets List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Ticket ID</th>
                <th className="p-4">Supermarket Tenant</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Ticket Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-mono font-bold text-indigo-300">{t.id}</td>
                  <td className="p-4">
                    <p className="font-black text-white">{t.supermarket_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{t.owner_email}</p>
                  </td>
                  <td className="p-4 font-bold text-slate-200">{t.subject}</td>
                  <td className="p-4">
                    <Badge variant={t.priority === 'urgent' || t.priority === 'high' ? 'danger' : 'warning'}>
                      {t.priority.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={t.status === 'closed' ? 'success' : t.status === 'in_progress' ? 'info' : 'warning'}>
                      {t.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-400 font-mono">{formatDateTime(t.created_at)}</td>
                  <td className="p-4 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTicket(t)}
                      className="text-[11px] font-bold py-1 bg-indigo-950 text-indigo-300 border-indigo-800 hover:bg-indigo-900"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      View & Respond
                    </Button>
                    {t.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloseTicket(t.id)}
                        className="text-[11px] font-bold py-1 bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Close Ticket
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Discussion Modal */}
      <Dialog isOpen={!!activeTicket} onClose={() => setActiveTicket(null)} title={`Support Ticket Thread: ${activeTicket?.id}`}>
        {activeTicket && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <p className="font-extrabold text-white text-sm">{activeTicket.subject}</p>
              <p className="text-[11px] text-slate-400 font-mono">From: {activeTicket.supermarket_name} ({activeTicket.owner_email})</p>
              <p className="text-slate-300 pt-2">{activeTicket.description}</p>
            </div>

            {/* Conversation Responses */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {activeTicket.responses.length === 0 ? (
                <p className="text-[11px] text-slate-500 font-mono text-center py-4">No responses sent yet.</p>
              ) : (
                activeTicket.responses.map((resp) => (
                  <div key={resp.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-slate-300">
                      <span className="text-indigo-400">{resp.sender}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{formatDateTime(resp.timestamp)}</span>
                    </div>
                    <p className="text-slate-200">{resp.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input Form */}
            {activeTicket.status !== 'closed' && (
              <form onSubmit={handleSendResponse} className="space-y-2 pt-2 border-t border-slate-800">
                <textarea
                  rows={3}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type platform owner response..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold flex items-center justify-center space-x-2">
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Response to Tenant</span>
                </Button>
              </form>
            )}

            <Button type="button" onClick={() => setActiveTicket(null)} variant="outline" className="w-full border-slate-800 font-bold">
              Close Dialog
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
