import { createClient } from '@/lib/supabase/client';
import { Supplier } from '@/types';

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (error) throw error;
    
    return (data || []).map((s: any) => ({
      ...s,
      is_active: true,
    }));
  },

  async createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('suppliers')
      .insert([
        {
          supermarket_id: supplier.supermarket_id,
          branch_id: supplier.branch_id,
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
