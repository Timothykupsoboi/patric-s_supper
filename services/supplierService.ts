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
    return data || [];
  },

  async createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ is_active: true, ...supplier }])
      .select()
      .single();

    if (error) throw error;
    return data;
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
    return data;
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
