import { createClient } from '@/lib/supabase/client';
import { Supermarket } from '@/types';

export const settingService = {
  async getSettings(supermarketId: string = '00000000-0000-0000-0000-000000000001'): Promise<Supermarket | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('supermarkets')
      .select('*')
      .eq('id', supermarketId)
      .single();

    if (error) return null;
    return data;
  },

  async updateSettings(supermarketId: string, settings: Partial<Supermarket>): Promise<Supermarket> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('supermarkets')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', supermarketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
