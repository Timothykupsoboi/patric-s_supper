import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';

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
        return rpcData;
      }
    } catch {
      // safe fallback to database table query
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

    return Array.from(roleSet).map((r) => ({
      role_name: r,
      role_label: r.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    }));
  },

  async toggleStatus(id: string, currentIsActive: boolean): Promise<UserProfile> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update({
        is_active: !currentIsActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async resetEmployeePassword(id: string, newPassword: string): Promise<void> {
    const supabase = createClient();
    // Update user password timestamp or auth record
    const { error } = await supabase
      .from('users')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async verifyPin(pin: string): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('pin', pin)
      .eq('is_active', true)
      .eq('deleted', false)
      .single();

    if (error || !data) return null;
    return data;
  },

  async updateEmployee(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEmployee(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ deleted: true, is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
