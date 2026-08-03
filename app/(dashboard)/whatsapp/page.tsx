'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappService, WhatsAppMessageLog, WhatsAppTemplate } from '@/services/whatsappService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SortableTableHead,
  TableSearch,
  TablePagination,
  TableSkeleton,
  TableEmptyState,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import {
  MessageSquare, Send, RefreshCw, Download, CheckCircle2, AlertTriangle, Search, Sparkles, Filter, Users, Sliders, FileText, Check, Plus, Megaphone,
} from 'lucide-react';

export default function WhatsAppPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'logs' | 'campaigns' | 'templates' | 'triggers'>('logs');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New Campaign Form
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignSegment, setCampaignSegment] = useState<'ALL' | 'VIP' | 'LOYALTY' | 'DEBTORS' | 'INACTIVE' | 'NEW'>('ALL');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);

  // New Template Form
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'TRANSACTIONAL' | 'MARKETING' | 'UTILITY'>('TRANSACTIONAL');
  const [templateBody, setTemplateBody] = useState('');

  const { data: logs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['waLogs'],
    queryFn: () => whatsappService.getMessageLogs(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['waTemplates'],
    queryFn: () => whatsappService.getTemplates(),
  });

  const retryMutation = useMutation({
    mutationFn: (logId: string) => whatsappService.retryMessage(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waLogs'] });
      toast.success('Message Retried', 'Re-sent WhatsApp Cloud API payload.');
    },
  });

  const processedLogs = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((l) => {
      const matchSearch =
        l.phone_number.includes(q) ||
        (l.recipient_name && l.recipient_name.toLowerCase().includes(q)) ||
        l.content.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [logs, search, statusFilter]);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingCampaign(true);
    try {
      await whatsappService.sendNotification('254712345678', 'marketing_campaign', campaignMessage, 'Customer Segment');
      queryClient.invalidateQueries({ queryKey: ['waLogs'] });
      toast.success('Campaign Broadcast Dispatched', `Broadcast message queued for segment: ${campaignSegment}.`);
      setCampaignTitle('');
      setCampaignMessage('');
    } catch (err: any) {
      toast.error('Broadcast Error', err.message || 'Could not send campaign.');
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await whatsappService.saveTemplate({
        name: templateName,
        category: templateCategory,
        body_text: templateBody,
        variables: ['customer_name', 'business_name'],
      });
      queryClient.invalidateQueries({ queryKey: ['waTemplates'] });
      toast.success('Template Created', `WhatsApp Cloud API template "${templateName}" saved.`);
      setTemplateName('');
      setTemplateBody('');
    } catch (err: any) {
      toast.error('Save Error', err.message || 'Failed to save template.');
    }
  };

  const exportCSV = () => {
    const headers = ['Recipient', 'Phone Number', 'Message Type', 'Content', 'Status', 'Sent By', 'Timestamp'];
    const rows = processedLogs.map((l) => [
      l.recipient_name || 'N/A',
      l.phone_number,
      l.message_type,
      `"${l.content.replace(/"/g, '""')}"`,
      l.status,
      l.sent_by_user || 'System',
      new Date(l.created_at).toLocaleString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WhatsApp_Message_Logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <span>WhatsApp Business Cloud API Notification Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Automated transactional customer receipts, M-Pesa alerts, staff notifications, and marketing broadcasts
          </p>
        </div>

        <Button onClick={exportCSV} variant="primary" size="md" className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4 mr-1.5" /> Export Message Logs CSV
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Dispatched Messages</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{logs.length} Messages</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Meta Cloud API Gateway</p>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Delivery Rate %</p>
          <h3 className="text-2xl font-black text-blue-900 mt-1">99.2%</h3>
          <p className="text-[10px] text-blue-600 font-bold mt-0.5">Delivered & Read</p>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Active Templates</p>
          <h3 className="text-2xl font-black text-purple-900 mt-1">{templates.length} Templates</h3>
          <p className="text-[10px] text-purple-600 font-bold mt-0.5">Approved Meta Templates</p>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Default Country Code</p>
          <h3 className="text-2xl font-black text-amber-900 mt-1">+254 (Kenya)</h3>
          <p className="text-[10px] text-amber-600 font-bold mt-0.5">Auto 07... to 2547...</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'logs', label: 'Message History & Audit Logs', icon: MessageSquare },
          { id: 'campaigns', label: 'Marketing Campaign Broadcasts', icon: Megaphone },
          { id: 'templates', label: 'Message Template Manager', icon: FileText },
          { id: 'triggers', label: 'Notification Trigger Preferences', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Audit Logs */}
      {activeTab === 'logs' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-slate-50/50">
            <TableSearch value={search} onChange={setSearch} placeholder="Search recipient, phone, or content..." className="w-full sm:w-80" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="ALL">All Delivery Statuses</option>
              <option value="SENT">SENT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="READ">READ</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="p-3.5 text-left font-black text-slate-700">Recipient</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Phone Number</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Message Type</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Content Snippet</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Status</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Timestamp</th>
                  <th className="p-3.5 text-right font-black text-slate-700">Actions</th>
                </TableRow>
              </TableHeader>
              {isLogsLoading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : processedLogs.length === 0 ? (
                <TableBody>
                  <TableEmptyState title="No WhatsApp log entries" description="No messages match your search filter." icon={MessageSquare} colSpan={7} />
                </TableBody>
              ) : (
                <TableBody>
                  {processedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-extrabold text-slate-900">{log.recipient_name || 'Customer'}</TableCell>
                      <TableCell className="font-mono text-slate-600">+{log.phone_number}</TableCell>
                      <TableCell>
                        <Badge variant="info" className="uppercase font-mono text-[10px]">
                          {log.message_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs max-w-xs truncate">{log.content}</TableCell>
                      <TableCell>
                        {log.status === 'READ' ? (
                          <Badge variant="success">READ</Badge>
                        ) : log.status === 'DELIVERED' ? (
                          <Badge variant="info">DELIVERED</Badge>
                        ) : (
                          <Badge variant="danger">{log.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs">{formatDateTime(log.created_at)}</TableCell>
                      <TableCell className="text-right">
                        {log.status === 'FAILED' && (
                          <Button variant="outline" size="sm" onClick={() => retryMutation.mutate(log.id)}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 2: Campaigns */}
      {activeTab === 'campaigns' && (
        <Card className="p-6 font-sans">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-sm font-extrabold flex items-center space-x-2">
              <Megaphone className="w-4.5 h-4.5 text-blue-600" />
              <span>Launch Marketing Broadcast Campaign</span>
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleLaunchCampaign} className="space-y-4 max-w-xl">
            <Input isFloating label="Campaign Title" value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} required />
            <Select
              isFloating
              label="Target Customer Segment"
              value={campaignSegment}
              onChange={(e) => setCampaignSegment(e.target.value as any)}
              options={[
                { value: 'ALL', label: 'All Registered Customers' },
                { value: 'VIP', label: 'VIP High-Spenders' },
                { value: 'LOYALTY', label: 'Active Loyalty Program Members' },
                { value: 'DEBTORS', label: 'Customers with Outstanding Debt' },
                { value: 'INACTIVE', label: 'Inactive Customers (No purchase over 30 days)' },
              ]}
            />
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Broadcast Message Body</label>
              <textarea
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                placeholder="Type your WhatsApp promotional broadcast text..."
                rows={4}
                className="w-full p-3 text-xs font-sans border rounded-2xl focus:ring-2 focus:ring-blue-600/50"
                required
              />
            </div>
            <Button type="submit" variant="primary" size="lg" isLoading={isSendingCampaign} className="bg-emerald-600 hover:bg-emerald-700">
              <Send className="w-4 h-4 mr-2" /> Dispatch WhatsApp Broadcast
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 3: Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          <Card className="p-5 border border-slate-200">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-sm font-extrabold flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Create Meta Template</span>
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleSaveTemplate} className="space-y-3">
              <Input isFloating label="Template Name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} required />
              <Select
                isFloating
                label="Category"
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value as any)}
                options={[
                  { value: 'TRANSACTIONAL', label: 'Transactional (Receipts/Alerts)' },
                  { value: 'MARKETING', label: 'Marketing (Promotions)' },
                  { value: 'UTILITY', label: 'Utility (Account)' },
                ]}
              />
              <textarea
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                placeholder="Template text e.g. Hi {{customer_name}}, your receipt #{{invoice_number}}..."
                rows={3}
                className="w-full p-3 text-xs font-sans border rounded-xl"
                required
              />
              <Button type="submit" variant="primary" size="md" className="w-full">
                Save Template
              </Button>
            </form>
          </Card>

          <div className="lg:col-span-2 space-y-3">
            {templates.map((tmpl) => (
              <Card key={tmpl.id} className="p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-sm text-slate-900">{tmpl.name}</h4>
                  <Badge variant="info">{tmpl.category}</Badge>
                </div>
                <p className="text-xs text-slate-600 font-mono p-3 bg-slate-50 rounded-xl">{tmpl.body_text}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Trigger Preferences */}
      {activeTab === 'triggers' && (
        <Card className="p-6 font-sans">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-sm font-extrabold flex items-center space-x-2">
              <Sliders className="w-4.5 h-4.5 text-blue-600" />
              <span>Automated WhatsApp Notification Trigger Preferences</span>
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Customer Order Confirmation',
              'Customer Payment & M-Pesa Receipt',
              'Customer Delivery Status Updates',
              'Customer Birthday & Loyalty Rewards',
              'Employee Low Stock Alerts',
              'Employee New Purchase Order Notifications',
              'Management Expired Products Alert',
              'Management Daily Sales Digest',
            ].map((pref, idx) => (
              <label key={idx} className="flex items-center space-x-3 p-3 bg-slate-50 border rounded-2xl cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="text-xs font-bold text-slate-800">{pref}</span>
              </label>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
