import { createClient } from '@/lib/supabase/client';
import { Supermarket } from '@/types';

export interface PlatformAnalytics {
  totalOrganizations: number;
  activeSubscriptions: number;
  totalBranches: number;
  totalRevenue: number;
}

export interface SupportTicket {
  id: string;
  supermarket_id: string;
  supermarket_name: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
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

  async approveSupermarket(supermarketId: string): Promise<Supermarket> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('supermarkets')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', supermarketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async suspendSupermarket(supermarketId: string, currentStatus: string): Promise<Supermarket> {
    const supabase = createClient();
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const { data, error } = await supabase
      .from('supermarkets')
      .update({
        subscription_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supermarketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSupermarket(supermarketId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('supermarkets')
      .update({
        deleted: true,
        subscription_status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('id', supermarketId);

    if (error) throw error;
  },

  async generateLicenseKey(supermarketId: string): Promise<string> {
    const supabase = createClient();
    const newKey = `LIC-PATRICK-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
    const { error } = await supabase
      .from('supermarkets')
      .update({
        license_key: newKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supermarketId);

    if (error) throw error;
    return newKey;
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
      .select('subscription_status, subscription_plan')
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

  async getSupportTickets(): Promise<SupportTicket[]> {
    const supabase = createClient();
    const { data: logs = [] } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (logs && logs.length > 0) {
      return logs.map((l: any, i: number) => ({
        id: `TICKET-${l.id.slice(0, 6).toUpperCase()}`,
        supermarket_id: l.supermarket_id || '00000000-0000-0000-0000-000000000001',
        supermarket_name: 'Registered Supermarket Tenant',
        subject: l.action || 'SaaS System Tenant Inquiry',
        priority: i % 2 === 0 ? 'medium' : 'high',
        status: 'open',
        created_at: l.created_at,
      }));
    }

    return [];
  },
};
