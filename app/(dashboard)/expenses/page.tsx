'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '@/services/expenseService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { TrendingDown, Plus, Trash2, Edit3, Receipt, Sparkles, AlertCircle } from 'lucide-react';
import { Expense } from '@/types';

const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' },
  { value: 'transport', label: 'Transport' },
  { value: 'salary', label: 'Staff Salaries' },
  { value: 'maintenance', label: 'Store Maintenance' },
  { value: 'internet', label: 'Internet & Utilities' },
  { value: 'other', label: 'Other Operational Expenses' },
];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('electricity');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses(),
  });

  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['salesMetrics'] });
    queryClient.invalidateQueries({ queryKey: ['financialReportMetrics'] });
  };

  const createMutation = useMutation({
    mutationFn: (newExp: any) => expenseService.createExpense(newExp),
    onSuccess: () => {
      invalidateCaches();
      setIsOpen(false);
      setTitle('');
      setAmount('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => expenseService.updateExpense(id, updates),
    onSuccess: () => {
      invalidateCaches();
      setEditingExpense(null);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      category,
      amount: parseFloat(amount) || 0,
      date,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    updateMutation.mutate({
      id: editingExpense.id,
      updates: {
        title,
        category,
        amount: parseFloat(amount) || 0,
        date,
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      await expenseService.deleteExpense(id);
      invalidateCaches();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-amber-600" />
            <span>Operational Expenses & Ledger</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Record supermarket operational bills, staff wages, and store expense entries</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-amber-600 hover:bg-amber-700 font-bold text-xs mt-3 sm:mt-0">
          <Plus className="w-4 h-4 mr-1.5" />
          + Log Expense Entry
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold uppercase border-b border-gray-200">
              <tr>
                <th className="p-3">Expense Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Expense Date</th>
                <th className="p-3">Date Logged</th>
                <th className="p-3">Amount</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                    No expense entries logged yet. Click "+ Log Expense Entry" to record store expenses.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-gray-900">{exp.title || exp.description}</td>
                    <td className="p-3">
                      <span className="uppercase font-bold text-amber-700 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 font-mono">{exp.date || '-'}</td>
                    <td className="p-3 text-gray-400">{formatDateTime(exp.created_at)}</td>
                    <td className="p-3 font-black text-red-600">{formatCurrency(exp.amount)}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingExpense(exp);
                          setTitle(exp.title || exp.description || '');
                          setCategory(exp.category || 'other');
                          setAmount(exp.amount.toString());
                          setDate(exp.date || new Date().toISOString().split('T')[0]);
                        }}
                        className="text-blue-600 hover:underline text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:underline text-xs font-bold">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 1. Add Expense Modal */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Store Expense Entry">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input label="Expense Description / Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Monthly CBD Store Electricity Bill" required />
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
              required
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <Input label="Expense Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input label="Amount (KES)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 15000" required />
          
          <Button type="submit" className="w-full mt-4 bg-amber-600 hover:bg-amber-700 font-bold" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Logging Expense...' : 'Save Expense Record'}
          </Button>
        </form>
      </Dialog>

      {/* 2. Edit Expense Modal */}
      <Dialog isOpen={!!editingExpense} onClose={() => setEditingExpense(null)} title={`Edit Expense: ${editingExpense?.title}`}>
        <form onSubmit={handleUpdate} className="space-y-3">
          <Input label="Expense Description / Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
              required
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <Input label="Expense Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input label="Amount (KES)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          
          <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Update Expense Entry'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
