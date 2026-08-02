'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '@/services/supplierService';
import { inventoryService } from '@/services/inventoryService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Truck, Plus, Edit3, Trash2, PackageCheck } from 'lucide-react';
import { Supplier } from '@/types';

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'directory' | 'purchase_orders'>('directory');
  const [isOpen, setIsOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Supplier Creation / Edit
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers(),
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => inventoryService.getPurchaseOrders(),
  });

  const createMutation = useMutation({
    mutationFn: (newSup: any) => supplierService.createSupplier(newSup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsOpen(false);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Supplier> }) =>
      supplierService.updateSupplier(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditSupplier(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
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

  const filteredSuppliers = suppliers.filter((sup) => {
    const q = searchQuery.toLowerCase();
    return (
      sup.name.toLowerCase().includes(q) ||
      (sup.contact_person && sup.contact_person.toLowerCase().includes(q)) ||
      (sup.phone && sup.phone.includes(q)) ||
      (sup.email && sup.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Supplier & Procurement Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage vendor contacts, purchase orders, and wholesale deliveries</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 font-bold text-xs mt-3 sm:mt-0">
          <Plus className="w-4 h-4 mr-1.5" />
          + Add Supplier Profile
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: 'directory', label: `Vendor Directory (${suppliers.length})`, icon: Truck },
          { id: 'purchase_orders', label: `Purchase Orders & Deliveries (${purchaseOrders.length})`, icon: PackageCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
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
          <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <Input
              placeholder="Search vendor name, contact person, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md text-xs font-medium"
            />
            <span className="text-xs text-slate-400 font-bold pr-2">
              Showing {filteredSuppliers.length} of {suppliers.length} Suppliers
            </span>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Contact Person</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                        No suppliers found. Click "+ Add Supplier Profile" to register a new vendor.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900">{sup.name}</td>
                    <td className="p-3 text-slate-600">{sup.contact_person || '-'}</td>
                    <td className="p-3 font-mono text-slate-500">{sup.phone || '-'}</td>
                    <td className="p-3 text-slate-500">{sup.email || '-'}</td>
                    <td className="p-3">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button variant="outline" size="sm" onClick={() => setEditSupplier(sup)} className="font-bold text-[11px] py-1">
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete supplier profile "${sup.name}"?`)) {
                            deleteMutation.mutate(sup.id);
                          }
                        }}
                        className="font-bold text-[11px] py-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )}

      {/* Tab 2: Purchase Orders & Deliveries */}
      {activeTab === 'purchase_orders' && (
        <Card>
          <CardHeader>
            <CardTitle>Wholesale Deliveries & PO Lifecycle</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Order Date</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900">{po.order_number || po.id.slice(0, 8)}</td>
                    <td className="p-3 font-bold text-slate-700">{po.supplier?.name || 'Vendor'}</td>
                    <td className="p-3 text-slate-400">{formatDateTime(po.created_at)}</td>
                    <td className="p-3 font-black text-slate-900">{formatCurrency(po.total_amount)}</td>
                    <td className="p-3 uppercase font-bold text-blue-600">{po.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Supplier Modal */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Supplier Profile">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input label="Supplier/Company Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Contact Person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Saving...' : 'Save Supplier'}
          </Button>
        </form>
      </Dialog>

      {/* Edit Supplier Modal */}
      <Dialog isOpen={!!editSupplier} onClose={() => setEditSupplier(null)} title={`Edit Supplier: ${editSupplier?.name}`}>
        {editSupplier && (
          <form onSubmit={handleUpdate} className="space-y-3">
            <Input label="Supplier Name" value={editSupplier.name} onChange={(e) => setEditSupplier({ ...editSupplier, name: e.target.value })} required />
            <Input label="Contact Person" value={editSupplier.contact_person || ''} onChange={(e) => setEditSupplier({ ...editSupplier, contact_person: e.target.value })} />
            <Input label="Phone Number" value={editSupplier.phone || ''} onChange={(e) => setEditSupplier({ ...editSupplier, phone: e.target.value })} />
            <Input label="Email Address" type="email" value={editSupplier.email || ''} onChange={(e) => setEditSupplier({ ...editSupplier, email: e.target.value })} />

            <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Supplier'}
            </Button>
          </form>
        )}
      </Dialog>
    </div>
  );
}
