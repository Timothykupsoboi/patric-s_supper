import { createClient } from '@/lib/supabase/client';
import { Supermarket } from '@/types';
import { authService } from './authService';

export const settingService = {
  async getSettings(supermarketId?: string): Promise<Supermarket | null> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const targetSupermarketId = supermarketId && supermarketId !== '00000000-0000-0000-0000-000000000001'
      ? supermarketId
      : ctx?.supermarketId || supermarketId;

    if (!targetSupermarketId) return null;

    const { data, error } = await supabase
      .from('supermarkets')
      .select('*')
      .eq('id', targetSupermarketId)
      .single();

    if (error) return null;
    return data;
  },

  async updateSettings(supermarketId: string, settings: Partial<Supermarket>): Promise<Supermarket> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const targetSupermarketId = supermarketId && supermarketId !== '00000000-0000-0000-0000-000000000001'
      ? supermarketId
      : ctx?.supermarketId || supermarketId;

    const { data, error } = await supabase
      .from('supermarkets')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', targetSupermarketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
