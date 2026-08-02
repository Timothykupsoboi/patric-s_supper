import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { authService } from './authService';

export interface RoleOption {
  role_name: string;
  role_label: string;
}

export const employeeService = {
  async getEmployees(supermarketId?: string): Promise<UserProfile[]> {
    const supabase = createClient();
    let query = supabase
      .from('users')
      .select('*')
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (supermarketId) {
      query = query.eq('supermarket_id', supermarketId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAvailableRoles(): Promise<RoleOption[]> {
    const supabase = createClient();
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_employee_roles');
      if (!rpcError && rpcData && rpcData.length > 0) {
        return rpcData.filter((r: RoleOption) => r.role_name !== 'platform_owner');
      }
    } catch {
      // safe fallback
    }

    const { data: dbData } = await supabase
      .from('users')
      .select('role')
      .eq('deleted', false);

    const defaultDbRoles = [
      'supermarket_owner',
      'branch_manager',
      'manager',
      'supervisor',
      'inventory_manager',
      'sales_manager',
      'accountant',
      'procurement_officer',
      'store_keeper',
      'customer_service',
      'cashier',
    ];

    const roleSet = new Set<string>(defaultDbRoles);
    if (dbData) {
      dbData.forEach((row) => {
        if (row.role && row.role !== 'platform_owner') {
          roleSet.add(row.role);
        }
      });
    }

    return Array.from(roleSet)
      .filter((r) => r !== 'platform_owner')
      .map((r) => ({
        role_name: r,
        role_label: r.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      }));
  },

  async toggleStatus(id: string, currentStatus: boolean): Promise<UserProfile> {
    const supabase = createClient();
    
    // Check target employee role first
    const { data: targetUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (
      targetUser?.role === 'supermarket_owner' ||
      targetUser?.role === 'super_admin' ||
      targetUser?.role === 'owner'
    ) {
      throw new Error(
        'The primary Supermarket Owner account cannot perform this action on itself. Only the Platform Owner may suspend or deactivate a Supermarket Owner account.'
      );
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        is_active: !currentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async verifyPin(pin: string, supermarketId?: string, employeeId?: string): Promise<UserProfile | null> {
    const supabase = createClient();
    let query = supabase
      .from('users')
      .select('*')
      .eq('pin', pin)
      .eq('is_active', true)
      .eq('deleted', false);

    if (supermarketId) {
      query = query.eq('supermarket_id', supermarketId);
    }
    if (employeeId) {
      query = query.eq('id', employeeId);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  async updatePin(id: string, newPin: string | null): Promise<UserProfile> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update({
        pin: newPin || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async disablePin(id: string): Promise<UserProfile> {
    return this.updatePin(id, null);
  },

  async resetEmployeePassword(id: string, newPassword: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async updateEmployee(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const supabase = createClient();

    // Prevent removing Supermarket Owner role
    if (updates.role) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', id)
        .single();

      if (
        (currentUser?.role === 'supermarket_owner' || currentUser?.role === 'super_admin' || currentUser?.role === 'owner') &&
        !['supermarket_owner', 'super_admin', 'owner'].includes(updates.role)
      ) {
        throw new Error(
          'The primary Supermarket Owner account cannot alter or remove its own primary owner role.'
        );
      }
    }

    // photo_url does NOT exist in the users table schema.
    // Strip it from the DB payload — it is stored in localStorage by the client.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { photo_url, ...dbUpdates } = updates as any;

    const { data, error } = await supabase
      .from('users')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Re-attach photo_url from localStorage so callers get the full profile object
    const storedPhotoUrl =
      typeof window !== 'undefined'
        ? localStorage.getItem(`profile_photo_${id}`) || undefined
        : undefined;

    return { ...data, photo_url: storedPhotoUrl };
  },

  async createEmployee(payload: {
    name: string;
    email: string;
    password?: string;
    role: string;
    branch_id?: string;
    supermarket_id?: string;
    pin?: string;
    phone?: string;
  }): Promise<UserProfile> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const targetSupermarketId = payload.supermarket_id || ctx?.supermarketId;

    if (!targetSupermarketId) {
      throw new Error('Supermarket tenant context is required to create an employee.');
    }

    // Map UI roles to valid database check constraint values:
    // ALLOWED: ['platform_owner', 'super_admin', 'admin', 'owner', 'manager', 'cashier', 'store_keeper', 'accountant']
    const roleMapping: Record<string, string> = {
      supermarket_owner: 'super_admin',
      branch_manager: 'manager',
      supervisor: 'manager',
      sales_manager: 'manager',
      inventory_manager: 'store_keeper',
      procurement_officer: 'store_keeper',
      customer_service: 'cashier',
    };

    const dbRole = roleMapping[payload.role] || payload.role;
    const validDbRoles = ['platform_owner', 'super_admin', 'admin', 'owner', 'manager', 'cashier', 'store_keeper', 'accountant'];
    const finalRole = validDbRoles.includes(dbRole) ? dbRole : 'cashier';

    let defaultBranchId = payload.branch_id || ctx?.branchId;
    if (!defaultBranchId && targetSupermarketId) {
      const { data: bData } = await supabase
        .from('branches')
        .select('id')
        .eq('supermarket_id', targetSupermarketId)
        .eq('deleted', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (bData) defaultBranchId = bData.id;
    }

    const employeeId = crypto.randomUUID();

    // 1. Create Supabase Auth user if password provided
    if (payload.email && payload.password) {
      try {
        await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            data: {
              name: payload.name,
              role: finalRole,
              supermarket_id: targetSupermarketId,
            },
          },
        });
      } catch (authErr) {
        console.warn('Auth user signup warning (creating database profile):', authErr);
      }
    }

    // 2. Insert into users table
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: employeeId,
          supermarket_id: targetSupermarketId,
          branch_id: defaultBranchId || undefined,
          name: payload.name,
          email: payload.email,
          role: finalRole,
          phone: payload.phone || null,
          pin: payload.pin || Math.floor(1000 + Math.random() * 9000).toString(),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEmployee(id: string): Promise<void> {
    const supabase = createClient();

    const { data: targetUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (
      targetUser?.role === 'supermarket_owner' ||
      targetUser?.role === 'super_admin' ||
      targetUser?.role === 'owner'
    ) {
      throw new Error(
        'The primary Supermarket Owner account cannot perform this action on itself. Only the Platform Owner may suspend or delete a Supermarket Owner account.'
      );
    }

    const { error } = await supabase
      .from('users')
      .update({ deleted: true, is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
