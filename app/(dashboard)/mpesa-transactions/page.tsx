'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mpesaService, MpesaTransaction } from '@/services/mpesaService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Smartphone, Download, RefreshCw, CheckCircle2, AlertTriangle, Clock, ArrowUpRight, Search, ShieldCheck } from 'lucide-react';

export default function MpesaTransactionsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [refundTarget, setRefundTarget] = useState<MpesaTransaction | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['mpesaTransactions'],
    queryFn: () => mpesaService.getTransactions(),
  });

  const refundMutation = useMutation({
    mutationFn: (txId: string) => mpesaService.refundTransaction(txId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mpesaTransactions'] });
      toast.success('M-Pesa Refund Processed', 'Refund reversal submitted to customer M-Pesa account.');
      setRefundTarget(null);
    },
    onError: (err: any) => {
      toast.error('Refund Failed', err.message || 'Could not process M-Pesa refund.');
    },
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filter, Sort, Paginate
  const processedTransactions = useMemo(() => {
    const q = search.toLowerCase();
    let result = transactions.filter((tx) => {
      const matchSearch =
        tx.mpesa_receipt_number.toLowerCase().includes(q) ||
        tx.phone_number.includes(q) ||
        (tx.customer_name && tx.customer_name.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || tx.status === statusFilter;
      const matchChannel = channelFilter === 'ALL' || tx.payment_channel === channelFilter;

      return matchSearch && matchStatus && matchChannel;
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
  }, [transactions, search, statusFilter, channelFilter, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedTransactions.length / pageSize);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTransactions.slice(start, start + pageSize);
  }, [processedTransactions, currentPage, pageSize]);

  // Metrics
  const totalSuccessVolume = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((acc, t) => acc + t.amount, 0);

  const successCount = transactions.filter((t) => t.status === 'SUCCESS').length;
  const failedCount = transactions.filter((t) => t.status === 'CANCELLED' || t.status === 'FAILED').length;

  const exportCSV = () => {
    const headers = ['Receipt Number', 'Phone Number', 'Customer Name', 'Amount (KES)', 'Status', 'Channel', 'Cashier', 'Branch', 'Timestamp'];
    const rows = processedTransactions.map((tx) => [
      tx.mpesa_receipt_number,
      tx.phone_number,
      tx.customer_name || 'N/A',
      tx.amount,
      tx.status,
      tx.payment_channel,
      tx.cashier_name || 'N/A',
      tx.branch_name || 'N/A',
      new Date(tx.created_at).toLocaleString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mpesa_Transactions_Report_${Date.now()}.csv`);
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
            <Smartphone className="w-6 h-6 text-emerald-600" />
            <span>M-Pesa Transactions & Reconciliation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Realtime Safaricom Daraja STK Push, PayBill, and Till payment audit ledger
          </p>
        </div>
        <Button onClick={exportCSV} variant="primary" size="md" className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4 mr-1.5" />
          Export M-Pesa CSV
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total M-Pesa Revenue</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalSuccessVolume)}</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{successCount} successful payments</p>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">STK Push Success Rate</p>
          <h3 className="text-2xl font-black text-blue-900 mt-1">
            {transactions.length > 0 ? `${Math.round((successCount / transactions.length) * 100)}%` : '100%'}
          </h3>
          <p className="text-[10px] text-blue-600 font-bold mt-0.5">Safaricom gateway uptime 99.9%</p>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Cancelled / Failed STK</p>
          <h3 className="text-2xl font-black text-red-900 mt-1">{failedCount} Requests</h3>
          <p className="text-[10px] text-red-600 font-bold mt-0.5">Timed out or PIN cancelled</p>
        </Card>
      </div>

      {/* Directory Table */}
      <Card className="p-0 overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-slate-50/50">
          <TableSearch
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search M-Pesa receipt #, phone..."
            className="w-full sm:w-72"
          />

          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="ALL">All Channels</option>
              <option value="STK_PUSH">STK Push</option>
              <option value="PAYBILL">PayBill</option>
              <option value="TILL_NUMBER">Till Number</option>
            </select>
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="mpesa_receipt_number" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Receipt Code
                </SortableTableHead>
                <SortableTableHead sortKey="phone_number" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Customer Phone
                </SortableTableHead>
                <SortableTableHead sortKey="amount" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Amount (KES)
                </SortableTableHead>
                <th className="p-3.5 text-left font-black text-slate-700">Payment Channel</th>
                <th className="p-3.5 text-left font-black text-slate-700">Status</th>
                <th className="p-3.5 text-left font-black text-slate-700">Cashier & Branch</th>
                <SortableTableHead sortKey="created_at" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Timestamp
                </SortableTableHead>
                <th className="p-3.5 text-right font-black text-slate-700">Actions</th>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={5} cols={8} />
            ) : paginatedTransactions.length === 0 ? (
              <TableBody>
                <TableEmptyState
                  title="No M-Pesa transactions found"
                  description="No completed M-Pesa payments match your search criteria."
                  icon={Smartphone}
                  colSpan={8}
                />
              </TableBody>
            ) : (
              <TableBody>
                {paginatedTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono font-extrabold text-slate-900">{tx.mpesa_receipt_number}</TableCell>
                    <TableCell className="font-mono text-slate-600">+{tx.phone_number}</TableCell>
                    <TableCell className="font-black text-slate-900">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="info" className="uppercase font-mono text-[10px]">
                        {tx.payment_channel.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tx.status === 'SUCCESS' ? (
                        <Badge variant="success">SUCCESS</Badge>
                      ) : tx.status === 'REFUNDED' ? (
                        <Badge variant="warning">REFUNDED</Badge>
                      ) : (
                        <Badge variant="danger">{tx.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      <div>{tx.cashier_name || 'Cashier'}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{tx.branch_name || 'CBD Branch'}</div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">{formatDateTime(tx.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {tx.status === 'SUCCESS' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRefundTarget(tx)}
                          className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refund
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </TableContainer>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={processedTransactions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* Refund Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={() => {
          if (refundTarget) {
            refundMutation.mutate(refundTarget.id);
          }
        }}
        title="Process M-Pesa Reversal / Refund"
        message={`Are you sure you want to trigger a Safaricom B2C M-Pesa refund of KES ${refundTarget?.amount.toLocaleString()} for receipt "${refundTarget?.mpesa_receipt_number}" to +${refundTarget?.phone_number}?`}
        confirmText="Confirm M-Pesa Refund"
        variant="warning"
      />
    </div>
  );
}
