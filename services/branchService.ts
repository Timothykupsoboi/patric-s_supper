import { createClient } from '@/lib/supabase/client';

export interface Branch {
  id: string;
  supermarket_id?: string;
  name: string;
  location?: string;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
  version?: number;
}

export const branchService = {
  async getBranches(supermarketId: string = '00000000-0000-0000-0000-000000000001'): Promise<Branch[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('supermarket_id', supermarketId)
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createBranch(branch: Partial<Branch>): Promise<Branch> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('branches')
      .insert([
        {
          supermarket_id: branch.supermarket_id || '00000000-0000-0000-0000-000000000001',
          name: branch.name,
          location: branch.location || 'Nairobi CBD',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBranch(id: string, updates: Partial<Branch>): Promise<Branch> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('branches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBranch(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('branches')
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
