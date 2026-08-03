'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, RoleOption } from '@/services/employeeService';
import { branchService } from '@/services/branchService';
import { authService } from '@/services/authService';
import { auditService } from '@/services/auditService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge, RoleBadge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
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
  TableBulkActions,
} from '@/components/ui/table';
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
  Key,
  Mail,
  Lock,
  Phone,
  User,
  LayoutGrid,
  List,
} from 'lucide-react';
import { UserProfile, UserRole } from '@/types';

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'employees' | 'audit_logs'>('employees');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [search, setSearch] = useState('');

  // Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserProfile | null>(null);
  const [clearPinTarget, setClearPinTarget] = useState<UserProfile | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Table Sorting & Pagination State
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  // PIN Management State
  const [pinModalEmployee, setPinModalEmployee] = useState<UserProfile | null>(null);
  const [newPinValue, setNewPinValue] = useState('');

  const isOwnerOrManager = user?.role === 'supermarket_owner' || hasPermission('manager');

  const { data: employees = [], isLoading: isEmpLoading } = useQuery({
    queryKey: ['employees', user?.supermarket_id],
    queryFn: () => employeeService.getEmployees(user?.supermarket_id),
    enabled: isOwnerOrManager,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', user?.supermarket_id],
    queryFn: () => branchService.getBranches(user?.supermarket_id || '00000000-0000-0000-0000-000000000001'),
    enabled: isOwnerOrManager,
  });

  const { data: auditLogs = [], isLoading: isAuditLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => auditService.getAuditLogs(50),
    enabled: isOwnerOrManager,
  });

  // Dynamic Options
  const roleOptions = useMemo(() => dbRoles.map((r) => ({ value: r.role_name, label: r.role_label })), [dbRoles]);
  const branchOptions = useMemo(
    () => [{ value: '', label: '-- All Store Branches --' }, ...branches.map((b) => ({ value: b.id, label: b.name }))],
    [branches]
  );

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
      toast.success('Staff Account Created', 'Employee profile registered successfully.');
    },
    onError: (err: any) => {
      toast.error('Creation Failed', err.message || 'Could not register staff account.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<UserProfile> }) =>
      employeeService.updateEmployee(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditEmployee(null);
      toast.success('Profile Updated', 'Employee details updated successfully.');
    },
    onError: (err: any) => {
      toast.error('Update Failed', err.message || 'Could not update employee details.');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (emp: UserProfile) => employeeService.toggleStatus(emp.id, emp.is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Account Status Changed', 'Employee account status updated.');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pwd }: { id: string; pwd: string }) => employeeService.resetEmployeePassword(id, pwd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setResetEmployee(null);
      setResetPassword('');
      toast.success('Password Reset', 'Staff member password updated.');
    },
  });

  const updatePinMutation = useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string | null }) => employeeService.updatePin(id, pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setPinModalEmployee(null);
      setNewPinValue('');
      toast.success('Terminal PIN Updated', 'POS shift lock PIN updated.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee Deleted', 'Staff account removed.');
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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filter, Sort, Paginate Employees
  const processedEmployees = useMemo(() => {
    const q = search.toLowerCase();
    let result = employees.filter((emp) => {
      return (
        emp.name.toLowerCase().includes(q) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        (emp.role && emp.role.toLowerCase().includes(q))
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
  }, [employees, search, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedEmployees.length / pageSize);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedEmployees.slice(start, start + pageSize);
  }, [processedEmployees, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedEmployees.map((e) => e.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    for (const id of selectedIds) {
      await employeeService.deleteEmployee(id);
    }
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast.success('Bulk Delete Complete', `Removed ${selectedIds.length} staff accounts.`);
    setSelectedIds([]);
    setIsBulkDeleting(false);
  };

  if (!isOwnerOrManager) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-slate-200 font-sans shadow-xs">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4 border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 font-medium leading-relaxed">
          Employee management and RBAC access control require Supermarket Owner or Manager permissions.
        </p>
        <Badge variant="danger">Role: {user?.role || 'Cashier'}</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supermarket Employee Management</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Create, edit, suspend, assign roles & branches, and reset credentials for staff members
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} variant="primary" size="md">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Employee
        </Button>
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

      {/* Tab 1: Staff Directory */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Filter Bar & View Switcher */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center shadow-xs">
            <TableSearch
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search staff by name, email, or role..."
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
                          checked={selectedIds.length > 0 && selectedIds.length === paginatedEmployees.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <SortableTableHead sortKey="name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Staff Member
                      </SortableTableHead>
                      <SortableTableHead sortKey="email" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Email & Contact
                      </SortableTableHead>
                      <SortableTableHead sortKey="role" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Assigned Role
                      </SortableTableHead>
                      <th className="p-3.5 text-left font-black text-slate-700">Branch Location</th>
                      <th className="p-3.5 text-left font-black text-slate-700">PIN</th>
                      <th className="p-3.5 text-left font-black text-slate-700">Account Status</th>
                      <th className="p-3.5 text-right font-black text-slate-700">Actions</th>
                    </TableRow>
                  </TableHeader>
                  {isEmpLoading ? (
                    <TableSkeleton rows={5} cols={8} />
                  ) : paginatedEmployees.length === 0 ? (
                    <TableBody>
                      <TableEmptyState
                        title="No staff profiles found"
                        description="No employee records match your search criteria."
                        icon={UserCheck}
                        actionButton={
                          <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
                            <Plus className="w-4 h-4 mr-1" /> Create Staff Account
                          </Button>
                        }
                        colSpan={8}
                      />
                    </TableBody>
                  ) : (
                    <TableBody>
                      {paginatedEmployees.map((emp) => {
                        const assignedBranch = branches.find((b) => b.id === emp.branch_id);
                        const isSuspended = emp.is_active === false;
                        const isSelected = selectedIds.includes(emp.id);

                        return (
                          <TableRow key={emp.id} className={`${isSuspended ? 'bg-red-50/40' : ''} ${isSelected ? 'bg-blue-50/50' : ''}`}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOne(emp.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-extrabold text-slate-900">{emp.name}</TableCell>
                            <TableCell className="text-slate-500">
                              <div>{emp.email}</div>
                              {emp.phone && <div className="text-[10px] text-slate-400 font-mono">{emp.phone}</div>}
                            </TableCell>
                            <TableCell>
                              <RoleBadge role={emp.role || 'cashier'} />
                            </TableCell>
                            <TableCell className="font-bold text-slate-700">
                              {assignedBranch?.name || 'All Store Branches'}
                            </TableCell>
                            <TableCell className="font-mono font-bold tracking-widest text-slate-700">{emp.pin || '••••'}</TableCell>
                            <TableCell>
                              {isSuspended ? (
                                <Badge variant="danger">Suspended</Badge>
                              ) : (
                                <Badge variant="success">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
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
                              >
                                <Edit3 className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (
                                    emp.role === 'supermarket_owner' ||
                                    emp.role === 'super_admin' ||
                                    emp.role === 'owner'
                                  ) {
                                    toast.warning(
                                      'Restricted Operation',
                                      'Supermarket Owner accounts cannot be suspended locally.'
                                    );
                                    return;
                                  }
                                  setToggleTarget(emp);
                                }}
                                className={
                                  isSuspended
                                    ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                    : 'text-amber-700 border-amber-300 hover:bg-amber-50'
                                }
                              >
                                {isSuspended ? 'Activate' : 'Suspend'}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPinModalEmployee(emp);
                                  setNewPinValue(emp.pin || '');
                                }}
                                className="text-blue-700 border-blue-300 hover:bg-blue-50"
                              >
                                <KeyRound className="w-3.5 h-3.5 mr-1" />
                                PIN
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setResetEmployee(emp);
                                  setResetPassword('');
                                }}
                              >
                                <Key className="w-3.5 h-3.5 mr-1" />
                                Password
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (
                                    emp.role === 'supermarket_owner' ||
                                    emp.role === 'super_admin' ||
                                    emp.role === 'owner'
                                  ) {
                                    toast.warning(
                                      'Restricted Operation',
                                      'Supermarket Owner accounts cannot be deleted locally.'
                                    );
                                    return;
                                  }
                                  setDeleteTarget(emp);
                                }}
                                className="text-red-600 border-red-200 hover:bg-red-50"
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
                totalItems={processedEmployees.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </Card>
          ) : (
            /* Grid Cards View Mode */
            <div className="space-y-4">
              {isEmpLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-slate-200 rounded-3xl animate-pulse"></div>
                  ))}
                </div>
              ) : paginatedEmployees.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                  <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-black text-slate-700">No staff profiles found</p>
                  <p className="text-xs text-slate-400 mt-1">No employee records match your search criteria.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {paginatedEmployees.map((emp) => {
                    const assignedBranch = branches.find((b) => b.id === emp.branch_id);
                    const isSuspended = emp.is_active === false;

                    return (
                      <Card key={emp.id} className={`p-4 border hover:border-blue-400 transition-all flex flex-col justify-between space-y-3 ${isSuspended ? 'bg-red-50/40 border-red-200' : 'border-slate-200'}`}>
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-sm border border-blue-100">
                                <User className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-black text-sm text-slate-900 line-clamp-1">{emp.name}</h3>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{emp.email}</p>
                              </div>
                            </div>
                            {isSuspended ? <Badge variant="danger">Suspended</Badge> : <Badge variant="success">Active</Badge>}
                          </div>

                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-bold">Role:</span>
                              <RoleBadge role={emp.role || 'cashier'} />
                            </div>
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-slate-500">Branch:</span>
                              <span className="text-slate-900">{assignedBranch?.name || 'All Store Branches'}</span>
                            </div>
                            <div className="flex justify-between items-center font-mono">
                              <span className="text-slate-500 font-sans font-bold">Terminal PIN:</span>
                              <span className="font-black tracking-widest text-slate-700">{emp.pin || '••••'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Employee Actions */}
                        <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100">
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
                            className="text-xs p-0"
                            title="Edit Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setToggleTarget(emp)}
                            className={`text-xs p-0 ${isSuspended ? 'text-emerald-700 border-emerald-300' : 'text-amber-700 border-amber-300'}`}
                            title={isSuspended ? 'Activate Account' : 'Suspend Account'}
                          >
                            {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPinModalEmployee(emp);
                              setNewPinValue(emp.pin || '');
                            }}
                            className="text-xs p-0 text-blue-700 border-blue-300"
                            title="Manage Terminal PIN"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetEmployee(emp);
                              setResetPassword('');
                            }}
                            className="text-xs p-0"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(emp)}
                            className="text-xs p-0 text-red-600 hover:bg-red-50 hover:border-red-200"
                            title="Delete Employee"
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
        </div>
      )}

      {/* Tab 2: Activity Audit Logs */}
      {activeTab === 'audit_logs' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="p-3.5 text-left font-black text-slate-700">Timestamp</th>
                  <th className="p-3.5 text-left font-black text-slate-700">User Action</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Entity / Table</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Record ID</th>
                </TableRow>
              </TableHeader>
              {isAuditLoading ? (
                <TableSkeleton rows={5} cols={4} />
              ) : auditLogs.length === 0 ? (
                <TableBody>
                  <TableEmptyState
                    title="No system activity logs recorded"
                    description="Audit events will automatically populate as staff perform operations."
                    icon={Activity}
                    colSpan={4}
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {auditLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-slate-500 font-mono">{formatDateTime(log.created_at)}</TableCell>
                      <TableCell className="font-bold text-slate-900">{log.action}</TableCell>
                      <TableCell>
                        <Badge variant="info" className="uppercase">
                          {log.table_name || log.entity_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-slate-500">{log.record_id || log.entity_id || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* 1. Create Employee Modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Employee Account">
        <form onSubmit={handleCreateStaff} className="space-y-4 font-sans">
          <Input isFloating label="Full Name" value={addName} onChange={(e) => setAddName(e.target.value)} icon={<User className="w-4 h-4" />} required />
          <Input isFloating label="Email Address" type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} required />
          <Input isFloating label="Initial Password" type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} icon={<Lock className="w-4 h-4" />} required />
          
          <Select
            isFloating
            label="Assign User Role"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value as UserRole)}
            icon={<Shield className="w-4 h-4" />}
            options={roleOptions}
            required
          />

          <Select
            isFloating
            label="Assign Store Branch"
            value={addBranchId}
            onChange={(e) => setAddBranchId(e.target.value)}
            icon={<Building2 className="w-4 h-4" />}
            options={branchOptions}
          />

          <Input
            isFloating
            label="POS Shift Lock PIN (4-6 Digits, Optional)"
            type="password"
            value={addPin}
            onChange={(e) => setAddPin(e.target.value)}
            icon={<KeyRound className="w-4 h-4" />}
            maxLength={6}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createStaffMutation.isPending}>
              {createStaffMutation.isPending ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 2. Edit Employee Modal */}
      <Dialog isOpen={!!editEmployee} onClose={() => setEditEmployee(null)} title={`Edit Employee: ${editEmployee?.name}`}>
        <form onSubmit={handleSaveEmployee} className="space-y-4 font-sans">
          <Input isFloating label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} icon={<User className="w-4 h-4" />} required />
          <Input isFloating label="Email Address" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} required />
          <Input isFloating label="Phone Number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} icon={<Phone className="w-4 h-4" />} />

          <Select
            isFloating
            label="Assign User Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            icon={<Shield className="w-4 h-4" />}
            options={roleOptions}
            required
          />

          <Select
            isFloating
            label="Assign Store Branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            icon={<Building2 className="w-4 h-4" />}
            options={branchOptions}
          />

          <Input
            isFloating
            label="Terminal Shift Lock PIN (4-6 Digits)"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            icon={<KeyRound className="w-4 h-4" />}
            maxLength={6}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditEmployee(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Employee Details'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 3. Reset Password Modal */}
      <Dialog isOpen={!!resetEmployee} onClose={() => setResetEmployee(null)} title={`Reset Password: ${resetEmployee?.name}`}>
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4 font-sans">
          <p className="text-xs text-slate-500 font-medium">
            Set a new password for employee <span className="font-extrabold text-slate-900">{resetEmployee?.name}</span> ({resetEmployee?.email}).
          </p>
          <Input
            isFloating
            label="New Password"
            type="password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            placeholder="Minimum 6 characters"
            required
            minLength={6}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setResetEmployee(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Confirm Reset Password'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 4. PIN Management Modal */}
      <Dialog
        isOpen={!!pinModalEmployee}
        onClose={() => setPinModalEmployee(null)}
        title={`Terminal PIN Management: ${pinModalEmployee?.name}`}
      >
        <div className="space-y-4 font-sans">
          <p className="text-xs text-slate-500 font-medium">
            Configure or disable the Terminal Unlock PIN for <span className="font-extrabold text-slate-900">{pinModalEmployee?.name}</span>.
          </p>

          <Input
            isFloating
            label="Terminal PIN (4-6 Numeric Digits)"
            type="password"
            value={newPinValue}
            onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
            icon={<KeyRound className="w-4 h-4" />}
            maxLength={6}
          />

          <div className="flex space-x-2 pt-2">
            <Button
              onClick={() => {
                if (!newPinValue || newPinValue.length < 4) {
                  toast.error('Validation Error', 'Please enter a valid 4-6 digit numeric PIN.');
                  return;
                }
                updatePinMutation.mutate({ id: pinModalEmployee!.id, pin: newPinValue });
              }}
              variant="primary"
              className="w-1/2"
              isLoading={updatePinMutation.isPending}
            >
              {pinModalEmployee?.pin ? 'Change PIN' : 'Create PIN'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setClearPinTarget(pinModalEmployee)}
              className="w-1/2 text-red-600 border-red-200 hover:bg-red-50 font-bold text-xs"
            >
              Disable PIN
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
        title="Delete Employee Account"
        message={`Are you sure you want to delete staff profile "${deleteTarget?.name}"? Account access and credentials will be removed.`}
        confirmText="Delete Staff Account"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={async () => {
          if (toggleTarget) {
            await toggleStatusMutation.mutateAsync(toggleTarget);
          }
        }}
        title={toggleTarget?.is_active === false ? 'Activate Staff Account' : 'Suspend Staff Account'}
        message={`Are you sure you want to ${toggleTarget?.is_active === false ? 'activate' : 'suspend'} staff member "${toggleTarget?.name}"?`}
        confirmText={toggleTarget?.is_active === false ? 'Activate Account' : 'Suspend Account'}
        variant={toggleTarget?.is_active === false ? 'info' : 'warning'}
      />

      <ConfirmDialog
        isOpen={!!clearPinTarget}
        onClose={() => setClearPinTarget(null)}
        onConfirm={async () => {
          if (clearPinTarget) {
            await updatePinMutation.mutateAsync({ id: clearPinTarget.id, pin: null });
          }
        }}
        title="Disable Terminal PIN"
        message={`Are you sure you want to clear the terminal PIN for "${clearPinTarget?.name}"? They will not be able to log in to terminal shifts using PIN.`}
        confirmText="Disable PIN"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        onConfirm={confirmBulkDelete}
        title="Bulk Delete Staff Accounts"
        message={`Are you sure you want to delete all ${selectedIds.length} selected employee profiles? This operation cannot be undone.`}
        confirmText="Delete Selected"
        variant="danger"
      />
    </div>
  );
}
