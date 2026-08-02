import { createClient } from '@/lib/supabase/client';
import { Supermarket } from '@/types';

export interface PlatformAnalytics {
  totalOrganizations: number;
  activeSubscriptions: number;
  totalBranches: number;
  totalRevenue: number;
}

export const platformService = {
  async getAllSupermarkets(): Promise<Supermarket[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('supermarkets')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateSubscription(
    supermarketId: string,
    plan: 'free_trial' | 'starter' | 'professional' | 'enterprise',
    status: 'trial' | 'active' | 'suspended' | 'expired'
  ): Promise<Supermarket> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('supermarkets')
      .update({
        subscription_plan: plan,
        subscription_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supermarketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    const supabase = createClient();

    const { data: supermarkets = [] } = await supabase
      .from('supermarkets')
      .select('subscription_status')
      .eq('deleted', false);

    const { data: branches = [] } = await supabase
      .from('branches')
      .select('id')
      .eq('deleted', false);

    const { data: sales = [] } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('deleted', false);

    const totalRevenue = (sales || []).reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0);
    const activeSubs = (supermarkets || []).filter((s: any) => s.subscription_status === 'active').length;

    return {
      totalOrganizations: (supermarkets || []).length,
      activeSubscriptions: activeSubs,
      totalBranches: (branches || []).length,
      totalRevenue,
    };
  },
};
