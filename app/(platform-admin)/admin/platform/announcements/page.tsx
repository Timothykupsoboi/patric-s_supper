'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformAdminService, PlatformAnnouncement } from '@/services/platformAdminService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/utils';
import { Megaphone, Plus, Send, Target, Users } from 'lucide-react';

export default function PlatformAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific_supermarket' | 'specific_plan'>('all');

  const { data: initialAnnouncements = [] } = useQuery({
    queryKey: ['platformAnnouncementsList'],
    queryFn: async () => {
      const res = await platformAdminService.getAnnouncements();
      setAnnouncements(res);
      return res;
    },
  });

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const newAnn: PlatformAnnouncement = {
      id: `ANN-2026-${Date.now().toString().slice(-4)}`,
      title,
      message,
      target_type: targetType,
      created_by: 'Platform Owner',
      published_at: new Date().toISOString(),
    };

    setAnnouncements([newAnn, ...announcements]);
    setIsModalOpen(false);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            <span>Platform Broadcast Announcements</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Broadcast system notices and updates targeting all supermarkets, specific tenants, or subscription tiers
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-xs"
        >
          <Plus className="w-4 h-4 mr-1" /> Broadcast New Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Badge variant="info" className="uppercase font-mono text-[10px]">
                  {ann.target_type.replace('_', ' ')}
                </Badge>
                <h3 className="font-extrabold text-white text-sm">{ann.title}</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{formatDateTime(ann.published_at)}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              {ann.message}
            </p>

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
              <span>Published By: <strong className="text-slate-200">{ann.created_by}</strong></span>
              <span className="text-emerald-400 font-bold">✓ Delivered to Target Tenants</span>
            </div>
          </div>
        ))}
      </div>

      {/* Broadcast Dialog */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Broadcast Platform Announcement">
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <Input
            label="Announcement Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled System Maintenance Notice"
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Target Audience</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
            >
              <option value="all">All Registered Supermarket Tenants</option>
              <option value="specific_plan">Specific Subscription Tier (Pro & Enterprise)</option>
              <option value="specific_supermarket">Specific Tenant Organization</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Announcement Message Body</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter announcement text to broadcast to tenant dashboards..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold flex items-center justify-center space-x-2">
            <Send className="w-4 h-4" />
            <span>Publish & Broadcast Announcement</span>
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
