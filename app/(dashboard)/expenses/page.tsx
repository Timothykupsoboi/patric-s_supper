'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '@/services/expenseService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  TableBulkActions,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { TrendingDown, Plus, Trash2, Edit3, Receipt, Calendar, DollarSign, Tag } from 'lucide-react';
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
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Sorting & Pagination State
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
      toast.success('Expense Logged', 'Store operational expense entry was recorded.');
    },
    onError: (err: any) => {
      toast.error('Logging Failed', err.message || 'Could not log expense entry.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => expenseService.updateExpense(id, updates),
    onSuccess: () => {
      invalidateCaches();
      setEditingExpense(null);
      toast.success('Expense Updated', 'Expense record was updated.');
    },
    onError: (err: any) => {
      toast.error('Update Failed', err.message || 'Could not update expense record.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      invalidateCaches();
      toast.success('Expense Removed', 'Expense entry was deleted.');
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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filter, Sort, Paginate Expenses
  const processedExpenses = useMemo(() => {
    const q = search.toLowerCase();
    let result = expenses.filter((exp) => {
      const matchSearch =
        (exp.title && exp.title.toLowerCase().includes(q)) ||
        (exp.description && exp.description.toLowerCase().includes(q)) ||
        (exp.category && exp.category.toLowerCase().includes(q));

      const matchCat = !selectedCategory || exp.category === selectedCategory;
      return matchSearch && matchCat;
    });

    result.sort((a: any, b: any) => {
      let aVal = a[sortKey] ?? '';
      let bVal = b[sortKey] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [expenses, search, selectedCategory, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedExpenses.length / pageSize);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedExpenses.slice(start, start + pageSize);
  }, [processedExpenses, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedExpenses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedExpenses.map((exp) => exp.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    for (const id of selectedIds) {
      await expenseService.deleteExpense(id);
    }
    invalidateCaches();
    toast.success('Bulk Delete Complete', `Removed ${selectedIds.length} expense entries.`);
    setSelectedIds([]);
    setIsBulkDeleting(false);
  };

  const totalExpenseSum = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-amber-600" />
            <span>Operational Expenses & Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Record supermarket operational bills, staff wages, and store expense entries</p>
        </div>
        <Button onClick={() => setIsOpen(true)} variant="primary" size="md">
          <Plus className="w-4 h-4 mr-1.5" />
          Log Expense Entry
        </Button>
      </div>

      {/* Metric summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-amber-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logged Expense Entries</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{expenses.length} Records</h3>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Total Operational Outflow</p>
          <h3 className="text-2xl font-black text-red-900 mt-1">{formatCurrency(totalExpenseSum)}</h3>
        </Card>
      </div>

      {/* Directory Table Card */}
      <Card className="p-0 overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-slate-50/50">
          <TableSearch
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search expense description, category..."
            className="w-full sm:w-80"
          />

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <TableBulkActions
          selectedCount={selectedIds.length}
          onClear={() => setSelectedIds([])}
          actions={
            <Button variant="danger" size="sm" onClick={() => setIsBulkDeleting(true)}>
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete Selected
            </Button>
          }
        />

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <th className="p-3.5 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === paginatedExpenses.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <SortableTableHead sortKey="title" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Expense Title
                </SortableTableHead>
                <SortableTableHead sortKey="category" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Category
                </SortableTableHead>
                <SortableTableHead sortKey="date" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Expense Date
                </SortableTableHead>
                <SortableTableHead sortKey="created_at" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Date Logged
                </SortableTableHead>
                <SortableTableHead sortKey="amount" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Amount
                </SortableTableHead>
                <th className="p-3.5 text-right font-black text-slate-700">Actions</th>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={5} cols={7} />
            ) : paginatedExpenses.length === 0 ? (
              <TableBody>
                <TableEmptyState
                  title="No expense entries found"
                  description="No expense records match your search or filter selection."
                  icon={Receipt}
                  actionButton={
                    <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Log Expense Entry
                    </Button>
                  }
                  colSpan={7}
                />
              </TableBody>
            ) : (
              <TableBody>
                {paginatedExpenses.map((exp) => {
                  const isSelected = selectedIds.includes(exp.id);

                  return (
                    <TableRow key={exp.id} className={isSelected ? 'bg-blue-50/50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(exp.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-extrabold text-slate-900">{exp.title || exp.description}</TableCell>
                      <TableCell>
                        <Badge variant="warning" className="uppercase">
                          {exp.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-slate-500">{exp.date || '-'}</TableCell>
                      <TableCell className="text-slate-400 font-mono">{formatDateTime(exp.created_at)}</TableCell>
                      <TableCell className="font-black text-red-600">{formatCurrency(exp.amount)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingExpense(exp);
                            setTitle(exp.title || exp.description || '');
                            setCategory(exp.category || 'other');
                            setAmount(exp.amount.toString());
                            setDate(exp.date || new Date().toISOString().split('T')[0]);
                          }}
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(exp)}
                          className="text-red-600 hover:bg-red-50 hover:border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            )}
          </Table>
        </TableContainer>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={processedExpenses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* 1. Add Expense Modal */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Store Expense Entry">
        <form onSubmit={handleCreate} className="space-y-4 font-sans">
          <Input isFloating label="Expense Description / Title" value={title} onChange={(e) => setTitle(e.target.value)} icon={<Receipt className="w-4 h-4" />} required />
          
          <Select
            isFloating
            label="Expense Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            icon={<Tag className="w-4 h-4" />}
            options={EXPENSE_CATEGORIES}
            required
          />

          <Input isFloating label="Expense Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} icon={<Calendar className="w-4 h-4" />} required />
          <Input isFloating label="Amount (KES)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} icon={<DollarSign className="w-4 h-4" />} placeholder="e.g. 15000" required />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              {createMutation.isPending ? 'Logging Expense...' : 'Save Expense Record'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 2. Edit Expense Modal */}
      <Dialog isOpen={!!editingExpense} onClose={() => setEditingExpense(null)} title={`Edit Expense: ${editingExpense?.title}`}>
        <form onSubmit={handleUpdate} className="space-y-4 font-sans">
          <Input isFloating label="Expense Description / Title" value={title} onChange={(e) => setTitle(e.target.value)} icon={<Receipt className="w-4 h-4" />} required />
          
          <Select
            isFloating
            label="Expense Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            icon={<Tag className="w-4 h-4" />}
            options={EXPENSE_CATEGORIES}
            required
          />

          <Input isFloating label="Expense Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} icon={<Calendar className="w-4 h-4" />} required />
          <Input isFloating label="Amount (KES)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} icon={<DollarSign className="w-4 h-4" />} required />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditingExpense(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Update Expense Entry'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Single Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
        title="Delete Expense Record"
        message={`Are you sure you want to delete the expense entry "${deleteTarget?.title || deleteTarget?.description}"? Financial reports will be updated.`}
        confirmText="Delete Record"
        variant="danger"
      />

      {/* Delete Bulk Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        onConfirm={confirmBulkDelete}
        title="Bulk Delete Expense Entries"
        message={`Are you sure you want to delete all ${selectedIds.length} selected expense entries? This operation cannot be undone.`}
        confirmText="Delete Selected"
        variant="danger"
      />
    </div>
  );
}
