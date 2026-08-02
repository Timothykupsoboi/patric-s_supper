import { createClient } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/types';

export type PermissionKey =
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'sales.create'
  | 'sales.refund'
  | 'inventory.manage'
  | 'customers.manage'
  | 'reports.view'
  | 'expenses.manage'
  | 'suppliers.manage'
  | 'employees.manage'
  | 'branches.manage'
  | 'settings.manage'
  | 'platform.manage';

export type UserRoleCategory = 'Platform Owner' | 'Supermarket Owner' | 'Employee';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  platform_owner: 100,
  supermarket_owner: 85,
  branch_manager: 65,
  manager: 60,
  supervisor: 58,
  inventory_manager: 55,
  sales_manager: 50,
  accountant: 45,
  procurement_officer: 40,
  store_keeper: 35,
  customer_service: 30,
  cashier: 20,
};

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  platform_owner: [
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'sales.create', 'sales.refund', 'inventory.manage', 'reports.view',
    'customers.manage', 'expenses.manage', 'suppliers.manage', 'employees.manage',
    'branches.manage', 'settings.manage', 'platform.manage',
  ],
  supermarket_owner: [
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'sales.create', 'sales.refund', 'inventory.manage', 'reports.view',
    'customers.manage', 'expenses.manage', 'suppliers.manage', 'employees.manage',
    'branches.manage', 'settings.manage',
  ],
  branch_manager: [
    'products.view', 'products.create', 'products.edit',
    'sales.create', 'sales.refund', 'inventory.manage', 'reports.view',
    'customers.manage', 'expenses.manage', 'employees.manage',
  ],
  manager: [
    'products.view', 'products.create', 'products.edit',
    'sales.create', 'sales.refund', 'inventory.manage', 'reports.view',
    'customers.manage', 'expenses.manage', 'suppliers.manage', 'employees.manage',
    'branches.manage',
  ],
  supervisor: [
    'products.view', 'products.create', 'products.edit',
    'sales.create', 'sales.refund', 'inventory.manage', 'reports.view',
    'customers.manage',
  ],
  inventory_manager: [
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'inventory.manage', 'suppliers.manage',
  ],
  store_keeper: [
    'products.view', 'inventory.manage', 'suppliers.manage',
  ],
  accountant: [
    'reports.view', 'expenses.manage', 'sales.refund',
  ],
  sales_manager: [
    'sales.create', 'sales.refund', 'reports.view', 'customers.manage',
  ],
  procurement_officer: [
    'products.view', 'suppliers.manage', 'inventory.manage',
  ],
  customer_service: [
    'customers.manage', 'sales.refund',
  ],
  cashier: [
    'sales.create', 'products.view', 'customers.manage',
  ],
};

export const authService = {
  async login(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const profile = await this.getUserProfile(data.user.id);
    return { session: data.session, user: data.user, profile };
  },

  async register(params: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    supermarket_id?: string;
    branch_id?: string;
  }) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          role: params.role || 'cashier',
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      await supabase.from('users').insert([
        {
          id: data.user.id,
          name: params.name,
          email: params.email,
          role: params.role || 'cashier',
          supermarket_id: params.supermarket_id || '00000000-0000-0000-0000-000000000001',
          branch_id: params.branch_id || undefined,
          is_active: true,
        },
      ]);
    }

    return data;
  },

  async logout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async forgotPassword(email: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async resetPassword(newPassword: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  async getSession() {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  },

  getRoleCategory(role: UserRole): UserRoleCategory {
    if (role === 'platform_owner') return 'Platform Owner';
    if (role === 'supermarket_owner') return 'Supermarket Owner';
    return 'Employee';
  },

  isGlobalRole(role: UserRole): boolean {
    return role === 'platform_owner';
  },

  isSupermarketOwner(role: UserRole): boolean {
    return role === 'supermarket_owner';
  },

  isEmployeeRole(role: UserRole): boolean {
    return role !== 'platform_owner' && role !== 'supermarket_owner';
  },

  hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
  },

  hasPermission(userRole: UserRole, permission: PermissionKey): boolean {
    const allowed = ROLE_PERMISSIONS[userRole] || [];
    return allowed.includes(permission);
  },
};
