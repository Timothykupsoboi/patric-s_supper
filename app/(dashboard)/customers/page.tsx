'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customerService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Users, Plus, DollarSign, Search, ShieldAlert, History, ShoppingBag, CreditCard, Edit3 } from 'lucide-react';
import { Customer, CustomerCreditLog, Sale } from '@/types';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Selected Customer for Detailed Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [borrowLimit, setBorrowLimit] = useState('5000');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
  });

  const { data: customerLogs = [] } = useQuery({
    queryKey: ['customerLogs', selectedCustomer?.id],
    queryFn: () => (selectedCustomer ? customerService.getCustomerLogs(selectedCustomer.id) : Promise.resolve([])),
    enabled: !!selectedCustomer,
  });

  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ['customerPurchases', selectedCustomer?.id],
    queryFn: () => (selectedCustomer ? customerService.getCustomerPurchaseHistory(selectedCustomer.id) : Promise.resolve([])),
    enabled: !!selectedCustomer,
  });

  const createMutation = useMutation({
    mutationFn: (newCust: any) => customerService.createCustomer(newCust),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddOpen(false);
      setName('');
      setPhone('');
      setEmail('');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      supermarket_id: '00000000-0000-0000-0000-000000000001',
      name,
      phone,
      email,
      borrow_limit: parseFloat(borrowLimit) || 5000,
    });
  };

  const handleRepay = async () => {
    if (!selectedCustomer || !repayAmount) return;
    await customerService.recordRepayment(selectedCustomer.id, parseFloat(repayAmount));
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customerLogs', selectedCustomer.id] });
    setRepayAmount('');
  };

  const handleUpdateLimit = async () => {
    if (!selectedCustomer || !editLimit) return;
    const updated = await customerService.updateCustomer(selectedCustomer.id, {
      borrow_limit: parseFloat(editLimit),
    });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    setSelectedCustomer(updated);
    setEditLimit('');
  };

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + (c.current_debt || 0), 0);
  const totalStoreCredit = customers.reduce((sum, c) => sum + (c.store_credit || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Accounts & Debtors Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer store credit, debt balances, borrowing limits, and repayment histories</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 font-bold text-xs mt-3 sm:mt-0">
          <Plus className="w-4 h-4 mr-1.5" />
          + Add Customer Profile
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-slate-500 uppercase">Registered Debtors</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{customers.length} Accounts</h3>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <p className="text-xs font-bold text-red-700 uppercase">Total Outstanding Debt</p>
          <h3 className="text-2xl font-black text-red-900 mt-1">{formatCurrency(totalOutstandingDebt)}</h3>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-emerald-700 uppercase">Total Customer Store Credit</p>
          <h3 className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(totalStoreCredit)}</h3>
        </Card>
      </div>

      {/* Directory Table */}
      <Card>
        <div className="mb-4 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
          <Input
            placeholder="Search customer by name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Borrow Limit</th>
                <th className="p-3">Outstanding Debt</th>
                <th className="p-3">Store Credit</th>
                <th className="p-3">Account Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 font-extrabold text-slate-900">{c.name}</td>
                  <td className="p-3 font-mono text-slate-500">{c.phone || '-'}</td>
                  <td className="p-3 font-bold text-slate-700">{formatCurrency(c.borrow_limit)}</td>
                  <td className="p-3 font-black text-red-600">{formatCurrency(c.current_debt)}</td>
                  <td className="p-3 font-black text-emerald-600">{formatCurrency(c.store_credit)}</td>
                  <td className="p-3">
                    {c.current_debt >= c.borrow_limit ? (
                      <Badge variant="danger">Limit Reached</Badge>
                    ) : c.current_debt > 0 ? (
                      <Badge variant="warning" className="font-semibold">Active Debt</Badge>
                    ) : (
                      <Badge variant="success">Clear</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setEditLimit(c.borrow_limit.toString());
                      }}
                      className="font-bold text-[11px]"
                    >
                      View Profile & Debt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Customer Modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Customer Account">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" />
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Borrowing Credit Limit (KES)" type="number" value={borrowLimit} onChange={(e) => setBorrowLimit(e.target.value)} required />
          <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Save Account'}
          </Button>
        </form>
      </Dialog>

      {/* Customer Profile & Debt History Modal */}
      <Dialog
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Customer Profile: ${selectedCustomer?.name}`}
        className="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Account Metrics Header */}
          <div className="grid grid-cols-3 gap-3 bg-slate-900 text-white p-4 rounded-xl text-center">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Current Debt</p>
              <p className="text-lg font-black text-red-400">{formatCurrency(selectedCustomer?.current_debt || 0)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Borrow Limit</p>
              <p className="text-lg font-black text-blue-400">{formatCurrency(selectedCustomer?.borrow_limit || 0)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Store Credit</p>
              <p className="text-lg font-black text-emerald-400">{formatCurrency(selectedCustomer?.store_credit || 0)}</p>
            </div>
          </div>

          {/* Quick Repayment Input & Borrow Limit Edit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-xl space-y-2 bg-slate-50">
              <h4 className="text-xs font-bold text-slate-900 flex items-center">
                <CreditCard className="w-4 h-4 mr-1 text-emerald-600" /> Receive Debt Repayment
              </h4>
              <Input
                placeholder="Amount in KES"
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
              />
              <Button onClick={handleRepay} className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs font-bold py-1.5">
                Record Payment
              </Button>
            </div>

            <div className="p-3 border rounded-xl space-y-2 bg-slate-50">
              <h4 className="text-xs font-bold text-slate-900 flex items-center">
                <Edit3 className="w-4 h-4 mr-1 text-blue-600" /> Update Borrowing Limit
              </h4>
              <Input
                placeholder="New Limit KES"
                type="number"
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
              />
              <Button onClick={handleUpdateLimit} className="w-full bg-blue-600 hover:bg-blue-700 text-xs font-bold py-1.5">
                Save New Limit
              </Button>
            </div>
          </div>

          {/* Transaction Audit Logs */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center">
              <History className="w-4 h-4 mr-1 text-slate-600" /> Debt & Repayment Activity Log
            </h4>
            <div className="max-h-40 overflow-y-auto border rounded-xl divide-y text-xs">
              {customerLogs.length === 0 ? (
                <p className="p-3 text-center text-slate-400">No credit transaction logs recorded yet.</p>
              ) : (
                customerLogs.map((log) => (
                  <div key={log.id} className="p-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900 capitalize">{log.type}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(log.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black ${log.type === 'borrow' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {log.type === 'borrow' ? `+${formatCurrency(log.amount)}` : `-${formatCurrency(log.amount)}`}
                      </p>
                      <p className="text-[10px] text-slate-500">Bal: {formatCurrency(log.balance_after)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
