import { createClient } from '@/lib/supabase/client';
import { Supplier } from '@/types';
import { authService } from './authService';

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (ctx?.supermarketId) {
      query = query.eq('supermarket_id', ctx.supermarketId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((s: any) => ({
      ...s,
      is_active: true,
    }));
  },

  async createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const targetSupermarketId = supplier.supermarket_id || ctx?.supermarketId;

    if (!targetSupermarketId) {
      throw new Error('Supermarket tenant context is required to create a supplier.');
    }

    let branchId = supplier.branch_id || ctx?.branchId;
    if (!branchId && targetSupermarketId) {
      const { data: defaultBranch } = await supabase
        .from('branches')
        .select('id')
        .eq('supermarket_id', targetSupermarketId)
        .eq('deleted', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (defaultBranch) branchId = defaultBranch.id;
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert([
        {
          supermarket_id: targetSupermarketId,
          branch_id: branchId || undefined,
          name: supplier.name,
          contact_person: supplier.contact_person,
          phone: supplier.phone,
          email: supplier.email,
          outstanding_balance: supplier.outstanding_balance || 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      is_active: true,
    };
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('suppliers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      is_active: true,
    };
  },

  async deleteSupplier(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('suppliers')
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
