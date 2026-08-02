import { createClient } from '@/lib/supabase/client';
import { authService } from './authService';

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
  async getBranches(supermarketId?: string): Promise<Branch[]> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const targetSupermarketId = supermarketId && supermarketId !== '00000000-0000-0000-0000-000000000001'
      ? supermarketId
      : ctx?.supermarketId || supermarketId;

    let query = supabase
      .from('branches')
      .select('*')
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (targetSupermarketId) {
      query = query.eq('supermarket_id', targetSupermarketId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createBranch(branch: Partial<Branch>): Promise<Branch> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const { data, error } = await supabase
      .from('branches')
      .insert([
        {
          id: crypto.randomUUID(),
          supermarket_id: branch.supermarket_id || ctx?.supermarketId,
          name: branch.name,
          location: branch.location || 'HQ',
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
