'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '@/services/supplierService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Truck, Plus } from 'lucide-react';

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers(),
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      supermarket_id: '00000000-0000-0000-0000-000000000001',
      name,
      contact_person: contactPerson,
      phone,
      email,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Supplier Directory</h1>
          <p className="text-xs text-gray-500">Manage distributors, vendors, and purchase contacts</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Supplier Profile
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold uppercase border-b border-gray-200">
              <tr>
                <th className="p-3">Supplier Name</th>
                <th className="p-3">Contact Person</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-gray-900">{sup.name}</td>
                  <td className="p-3 text-gray-600">{sup.contact_person || '-'}</td>
                  <td className="p-3 font-mono text-gray-500">{sup.phone || '-'}</td>
                  <td className="p-3 text-gray-500">{sup.email || '-'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
    </div>
  );
}
