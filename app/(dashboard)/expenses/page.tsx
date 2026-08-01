'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '@/services/expenseService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { TrendingDown, Plus, Trash2 } from 'lucide-react';

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Rent & Utilities');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses(),
  });

  const createMutation = useMutation({
    mutationFn: (newExp: any) => expenseService.createExpense(newExp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsOpen(false);
      setTitle('');
      setAmount('');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      supermarket_id: '00000000-0000-0000-0000-000000000001',
      title,
      category,
      amount: parseFloat(amount) || 0,
      payment_method: paymentMethod,
    });
  };

  const handleDelete = async (id: string) => {
    await expenseService.deleteExpense(id);
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Operational Expenses</h1>
          <p className="text-xs text-gray-500">Record supermarket operational bills, staff wages, and store expenses</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-red-600 hover:bg-red-700 font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          Log Expense Entry
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold uppercase border-b border-gray-200">
              <tr>
                <th className="p-3">Expense Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3">Date Logged</th>
                <th className="p-3">Amount</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-gray-900">{exp.title}</td>
                  <td className="p-3 text-gray-600">{exp.category}</td>
                  <td className="p-3 uppercase text-gray-500 font-semibold">{exp.payment_method}</td>
                  <td className="p-3 text-gray-400">{formatDateTime(exp.created_at)}</td>
                  <td className="p-3 font-bold text-red-600">{formatCurrency(exp.amount)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:underline text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Expense Modal */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Store Expense">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input label="Expense Description/Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Electricity Bill" required />
          <Input label="Expense Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
          <Input label="Amount (KES)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Button type="submit" className="w-full mt-4 bg-red-600 hover:bg-red-700 font-bold" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Logging...' : 'Save Expense Record'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
