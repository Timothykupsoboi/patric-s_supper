'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/employeeService';
import { branchService } from '@/services/branchService';
import { authService } from '@/services/authService';
import { auditService } from '@/services/auditService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/utils';
import { UserCheck, Shield, KeyRound, Activity, ShieldAlert, Plus, Edit3, Trash2, Building2 } from 'lucide-react';
import { UserProfile, UserRole } from '@/types';

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'employees' | 'audit_logs'>('employees');

  // Add Employee State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('cashier');
  const [addBranchId, setAddBranchId] = useState('');

  // Edit Employee State
  const [editEmployee, setEditEmployee] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('cashier');
  const [pin, setPin] = useState('');
  const [branchId, setBranchId] = useState('');

  const isManagerOrAbove = hasPermission('manager');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
    enabled: isManagerOrAbove,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', user?.supermarket_id],
    queryFn: () => branchService.getBranches(user?.supermarket_id || '00000000-0000-0000-0000-000000000001'),
    enabled: isManagerOrAbove,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => auditService.getAuditLogs(50),
    enabled: isManagerOrAbove,
  });

  const createStaffMutation = useMutation({
    mutationFn: (data: any) => authService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAddOpen(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddBranchId('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<UserProfile> }) =>
      employeeService.updateEmployee(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditEmployee(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    createStaffMutation.mutate({
      name: addName,
      email: addEmail,
      password: addPassword,
      role: addRole,
      branch_id: addBranchId || undefined,
      supermarket_id: user?.supermarket_id || '00000000-0000-0000-0000-000000000001',
    });
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;
    updateMutation.mutate({
      id: editEmployee.id,
      updates: { role, pin, branch_id: branchId || undefined },
    });
  };

  if (!isManagerOrAbove) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Employee management and audit logging require Manager or Administrator role permissions.
        </p>
        <Badge variant="danger">Role: {user?.role || 'Cashier'}</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff & RBAC Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage staff roles, terminal PIN shift credentials, branch assignments, and audit logs</p>
        </div>
        <div className="flex space-x-2 mt-3 sm:mt-0">
          <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 font-bold text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            + Add Staff Member
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: 'employees', label: `Staff Accounts (${employees.length})`, icon: UserCheck },
          { id: 'audit_logs', label: `Activity Audit Logs (${auditLogs.length})`, icon: Activity },
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

      {/* Tab 1: Staff Directory */}
      {activeTab === 'employees' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Branch Location</th>
                  <th className="p-3">Terminal PIN</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const assignedBranch = branches.find((b) => b.id === emp.branch_id);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-3 font-extrabold text-slate-900">{emp.name}</td>
                      <td className="p-3 text-slate-500">{emp.email}</td>
                      <td className="p-3">
                        <span className="uppercase font-black text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">
                        {assignedBranch?.name || 'All Store Branches'}
                      </td>
                      <td className="p-3 font-mono font-bold tracking-widest text-slate-700">{emp.pin || '••••'}</td>
                      <td className="p-3">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditEmployee(emp);
                            setRole(emp.role);
                            setPin(emp.pin || '');
                            setBranchId(emp.branch_id || '');
                          }}
                          className="text-[11px] font-bold py-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          Edit Role & Branch
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Remove staff account "${emp.name}"?`)) {
                              deleteMutation.mutate(emp.id);
                            }
                          }}
                          className="text-[11px] font-bold py-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Activity Audit Logs */}
      {activeTab === 'audit_logs' && (
        <Card>
          <CardHeader>
            <CardTitle>System Activity Logs</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User Action</th>
                  <th className="p-3">Entity / Table</th>
                  <th className="p-3">Record ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      No system activity logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400">{formatDateTime(log.created_at)}</td>
                      <td className="p-3 font-bold text-slate-900">{log.action}</td>
                      <td className="p-3 uppercase font-extrabold text-blue-600">{log.table_name || log.entity_type}</td>
                      <td className="p-3 font-mono text-slate-500">{log.record_id || log.entity_id || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Staff Modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Staff Member">
        <form onSubmit={handleCreateStaff} className="space-y-3">
          <Input label="Full Name" value={addName} onChange={(e) => setAddName(e.target.value)} required />
          <Input label="Email Address" type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required />
          <Input label="Initial Password" type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} required />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
            >
              <option value="cashier">Cashier</option>
              <option value="store_keeper">Store Keeper</option>
              <option value="accountant">Accountant</option>
              <option value="manager">Manager</option>
              <option value="owner">Organization Owner</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assign Store Branch</label>
            <select
              value={addBranchId}
              onChange={(e) => setAddBranchId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
            >
              <option value="">-- All Store Branches --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={createStaffMutation.isPending}>
            {createStaffMutation.isPending ? 'Registering...' : 'Save Staff Account'}
          </Button>
        </form>
      </Dialog>

      {/* Edit Role & PIN Modal */}
      <Dialog isOpen={!!editEmployee} onClose={() => setEditEmployee(null)} title={`Edit Staff: ${editEmployee?.name}`}>
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assign User Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
            >
              <option value="cashier">Cashier</option>
              <option value="store_keeper">Store Keeper</option>
              <option value="accountant">Accountant</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assign Store Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
            >
              <option value="">-- All Store Branches --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Terminal Shift Lock PIN (4-6 Digits)"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            placeholder="e.g. 1234"
          />

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Role, Branch & PIN'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
