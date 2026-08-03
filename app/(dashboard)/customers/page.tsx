'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customerService';
import { mpesaService } from '@/services/mpesaService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Users, CreditCard, Trash2, UserCheck, ShieldAlert, ArrowUpRight, Phone, Mail, DollarSign, LayoutGrid, List, User, Smartphone, History } from 'lucide-react';
import { Customer } from '@/types';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Sorting & Pagination State
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Selected Customer for Detailed Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [borrowLimit, setBorrowLimit] = useState('5000');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
  });

  const { data: customerLogs = [] } = useQuery({
    queryKey: ['customerLogs', selectedCustomer?.id],
    queryFn: () => (selectedCustomer ? customerService.getCustomerLogs(selectedCustomer.id) : Promise.resolve([])),
    enabled: !!selectedCustomer,
  });

  const { data: mpesaTxList = [] } = useQuery({
    queryKey: ['customerMpesaTx', selectedCustomer?.id],
    queryFn: () => mpesaService.getTransactions(),
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
      toast.success('Customer Registered', 'New customer profile was created successfully.');
    },
    onError: (err: any) => {
      toast.error('Registration Failed', err.message || 'Could not register customer profile.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer Deleted', 'Customer account was removed.');
    },
    onError: (err: any) => {
      toast.error('Deletion Failed', err.message || 'Could not delete customer account.');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      supermarket_id: '00000000-0000-0000-0000-000000000001',
      name,
      phone,
      email,
      credit_limit: parseFloat(borrowLimit) || 5000,
    });
  };

  const handleRepay = async () => {
    if (!selectedCustomer || !repayAmount) return;
    try {
      await customerService.recordRepayment(selectedCustomer.id, parseFloat(repayAmount));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customerLogs', selectedCustomer.id] });
      toast.success('Repayment Recorded', `Logged KES ${parseFloat(repayAmount).toLocaleString()} debt repayment.`);
      setRepayAmount('');
    } catch (err: any) {
      toast.error('Repayment Error', err.message || 'Failed to record repayment.');
    }
  };

  const handleUpdateLimit = async () => {
    if (!selectedCustomer || !editLimit) return;
    try {
      const updated = await customerService.updateCustomer(selectedCustomer.id, {
        credit_limit: parseFloat(editLimit),
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(updated);
      toast.success('Credit Limit Updated', `New credit limit set to KES ${parseFloat(editLimit).toLocaleString()}.`);
      setEditLimit('');
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not update credit limit.');
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filter, Sort, and Paginate Customers
  const processedCustomers = useMemo(() => {
    let result = customers.filter(
      (c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search))
    );

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
  }, [customers, search, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedCustomers.length / pageSize);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedCustomers.slice(start, start + pageSize);
  }, [processedCustomers, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCustomers.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    for (const id of selectedIds) {
      await customerService.deleteCustomer(id);
    }
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    toast.success('Bulk Delete Complete', `Removed ${selectedIds.length} customer profiles.`);
    setSelectedIds([]);
    setIsBulkDeleting(false);
  };

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + (c.balance ?? c.current_debt ?? 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Accounts & Debtors Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage customer store credit, debt balances, and M-Pesa repayment histories</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} variant="primary" size="md">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Customer Profile
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Customer Accounts</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{customers.length} Accounts</h3>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Total Outstanding Debt Balance</p>
          <h3 className="text-2xl font-black text-red-900 mt-1">{formatCurrency(totalOutstandingDebt)}</h3>
        </Card>
      </div>

      {/* Filter Bar & View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center shadow-xs">
        <TableSearch
          value={search}
          onChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          placeholder="Search by customer name or phone number..."
          className="w-full sm:w-80"
        />

        <div className="flex space-x-1 border border-slate-200 p-1 rounded-xl bg-slate-50 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Grid Cards View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table View Mode */}
      {viewMode === 'table' ? (
        <Card className="p-0 overflow-hidden border border-slate-200">
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
                      checked={selectedIds.length > 0 && selectedIds.length === paginatedCustomers.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <SortableTableHead sortKey="name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                    Customer Name
                  </SortableTableHead>
                  <SortableTableHead sortKey="phone" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                    Phone Number
                  </SortableTableHead>
                  <SortableTableHead sortKey="credit_limit" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                    Credit Limit
                  </SortableTableHead>
                  <SortableTableHead sortKey="balance" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                    Outstanding Debt
                  </SortableTableHead>
                  <th className="p-3.5 text-left font-black text-slate-700">Account Status</th>
                  <th className="p-3.5 text-right font-black text-slate-700">Actions</th>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : paginatedCustomers.length === 0 ? (
                <TableBody>
                  <TableEmptyState
                    title="No customer accounts found"
                    description="No customer records match your search criteria."
                    icon={Users}
                    actionButton={
                      <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Create Customer Profile
                      </Button>
                    }
                    colSpan={7}
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {paginatedCustomers.map((c) => {
                    const bal = c.balance ?? c.current_debt ?? 0;
                    const lim = c.credit_limit ?? c.borrow_limit ?? 5000;
                    const isSelected = selectedIds.includes(c.id);

                    return (
                      <TableRow key={c.id} className={isSelected ? 'bg-blue-50/50' : ''}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(c.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-extrabold text-slate-900">{c.name}</TableCell>
                        <TableCell className="font-mono text-slate-500">{c.phone || '-'}</TableCell>
                        <TableCell className="font-bold text-slate-700">{formatCurrency(lim)}</TableCell>
                        <TableCell className="font-black text-red-600">{formatCurrency(bal)}</TableCell>
                        <TableCell>
                          {bal >= lim ? (
                            <Badge variant="danger">Limit Reached</Badge>
                          ) : bal > 0 ? (
                            <Badge variant="warning">Active Debt</Badge>
                          ) : (
                            <Badge variant="success">Clear</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setEditLimit(lim.toString());
                            }}
                          >
                            Ledger & Debt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(c)}
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
            totalItems={processedCustomers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        /* Grid Cards View Mode */
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-200 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : paginatedCustomers.length === 0 ? (
            <Card className="p-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-black text-slate-700">No customer accounts found</p>
              <p className="text-xs text-slate-400 mt-1">No customer records match your search criteria.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {paginatedCustomers.map((c) => {
                const bal = c.balance ?? c.current_debt ?? 0;
                const lim = c.credit_limit ?? c.borrow_limit ?? 5000;
                const percent = Math.min(100, (bal / lim) * 100);

                return (
                  <Card key={c.id} className="p-4 border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-sm border border-blue-100">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-slate-900 line-clamp-1">{c.name}</h3>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{c.phone || 'No phone recorded'}</p>
                          </div>
                        </div>
                        {bal >= lim ? (
                          <Badge variant="danger">Limit Reached</Badge>
                        ) : bal > 0 ? (
                          <Badge variant="warning">Active Debt</Badge>
                        ) : (
                          <Badge variant="success">Clear</Badge>
                        )}
                      </div>

                      {/* Debt vs Credit Limit Bar */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-500">Outstanding Debt:</span>
                          <span className="text-red-600 font-black">{formatCurrency(bal)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-500">Credit Limit:</span>
                          <span className="text-slate-900 font-black">{formatCurrency(lim)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 100 ? 'bg-red-600' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setEditLimit(lim.toString());
                        }}
                        className="flex-1 text-xs font-extrabold"
                      >
                        Ledger & Repay
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(c)}
                        className="text-red-600 hover:bg-red-50 hover:border-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200 text-xs font-bold shadow-xs">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-slate-600 font-extrabold">Page {currentPage} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Customer Modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Customer Account">
        <form onSubmit={handleCreate} className="space-y-4 font-sans">
          <Input isFloating label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input isFloating label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone className="w-4 h-4" />} required />
          <Input isFloating label="Email Address (Optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} />
          <Input isFloating label="Borrow Credit Limit (KES)" type="number" value={borrowLimit} onChange={(e) => setBorrowLimit(e.target.value)} icon={<DollarSign className="w-4 h-4" />} required />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Customer Profile'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Customer Profile & Repayment Modal */}
      {selectedCustomer && (
        <Dialog isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={`Customer Ledger — ${selectedCustomer.name}`}>
          <div className="space-y-5 font-sans">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Outstanding Debt</p>
                <p className="text-xl font-black text-red-600">
                  {formatCurrency(selectedCustomer.balance ?? selectedCustomer.current_debt ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Credit Limit</p>
                <p className="text-xl font-black text-slate-900">
                  {formatCurrency(selectedCustomer.credit_limit ?? selectedCustomer.borrow_limit ?? 5000)}
                </p>
              </div>
            </div>

            {/* Repay Debt Form */}
            <div className="p-4 border rounded-2xl space-y-3 bg-emerald-50/50 border-emerald-200">
              <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Record Debt Repayment</h4>
              <div className="flex gap-2">
                <Input
                  isFloating
                  label="Repayment Amount (KES)"
                  type="number"
                  placeholder="Amount to repay..."
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="bg-white"
                />
                <Button onClick={handleRepay} variant="success" size="md">
                  Repay
                </Button>
              </div>
            </div>

            {/* Update Credit Limit Form */}
            <div className="p-4 border rounded-2xl space-y-3 bg-slate-50 border-slate-200">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Update Credit Limit</h4>
              <div className="flex gap-2">
                <Input
                  isFloating
                  label="New Credit Limit (KES)"
                  type="number"
                  placeholder="New credit limit..."
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="bg-white"
                />
                <Button onClick={handleUpdateLimit} variant="secondary" size="md">
                  Update
                </Button>
              </div>
            </div>

            {/* M-Pesa Payment Audit History */}
            <div>
              <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>M-Pesa Payment History</span>
              </h4>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border rounded-2xl bg-white">
                {mpesaTxList.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center font-medium">No M-Pesa payments recorded for this customer.</p>
                ) : (
                  mpesaTxList.map((tx) => (
                    <div key={tx.id} className="p-2.5 flex justify-between items-center text-xs font-mono">
                      <div>
                        <p className="font-bold text-slate-900">{tx.mpesa_receipt_number} ({tx.payment_channel})</p>
                        <p className="text-[10px] text-slate-400 font-sans">{formatDateTime(tx.created_at)}</p>
                      </div>
                      <span className="font-black text-emerald-700">{formatCurrency(tx.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Customer Audit Logs & Repayment History */}
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>Repayment & Credit Logs</span>
              </h4>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border rounded-2xl bg-white">
                {customerLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center font-medium">No repayment logs found.</p>
                ) : (
                  customerLogs.map((log) => (
                    <div key={log.id} className="p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{log.notes || 'Repayment / Charge'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{formatDateTime(log.created_at)}</p>
                      </div>
                      <span className="font-black text-slate-900">{formatCurrency(log.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Delete Single Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
        title="Delete Customer Profile"
        message={`Are you sure you want to delete customer account "${deleteTarget?.name}"? All debt balances and credit records will be permanently removed.`}
        confirmText="Delete Customer"
        variant="danger"
      />

      {/* Delete Bulk Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        onConfirm={confirmBulkDelete}
        title="Bulk Delete Customer Accounts"
        message={`Are you sure you want to delete all ${selectedIds.length} selected customer accounts? This operation cannot be undone.`}
        confirmText="Delete Selected"
        variant="danger"
      />
    </div>
  );
}
