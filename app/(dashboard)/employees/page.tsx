'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, RoleOption } from '@/services/employeeService';
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
import {
  UserCheck,
  UserX,
  Shield,
  KeyRound,
  Activity,
  ShieldAlert,
  Plus,
  Edit3,
  Trash2,
  Building2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, UserRole } from '@/types';

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'employees' | 'audit_logs'>('employees');

  // Dynamic database roles state
  const { data: dbRoles = [] } = useQuery({
    queryKey: ['availableRoles'],
    queryFn: () => employeeService.getAvailableRoles(),
  });

  // Add Employee State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('cashier');
  const [addBranchId, setAddBranchId] = useState('');
  const [addPin, setAddPin] = useState('');

  // Edit Employee State
  const [editEmployee, setEditEmployee] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [pin, setPin] = useState('');
  const [branchId, setBranchId] = useState('');

  // Reset Password Modal State
  const [resetEmployee, setResetEmployee] = useState<UserProfile | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const isOwnerOrManager = user?.role === 'supermarket_owner' || hasPermission('manager');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', user?.supermarket_id],
    queryFn: () => employeeService.getEmployees(user?.supermarket_id),
    enabled: isOwnerOrManager,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', user?.supermarket_id],
    queryFn: () => branchService.getBranches(user?.supermarket_id || '00000000-0000-0000-0000-000000000001'),
    enabled: isOwnerOrManager,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => auditService.getAuditLogs(50),
    enabled: isOwnerOrManager,
  });

  // Mutations
  const createStaffMutation = useMutation({
    mutationFn: (data: any) => authService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAddOpen(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddBranchId('');
      setAddPin('');
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

  const toggleStatusMutation = useMutation({
    mutationFn: (emp: UserProfile) => employeeService.toggleStatus(emp.id, emp.is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pwd }: { id: string; pwd: string }) => employeeService.resetEmployeePassword(id, pwd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setResetEmployee(null);
      setResetPassword('');
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
      pin: addPin || undefined,
    });
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;
    updateMutation.mutate({
      id: editEmployee.id,
      updates: {
        name: editName,
        email: editEmail,
        phone: editPhone,
        role,
        pin: pin || undefined,
        branch_id: branchId || undefined,
      },
    });
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmployee || !resetPassword) return;
    resetPasswordMutation.mutate({
      id: resetEmployee.id,
      pwd: resetPassword,
    });
  };

  if (!isOwnerOrManager) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Employee management and RBAC access control require Supermarket Owner or Manager permissions.
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Supermarket Employee Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, edit, suspend, assign roles & branches, and reset credentials for staff members
          </p>
        </div>
        <div className="flex space-x-2 mt-3 sm:mt-0">
          <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 font-bold text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            + Create Employee
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: 'employees', label: `Supermarket Staff (${employees.length})`, icon: UserCheck },
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
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Email & Contact</th>
                  <th className="p-3">Assigned Role (DB)</th>
                  <th className="p-3">Branch Location</th>
                  <th className="p-3">PIN</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const assignedBranch = branches.find((b) => b.id === emp.branch_id);
                  const isSuspended = emp.is_active === false;

                  return (
                    <tr key={emp.id} className={`hover:bg-slate-50 ${isSuspended ? 'bg-red-50/30' : ''}`}>
                      <td className="p-3 font-extrabold text-slate-900">{emp.name}</td>
                      <td className="p-3 text-slate-500">
                        <div>{emp.email}</div>
                        {emp.phone && <div className="text-[10px] text-slate-400">{emp.phone}</div>}
                      </td>
                      <td className="p-3">
                        <span className="uppercase font-black text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px]">
                          {emp.role ? emp.role.replace('_', ' ') : 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">
                        {assignedBranch?.name || 'All Store Branches'}
                      </td>
                      <td className="p-3 font-mono font-bold tracking-widest text-slate-700">{emp.pin || '••••'}</td>
                      <td className="p-3">
                        {isSuspended ? (
                          <Badge variant="danger">Suspended</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {/* Edit Employee */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditEmployee(emp);
                            setEditName(emp.name);
                            setEditEmail(emp.email || '');
                            setEditPhone(emp.phone || '');
                            setRole(emp.role);
                            setPin(emp.pin || '');
                            setBranchId(emp.branch_id || '');
                          }}
                          className="text-[11px] font-bold py-1"
                          title="Edit Employee"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>

                        {/* Suspend / Activate Employee */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate(emp)}
                          className={`text-[11px] font-bold py-1 ${
                            isSuspended
                              ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                              : 'text-amber-700 border-amber-300 hover:bg-amber-50'
                          }`}
                          title={isSuspended ? 'Activate Employee Account' : 'Suspend Employee Account'}
                        >
                          {isSuspended ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              Activate
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5 mr-1" />
                              Suspend
                            </>
                          )}
                        </Button>

                        {/* Reset Password */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResetEmployee(emp);
                            setResetPassword('');
                          }}
                          className="text-[11px] font-bold py-1 text-purple-700 border-purple-300 hover:bg-purple-50"
                          title="Reset Password"
                        >
                          <Lock className="w-3.5 h-3.5 mr-1" />
                          Reset Pwd
                        </Button>

                        {/* Delete Employee */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete employee "${emp.name}"?`)) {
                              deleteMutation.mutate(emp.id);
                            }
                          }}
                          className="text-[11px] font-bold py-1 text-red-600 border-red-200 hover:bg-red-50"
                          title="Delete Employee"
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

      {/* 1. Create Employee Modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Employee Account">
        <form onSubmit={handleCreateStaff} className="space-y-3">
          <Input label="Full Name" value={addName} onChange={(e) => setAddName(e.target.value)} required />
          <Input label="Email Address" type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required />
          <Input label="Initial Password" type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} required />
          
          {/* Dynamic Role Selection from Database */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assign Role (Fetched Dynamically from Database)
            </label>
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
            >
              {dbRoles.map((r) => (
                <option key={r.role_name} value={r.role_name}>
                  {r.role_label}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Assignment */}
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

          <Input
            label="POS Shift Lock PIN (4-6 Digits, Optional)"
            type="password"
            value={addPin}
            onChange={(e) => setAddPin(e.target.value)}
            maxLength={6}
            placeholder="e.g. 1234"
          />

          <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={createStaffMutation.isPending}>
            {createStaffMutation.isPending ? 'Creating Employee...' : 'Create Employee Account'}
          </Button>
        </form>
      </Dialog>

      {/* 2. Edit Employee Modal */}
      <Dialog isOpen={!!editEmployee} onClose={() => setEditEmployee(null)} title={`Edit Employee: ${editEmployee?.name}`}>
        <form onSubmit={handleSaveEmployee} className="space-y-3">
          <Input label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <Input label="Email Address" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
          <Input label="Phone Number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+254 7..." />

          {/* Dynamic Role Selection from Database */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assign User Role (Fetched Dynamically from Database)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
            >
              {dbRoles.map((r) => (
                <option key={r.role_name} value={r.role_name}>
                  {r.role_label}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Assignment */}
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
            {updateMutation.isPending ? 'Saving...' : 'Save Employee Details'}
          </Button>
        </form>
      </Dialog>

      {/* 3. Reset Password Modal */}
      <Dialog isOpen={!!resetEmployee} onClose={() => setResetEmployee(null)} title={`Reset Password: ${resetEmployee?.name}`}>
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Set a new password for employee <span className="font-extrabold text-slate-900">{resetEmployee?.name}</span> ({resetEmployee?.email}).
          </p>
          <Input
            label="New Password"
            type="password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
            minLength={6}
          />

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 font-bold"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? 'Resetting Password...' : 'Confirm Reset Password'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
