'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformAdminService, SubscriptionPlan } from '@/services/platformAdminService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CreditCard, Check, Plus, Edit, Trash2, ArrowUpRight, History } from 'lucide-react';

export default function PlatformSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'payments'>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);

  const { data: initialPlans = [] } = useQuery({
    queryKey: ['platformPlans'],
    queryFn: async () => {
      const res = await platformAdminService.getSubscriptionPlans();
      setPlans(res);
      return res;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['platformPaymentsHistory'],
    queryFn: () => platformAdminService.getRevenueRecords(),
  });

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlan) return;
    setPlans(plans.map((p) => (p.id === editPlan.id ? editPlan : p)));
    setEditPlan(null);
  };

  const handleCreatePlan = () => {
    const newPlanObj: SubscriptionPlan = {
      id: `PLAN-${Date.now().toString().slice(-4)}`,
      name: 'Custom Executive Tier',
      code: 'enterprise',
      price_monthly: 299,
      price_yearly: 2990,
      max_branches: 25,
      max_users: 100,
      features: ['Custom Gateway', '24/7 SLA Support'],
      status: 'active',
      subscriber_count: 0,
    };
    setPlans([...plans, newPlanObj]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            <span>SaaS Subscription Plans & Billing</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure subscription tiers, price models, plan upgrades/downgrades, and review tenant payment history
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <Button
            onClick={handleCreatePlan}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Subscription Plan
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'plans'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscription Plans ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'payments'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Payment History Log ({payments.length})</span>
        </button>
      </div>

      {/* Tab 1: Subscription Plans Grid */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-extrabold text-base text-white">{p.name}</h3>
                  <Badge variant={p.status === 'active' ? 'success' : 'danger'}>{p.status.toUpperCase()}</Badge>
                </div>

                <div className="my-3">
                  <span className="text-3xl font-black text-white">${p.price_monthly}</span>
                  <span className="text-xs text-slate-400 font-mono"> / month</span>
                  <p className="text-[10px] text-indigo-400 font-mono font-semibold">${p.price_yearly} / year</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-4 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Branches:</span>
                    <span className="font-extrabold text-slate-200">{p.max_branches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Users:</span>
                    <span className="font-extrabold text-slate-200">{p.max_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subscribers:</span>
                    <span className="font-extrabold text-emerald-400">{p.subscriber_count} Supermarkets</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Plan Features</p>
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mr-2 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditPlan(p)}
                  className="flex-1 bg-slate-950 text-indigo-300 border-slate-800 hover:bg-slate-800 text-xs font-bold"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit Plan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlans(plans.filter((item) => item.id !== p.id))}
                  className="bg-red-950 text-red-300 border-red-800 hover:bg-red-900 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Payment History Log */}
      {activeTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Supermarket Tenant</th>
                  <th className="p-4">Plan Tier</th>
                  <th className="p-4">Billing Cycle</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Payment Gateway</th>
                  <th className="p-4">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-bold text-slate-300">{pay.id}</td>
                    <td className="p-4 font-extrabold text-white">{pay.supermarket_name}</td>
                    <td className="p-4 uppercase font-extrabold text-indigo-400">{pay.plan}</td>
                    <td className="p-4 uppercase text-slate-300 font-mono">{pay.billing_cycle}</td>
                    <td className="p-4 font-black text-emerald-400">${pay.amount} USD</td>
                    <td className="p-4 text-slate-300 font-medium">{pay.payment_method}</td>
                    <td className="p-4 text-slate-400 font-mono">{formatDateTime(pay.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Plan Dialog */}
      <Dialog isOpen={!!editPlan} onClose={() => setEditPlan(null)} title={`Edit Subscription Plan: ${editPlan?.name}`}>
        {editPlan && (
          <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
            <Input
              label="Plan Name"
              value={editPlan.name}
              onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Monthly Price ($)"
                type="number"
                value={editPlan.price_monthly.toString()}
                onChange={(e) => setEditPlan({ ...editPlan, price_monthly: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="Yearly Price ($)"
                type="number"
                value={editPlan.price_yearly.toString()}
                onChange={(e) => setEditPlan({ ...editPlan, price_yearly: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Branches Allowed"
                type="number"
                value={editPlan.max_branches.toString()}
                onChange={(e) => setEditPlan({ ...editPlan, max_branches: parseInt(e.target.value) || 1 })}
                required
              />
              <Input
                label="Max Users Allowed"
                type="number"
                value={editPlan.max_users.toString()}
                onChange={(e) => setEditPlan({ ...editPlan, max_users: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold">
              Save Plan Configuration
            </Button>
          </form>
        )}
      </Dialog>
    </div>
  );
}
