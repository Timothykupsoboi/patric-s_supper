'use client';

import React, { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '@/services/supplierService';
import { inventoryService } from '@/services/inventoryService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Truck, Plus, Edit3, Trash2, PackageCheck, User, Phone, Mail, Building, LayoutGrid, List } from 'lucide-react';
import { Supplier } from '@/types';

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'directory' | 'purchase_orders'>('directory');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [isOpen, setIsOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Table Sorting & Pagination State
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form State for Supplier Creation / Edit
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const { data: suppliers = [], isLoading: isSuppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers(),
  });

  const { data: purchaseOrders = [], isLoading: isPOLoading } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => inventoryService.getPurchaseOrders(),
  });

  // Supabase Realtime Sync
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('suppliers_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => {
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const activePOCount = purchaseOrders.filter((po) => po.status === 'ordered').length;

  const createMutation = useMutation({
    mutationFn: (newSup: any) => supplierService.createSupplier(newSup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsOpen(false);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      toast.success('Supplier Created', 'Vendor profile registered successfully.');
    },
    onError: (err: any) => {
      toast.error('Creation Failed', err.message || 'Could not register supplier.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Supplier> }) =>
      supplierService.updateSupplier(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditSupplier(null);
      toast.success('Supplier Updated', 'Vendor details updated successfully.');
    },
    onError: (err: any) => {
      toast.error('Update Failed', err.message || 'Could not update vendor profile.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier Deleted', 'Vendor profile was deleted.');
    },
    onError: (err: any) => {
      toast.error('Deletion Failed', err.message || 'Could not delete vendor profile.');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      contact_person: contactPerson,
      phone,
      email,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSupplier) return;
    updateMutation.mutate({
      id: editSupplier.id,
      updates: {
        name: editSupplier.name,
        contact_person: editSupplier.contact_person,
        phone: editSupplier.phone,
        email: editSupplier.email,
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

  // Filter, Sort, Paginate Suppliers
  const processedSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = suppliers.filter((sup) => {
      return (
        sup.name.toLowerCase().includes(q) ||
        (sup.contact_person && sup.contact_person.toLowerCase().includes(q)) ||
        (sup.phone && sup.phone.includes(q)) ||
        (sup.email && sup.email.toLowerCase().includes(q))
      );
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
  }, [suppliers, searchQuery, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedSuppliers.length / pageSize);
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedSuppliers.slice(start, start + pageSize);
  }, [processedSuppliers, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedSuppliers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedSuppliers.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    for (const id of selectedIds) {
      await supplierService.deleteSupplier(id);
    }
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    toast.success('Bulk Delete Complete', `Removed ${selectedIds.length} vendor profiles.`);
    setSelectedIds([]);
    setIsBulkDeleting(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supplier & Procurement Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage vendor contacts, purchase orders, and wholesale deliveries</p>
        </div>
        <Button onClick={() => setIsOpen(true)} variant="primary" size="md">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Supplier Profile
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: 'directory', label: `Vendor Directory (${suppliers.length})`, icon: Truck },
          { id: 'purchase_orders', label: `Purchase Orders (${activePOCount})`, icon: PackageCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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

      {/* Tab 1: Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filter Bar & View Switcher */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center shadow-xs">
            <TableSearch
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setCurrentPage(1);
              }}
              placeholder="Search vendor name, contact person, phone..."
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
                          checked={selectedIds.length > 0 && selectedIds.length === paginatedSuppliers.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <SortableTableHead sortKey="name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Supplier Name
                      </SortableTableHead>
                      <SortableTableHead sortKey="contact_person" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Contact Person
                      </SortableTableHead>
                      <SortableTableHead sortKey="phone" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Phone Number
                      </SortableTableHead>
                      <SortableTableHead sortKey="email" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Email Address
                      </SortableTableHead>
                      <th className="p-3.5 text-left font-black text-slate-700">Status</th>
                      <th className="p-3.5 text-right font-black text-slate-700">Actions</th>
                    </TableRow>
                  </TableHeader>
                  {isSuppliersLoading ? (
                    <TableSkeleton rows={5} cols={7} />
                  ) : paginatedSuppliers.length === 0 ? (
                    <TableBody>
                      <TableEmptyState
                        title="No vendor profiles found"
                        description="No supplier records match your search query."
                        icon={Truck}
                        actionButton={
                          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                            <Plus className="w-4 h-4 mr-1" /> Create Supplier Profile
                          </Button>
                        }
                        colSpan={7}
                      />
                    </TableBody>
                  ) : (
                    <TableBody>
                      {paginatedSuppliers.map((sup) => {
                        const isSelected = selectedIds.includes(sup.id);

                        return (
                          <TableRow key={sup.id} className={isSelected ? 'bg-blue-50/50' : ''}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOne(sup.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-extrabold text-slate-900">{sup.name}</TableCell>
                            <TableCell className="text-slate-600 font-medium">{sup.contact_person || '-'}</TableCell>
                            <TableCell className="font-mono text-slate-500">{sup.phone || '-'}</TableCell>
                            <TableCell className="text-slate-500">{sup.email || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="success">Active</Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="outline" size="sm" onClick={() => setEditSupplier(sup)}>
                                <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteTarget(sup)}
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
                totalItems={processedSuppliers.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </Card>
          ) : (
            /* Grid Cards View Mode */
            <div className="space-y-4">
              {isSuppliersLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-44 bg-slate-200 rounded-3xl animate-pulse"></div>
                  ))}
                </div>
              ) : paginatedSuppliers.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                  <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-black text-slate-700">No vendor profiles found</p>
                  <p className="text-xs text-slate-400 mt-1">No supplier records match your search criteria.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {paginatedSuppliers.map((sup) => (
                    <Card key={sup.id} className="p-4 border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-extrabold text-sm border border-amber-100">
                              <Building className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-black text-sm text-slate-900 line-clamp-1">{sup.name}</h3>
                              <p className="text-[11px] text-slate-500 font-medium">Contact: {sup.contact_person || 'N/A'}</p>
                            </div>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs font-mono">
                          <div className="flex items-center text-slate-600">
                            <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            <span>{sup.phone || 'No phone recorded'}</span>
                          </div>
                          <div className="flex items-center text-slate-600">
                            <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            <span className="truncate">{sup.email || 'No email recorded'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditSupplier(sup)}
                          className="flex-1 text-xs font-bold"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(sup)}
                          className="text-red-600 hover:bg-red-50 hover:border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
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
        </div>
      )}

      {/* Tab 2: Purchase Orders */}
      {activeTab === 'purchase_orders' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="p-3.5 text-left font-black text-slate-700">PO Number</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Supplier</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Order Date</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Total Amount</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Delivery Status</th>
                </TableRow>
              </TableHeader>
              {isPOLoading ? (
                <TableSkeleton rows={5} cols={5} />
              ) : purchaseOrders.length === 0 ? (
                <TableBody>
                  <TableEmptyState
                    title="No purchase orders created yet"
                    description="Create purchase orders from the Inventory Stock Audit tab."
                    icon={PackageCheck}
                    colSpan={5}
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-extrabold text-slate-900">{po.order_number || po.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-bold text-slate-700">{po.supplier?.name || 'Vendor'}</TableCell>
                      <TableCell className="text-slate-500 font-mono">{formatDateTime(po.created_at)}</TableCell>
                      <TableCell className="font-black text-slate-900">{formatCurrency(po.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === 'received' ? 'success' : 'info'} className="uppercase">
                          {po.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Add Supplier Modal */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Supplier Profile">
        <form onSubmit={handleCreate} className="space-y-4 font-sans">
          <Input isFloating label="Supplier/Company Name" value={name} onChange={(e) => setName(e.target.value)} icon={<Building className="w-4 h-4" />} required />
          <Input isFloating label="Contact Person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} icon={<User className="w-4 h-4" />} />
          <Input isFloating label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone className="w-4 h-4" />} />
          <Input isFloating label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Supplier'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Supplier Modal */}
      <Dialog isOpen={!!editSupplier} onClose={() => setEditSupplier(null)} title={`Edit Supplier: ${editSupplier?.name}`}>
        {editSupplier && (
          <form onSubmit={handleUpdate} className="space-y-4 font-sans">
            <Input isFloating label="Supplier Name" value={editSupplier.name} onChange={(e) => setEditSupplier({ ...editSupplier, name: e.target.value })} icon={<Building className="w-4 h-4" />} required />
            <Input isFloating label="Contact Person" value={editSupplier.contact_person || ''} onChange={(e) => setEditSupplier({ ...editSupplier, contact_person: e.target.value })} icon={<User className="w-4 h-4" />} />
            <Input isFloating label="Phone Number" value={editSupplier.phone || ''} onChange={(e) => setEditSupplier({ ...editSupplier, phone: e.target.value })} icon={<Phone className="w-4 h-4" />} />
            <Input isFloating label="Email Address" type="email" value={editSupplier.email || ''} onChange={(e) => setEditSupplier({ ...editSupplier, email: e.target.value })} icon={<Mail className="w-4 h-4" />} />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditSupplier(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Supplier'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Delete Single Supplier Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
        title="Delete Supplier Profile"
        message={`Are you sure you want to delete vendor "${deleteTarget?.name}"? All associated procurement records will be affected.`}
        confirmText="Delete Supplier"
        variant="danger"
      />

      {/* Delete Bulk Suppliers Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        onConfirm={confirmBulkDelete}
        title="Bulk Delete Supplier Accounts"
        message={`Are you sure you want to delete all ${selectedIds.length} selected vendor profiles? This action cannot be undone.`}
        confirmText="Delete Selected"
        variant="danger"
      />
    </div>
  );
}
