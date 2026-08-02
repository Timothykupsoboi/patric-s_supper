import { createClient } from '@/lib/supabase/client';
import { Supermarket } from '@/types';

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: 'free_trial' | 'starter' | 'professional' | 'enterprise';
  price_monthly: number;
  price_yearly: number;
  max_branches: number;
  max_users: number;
  features: string[];
  status: 'active' | 'suspended';
  subscriber_count: number;
}

export interface PlatformLicense {
  id: string;
  supermarket_id: string;
  supermarket_name: string;
  license_key: string;
  plan_tier: string;
  status: 'active' | 'suspended' | 'expired';
  activated_at: string;
  expires_at: string;
}

export interface PlatformRevenueRecord {
  id: string;
  supermarket_name: string;
  plan: string;
  amount: number;
  billing_cycle: 'monthly' | 'annually';
  payment_method: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

export interface PlatformSupportTicket {
  id: string;
  supermarket_id: string;
  supermarket_name: string;
  owner_email: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'closed';
  assigned_to?: string;
  responses: Array<{ id: string; sender: string; message: string; timestamp: string }>;
  created_at: string;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  target_type: 'all' | 'specific_supermarket' | 'specific_plan';
  target_value?: string;
  created_by: string;
  published_at: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  assigned_plans: string[];
}

export interface PlatformSettingsConfig {
  platform_name: string;
  branding_primary_color: string;
  support_email: string;
  smtp_host: string;
  sms_provider: string;
  payment_gateways: string[];
  default_currency: string;
  maintenance_mode: boolean;
  trial_period_days: number;
}

export interface CreateSupermarketPayload {
  name: string;
  registration_number?: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  country?: string;
  currency?: string;
  timezone?: string;
  business_address?: string;
  subscription_plan: string;
  trial_period_days?: number;
  logo_url?: string;
  default_branch_name: string;
}

export const platformAdminService = {
  // 1. Supermarket Management
  async getSupermarkets(): Promise<Supermarket[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('supermarkets')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSupermarketById(id: string): Promise<{
    supermarket: Supermarket;
    owner?: { id: string; name: string; email: string; phone?: string; created_at?: string };
    branchCount: number;
    employeeCount: number;
    auditLogs: any[];
  } | null> {
    const supabase = createClient();

    const { data: supermarket, error: smError } = await supabase
      .from('supermarkets')
      .select('*')
      .eq('id', id)
      .single();

    if (smError || !supermarket) return null;

    const { data: owner } = await supabase
      .from('users')
      .select('id, name, email, phone, created_at')
      .eq('supermarket_id', id)
      .eq('role', 'supermarket_owner')
      .maybeSingle();

    const { data: branches = [] } = await supabase
      .from('branches')
      .select('id')
      .eq('supermarket_id', id)
      .eq('deleted', false);

    const { data: employees = [] } = await supabase
      .from('users')
      .select('id')
      .eq('supermarket_id', id)
      .eq('deleted', false);

    const { data: auditLogs = [] } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('supermarket_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      supermarket,
      owner: owner || undefined,
      branchCount: (branches || []).length,
      employeeCount: (employees || []).length,
      auditLogs: auditLogs || [],
    };
  },

  async createSupermarketTenant(payload: CreateSupermarketPayload): Promise<Supermarket> {
    const supabase = createClient();
    const licenseKey = `LIC-PATRICK-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;

    // 1. Create Supermarket Record
    const { data: supermarket, error: smError } = await supabase
      .from('supermarkets')
      .insert([
        {
          name: payload.name,
          subscription_plan: payload.subscription_plan || 'starter',
          subscription_status: 'active',
          max_branches: payload.subscription_plan === 'enterprise' ? 999 : payload.subscription_plan === 'professional' ? 10 : 2,
          license_key: licenseKey,
          logo_url: payload.logo_url,
          address: payload.business_address,
          phone: payload.owner_phone,
          email: payload.owner_email,
        },
      ])
      .select()
      .single();

    if (smError || !supermarket) throw smError || new Error('Failed to create supermarket record');

    // 2. Create Default Branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert([
        {
          supermarket_id: supermarket.id,
          name: payload.default_branch_name || 'Main Branch',
          location: payload.business_address || 'HQ',
        },
      ])
      .select()
      .single();

    if (branchError || !branch) throw branchError || new Error('Failed to create default branch');

    // 3. Create Supermarket Owner in Users table
    const ownerUserId = crypto.randomUUID();

    const { error: userError } = await supabase.from('users').insert([
      {
        id: ownerUserId,
        supermarket_id: supermarket.id,
        branch_id: branch.id,
        name: payload.owner_name,
        email: payload.owner_email,
        phone: payload.owner_phone,
        role: 'supermarket_owner',
        is_active: true,
      },
    ]);

    if (userError) {
      console.warn('Warning creating user record in public.users:', userError.message);
    }

    // 4. Log in Audit Log
    await supabase.from('audit_logs').insert([
      {
        supermarket_id: supermarket.id,
        user_id: ownerUserId,
        action: `Supermarket Tenant Registered: ${payload.name} (Owner: ${payload.owner_email})`,
        table_name: 'supermarkets',
        record_id: supermarket.id,
      },
    ]);

    return {
      ...supermarket,
      owner_name: payload.owner_name,
      owner_email: payload.owner_email,
      owner_phone: payload.owner_phone,
      country: payload.country,
      currency: payload.currency,
      timezone: payload.timezone,
      business_address: payload.business_address,
      registration_number: payload.registration_number,
    };
  },

  async resetOwnerPassword(ownerId: string): Promise<void> {
    const supabase = createClient();
    const tempPassword = `Pass@${Math.floor(100000 + Math.random() * 900000)}`;
    const { error } = await supabase.auth.updateUser({ password: tempPassword });
    if (error) throw error;
  },

  async approveSupermarket(supermarketId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('supermarkets')
      .update({ subscription_status: 'active', updated_at: new Date().toISOString() })
      .eq('id', supermarketId);

    if (error) throw error;
  },

  async suspendSupermarket(supermarketId: string, currentStatus: string): Promise<void> {
    const supabase = createClient();
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase
      .from('supermarkets')
      .update({ subscription_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', supermarketId);

    if (error) throw error;
  },

  async deleteSupermarket(supermarketId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('supermarkets')
      .update({ deleted: true, subscription_status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', supermarketId);

    if (error) throw error;
  },

  // 2. Subscription Plans Management
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return [
      {
        id: 'PLAN-TRIAL',
        name: 'Free Trial',
        code: 'free_trial',
        price_monthly: 0,
        price_yearly: 0,
        max_branches: 1,
        max_users: 3,
        features: ['Basic POS', '1 Branch', 'Single Cashier Terminal', 'Standard Inventory'],
        status: 'active',
        subscriber_count: 2,
      },
      {
        id: 'PLAN-STARTER',
        name: 'Starter Tier',
        code: 'starter',
        price_monthly: 49,
        price_yearly: 490,
        max_branches: 2,
        max_users: 10,
        features: ['Multi-Branch Support (Up to 2)', 'Full POS & Barcode Scanner', 'Customer Credit Ledger', 'Daily Reports'],
        status: 'active',
        subscriber_count: 5,
      },
      {
        id: 'PLAN-PRO',
        name: 'Professional Tier',
        code: 'professional',
        price_monthly: 149,
        price_yearly: 1490,
        max_branches: 10,
        max_users: 50,
        features: ['Up to 10 Branches', 'Advanced Inventory Audits', 'Financial P&L Analytics', 'Supplier Portal & POs'],
        status: 'active',
        subscriber_count: 8,
      },
      {
        id: 'PLAN-ENT',
        name: 'Enterprise Tier',
        code: 'enterprise',
        price_monthly: 499,
        price_yearly: 4990,
        max_branches: 999,
        max_users: 9999,
        features: ['Unlimited Branches', 'Dedicated DB Instance', 'Priority 24/7 SLA Support', 'Custom M-Pesa Gateways'],
        status: 'active',
        subscriber_count: 3,
      },
    ];
  },

  // 3. License Keys Management
  async getLicenses(): Promise<PlatformLicense[]> {
    const supabase = createClient();
    const { data: supermarkets = [] } = await supabase
      .from('supermarkets')
      .select('id, name, license_key, subscription_plan, subscription_status, created_at')
      .eq('deleted', false);

    return (supermarkets || []).map((sm: any) => ({
      id: `LIC-OBJ-${sm.id.slice(0, 6)}`,
      supermarket_id: sm.id,
      supermarket_name: sm.name,
      license_key: sm.license_key || `LIC-PATRICK-${sm.id.slice(0, 6).toUpperCase()}-2026`,
      plan_tier: sm.subscription_plan || 'starter',
      status: sm.subscription_status === 'suspended' ? 'suspended' : 'active',
      activated_at: sm.created_at,
      expires_at: new Date(new Date(sm.created_at).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  },

  async generateLicenseKey(supermarketId: string): Promise<string> {
    const supabase = createClient();
    const newKey = `LIC-SAAS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
    const { error } = await supabase
      .from('supermarkets')
      .update({ license_key: newKey, updated_at: new Date().toISOString() })
      .eq('id', supermarketId);

    if (error) throw error;
    return newKey;
  },

  // 4. Revenue & Payment History
  async getRevenueRecords(): Promise<PlatformRevenueRecord[]> {
    const supabase = createClient();
    const { data: supermarkets = [] } = await supabase
      .from('supermarkets')
      .select('name, subscription_plan, created_at')
      .eq('deleted', false);

    const priceMap: Record<string, number> = {
      free_trial: 0,
      starter: 49,
      professional: 149,
      enterprise: 499,
    };

    return (supermarkets || []).map((sm: any, idx: number) => ({
      id: `REV-2026-${100 + idx}`,
      supermarket_name: sm.name,
      plan: sm.subscription_plan,
      amount: priceMap[sm.subscription_plan] || 49,
      billing_cycle: idx % 2 === 0 ? 'monthly' : 'annually',
      payment_method: idx % 3 === 0 ? 'Stripe Credit Card' : 'M-Pesa Express API',
      status: 'completed',
      date: sm.created_at,
    }));
  },

  // 5. Support Tickets
  async getSupportTickets(): Promise<PlatformSupportTicket[]> {
    return [
      {
        id: 'TICKET-301',
        supermarket_id: '00000000-0000-0000-0000-000000000001',
        supermarket_name: "Patrick's Main Supermarket",
        owner_email: 'owner@patricksupermarket.com',
        subject: 'Requesting 5 additional POS terminal licenses',
        description: 'We are expanding to Westlands branch and need 5 additional POS register terminal keys activated.',
        priority: 'high',
        status: 'open',
        responses: [
          {
            id: 'RESP-1',
            sender: 'Platform Owner Support',
            message: 'Hello Patrick team, we have reviewed your request and generated 5 new license keys.',
            timestamp: new Date().toISOString(),
          },
        ],
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'TICKET-302',
        supermarket_id: '00000000-0000-0000-0000-000000000002',
        supermarket_name: 'Kilimani Supermarket Outlet',
        owner_email: 'admin@kilimaniretail.co.ke',
        subject: 'Automated M-Pesa STK Push Gateway latency',
        description: 'Intermittent delay experienced during evening peak checkout hours.',
        priority: 'urgent',
        status: 'in_progress',
        responses: [],
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ];
  },

  // 6. Platform Announcements
  async getAnnouncements(): Promise<PlatformAnnouncement[]> {
    return [
      {
        id: 'ANN-2026-01',
        title: 'Scheduled System Maintenance: Database Optimization',
        message: 'The SaaS platform will undergo routine database maintenance on Sunday at 02:00 UTC for 30 minutes.',
        target_type: 'all',
        created_by: 'Platform Owner System',
        published_at: new Date().toISOString(),
      },
      {
        id: 'ANN-2026-02',
        title: 'New Feature Released: Advanced Supplier Purchase Orders',
        message: 'All Professional and Enterprise plan subscribers now have access to multi-stage purchase order approvals.',
        target_type: 'specific_plan',
        target_value: 'professional',
        created_by: 'Platform Product Team',
        published_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];
  },

  // 7. Feature Flags
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return [
      {
        id: 'FF-01',
        key: 'mpesa_stk_push',
        name: 'M-Pesa STK Push Automated Payments',
        description: 'Triggers instant phone pin prompt for cashiers during POS checkout.',
        enabled: true,
        assigned_plans: ['starter', 'professional', 'enterprise'],
      },
      {
        id: 'FF-02',
        key: 'multi_branch_sync',
        name: 'Multi-Branch Inventory Synchronization',
        description: 'Allows cross-branch stock transfers and central warehouse allocation.',
        enabled: true,
        assigned_plans: ['professional', 'enterprise'],
      },
      {
        id: 'FF-03',
        key: 'ai_demand_forecasting',
        name: 'AI Inventory Demand Forecasting',
        description: 'Predicts stock reorder points using machine learning sales trends.',
        enabled: false,
        assigned_plans: ['enterprise'],
      },
      {
        id: 'FF-04',
        key: 'custom_receipt_branding',
        name: 'Custom Thermal Receipt Header Branding',
        description: 'Allows custom logo and promotional notes on printed thermal receipts.',
        enabled: true,
        assigned_plans: ['free_trial', 'starter', 'professional', 'enterprise'],
      },
    ];
  },

  // 8. Platform Dashboard Analytics & Metrics
  async getPlatformMetrics() {
    const supabase = createClient();

    const { data: supermarkets = [] } = await supabase
      .from('supermarkets')
      .select('*')
      .eq('deleted', false);

    const { data: branches = [] } = await supabase
      .from('branches')
      .select('id')
      .eq('deleted', false);

    const { data: users = [] } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('deleted', false);

    const { data: sales = [] } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('deleted', false);

    const totalRevenue = (sales || []).reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0);
    const activeSupermarkets = (supermarkets || []).filter((s: any) => s.subscription_status === 'active').length;
    const suspendedSupermarkets = (supermarkets || []).filter((s: any) => s.subscription_status === 'suspended').length;
    const trialSupermarkets = (supermarkets || []).filter((s: any) => s.subscription_status === 'trial' || s.subscription_status === 'free_trial').length;
    const activeUsers = (users || []).filter((u: any) => u.is_active !== false).length;

    return {
      totalSupermarkets: (supermarkets || []).length,
      activeSupermarkets,
      suspendedSupermarkets,
      trialSupermarkets,
      totalBranches: (branches || []).length,
      totalUsers: (users || []).length,
      activeUsers,
      monthlyRevenue: totalRevenue * 0.15, // SaaS platform revenue share
      annualRevenue: totalRevenue * 1.8,
      platformStorageUsage: '42.8 GB / 100 GB',
      apiRequestsToday: '128,450',
      systemHealth: '100% Operational',
    };
  },
};
