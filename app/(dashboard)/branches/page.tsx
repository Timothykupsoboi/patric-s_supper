'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService, Branch } from '@/services/branchService';
import { useTenant } from '@/context/TenantContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
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
import { Building2, Plus, MapPin, CheckCircle } from 'lucide-react';

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const { supermarketId, activeBranch, setBranch } = useTenant();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');

  // Table Sorting & Pagination State
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches', supermarketId],
    queryFn: () => branchService.getBranches(supermarketId),
  });

  const createMutation = useMutation({
    mutationFn: (newBranch: Partial<Branch>) => branchService.createBranch(newBranch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsOpen(false);
      setName('');
      setLocation('');
      toast.success('Branch Registered', 'New store branch was added successfully.');
    },
    onError: (err: any) => {
      toast.error('Registration Failed', err.message || 'Could not register store branch.');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      supermarket_id: supermarketId,
      name,
      location,
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

  // Filter, Sort, Paginate Branches
  const processedBranches = useMemo(() => {
    const q = search.toLowerCase();
    let result = branches.filter((b) => {
      return b.name.toLowerCase().includes(q) || (b.location && b.location.toLowerCase().includes(q));
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
  }, [branches, search, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedBranches.length / pageSize);
  const paginatedBranches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedBranches.slice(start, start + pageSize);
  }, [processedBranches, currentPage, pageSize]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supermarket Branch Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage store locations, branch assignments, and multi-branch data isolation</p>
        </div>
        <Button onClick={() => setIsOpen(true)} variant="primary" size="md">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Store Branch
        </Button>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map((b) => {
          const isCurrent = activeBranch?.id === b.id;
          return (
            <Card
              key={b.id}
              interactive
              className={isCurrent ? 'border-2 border-blue-600 bg-blue-50/20' : 'border border-slate-200'}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{b.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {b.location || 'Central CBD'}
                    </p>
                  </div>
                </div>
                {isCurrent && <Badge variant="success">Active Context</Badge>}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400 font-mono">Created: {formatDateTime(b.created_at)}</span>
                <Button
                  size="sm"
                  variant={isCurrent ? 'outline' : 'primary'}
                  onClick={() => {
                    setBranch(b);
                    toast.info('Context Switched', `Active store branch set to ${b.name}`);
                  }}
                >
                  {isCurrent ? 'Current' : 'Switch Context'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Branch Directory Table */}
      <Card className="p-0 overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-slate-50/50">
          <TableSearch
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search branch name or location..."
            className="w-full sm:w-80"
          />
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Branch Name
                </SortableTableHead>
                <SortableTableHead sortKey="location" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Physical Location
                </SortableTableHead>
                <SortableTableHead sortKey="created_at" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                  Date Registered
                </SortableTableHead>
                <th className="p-3.5 text-left font-black text-slate-700">Context Status</th>
                <th className="p-3.5 text-right font-black text-slate-700">Action</th>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={3} cols={5} />
            ) : paginatedBranches.length === 0 ? (
              <TableBody>
                <TableEmptyState
                  title="No branches found"
                  description="No store branches match your search."
                  icon={Building2}
                  colSpan={5}
                />
              </TableBody>
            ) : (
              <TableBody>
                {paginatedBranches.map((b) => {
                  const isCurrent = activeBranch?.id === b.id;

                  return (
                    <TableRow key={b.id} className={isCurrent ? 'bg-blue-50/40' : ''}>
                      <TableCell className="font-extrabold text-slate-900">{b.name}</TableCell>
                      <TableCell className="text-slate-600 font-medium">{b.location || '-'}</TableCell>
                      <TableCell className="text-slate-500 font-mono">{formatDateTime(b.created_at)}</TableCell>
                      <TableCell>
                        {isCurrent ? <Badge variant="success">Active Context</Badge> : <Badge variant="secondary">Inactive Context</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={isCurrent ? 'outline' : 'primary'}
                          onClick={() => {
                            setBranch(b);
                            toast.info('Context Switched', `Active store branch set to ${b.name}`);
                          }}
                        >
                          {isCurrent ? 'Active' : 'Switch Context'}
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
          totalItems={processedBranches.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* Create Branch Modal */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Register Supermarket Branch">
        <form onSubmit={handleCreate} className="space-y-4 font-sans">
          <Input isFloating label="Branch Name" value={name} onChange={(e) => setName(e.target.value)} icon={<Building2 className="w-4 h-4" />} placeholder="e.g. Eldoret West Branch" required />
          <Input isFloating label="Physical Location / City" value={location} onChange={(e) => setLocation(e.target.value)} icon={<MapPin className="w-4 h-4" />} placeholder="e.g. Uganda Road, Eldoret" required />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              {createMutation.isPending ? 'Registering...' : 'Save Branch'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
