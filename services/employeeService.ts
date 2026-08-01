import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';

export const employeeService = {
  async getEmployees(): Promise<UserProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
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
};
