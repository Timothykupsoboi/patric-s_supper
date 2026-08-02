import { createClient } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  platform_owner: 100,
  platform_admin: 95,
  super_admin: 90,
  owner: 85,
  admin: 80,
  branch_manager: 65,
  manager: 60,
  inventory_manager: 55,
  sales_manager: 50,
  accountant: 45,
  procurement_officer: 40,
  store_keeper: 35,
  customer_service: 30,
  cashier: 20,
};

export const authService = {
  async login(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const profile = await this.getUserProfile(data.user.id);
    return { session: data.session, user: data.user, profile };
  },

  async register(params: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    supermarket_id?: string;
    branch_id?: string;
  }) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          role: params.role || 'cashier',
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      await supabase.from('users').insert([
        {
          id: data.user.id,
          name: params.name,
          email: params.email,
          role: params.role || 'cashier',
          supermarket_id: params.supermarket_id || '00000000-0000-0000-0000-000000000001',
          branch_id: params.branch_id || undefined,
          is_active: true,
        },
      ]);
    }

    return data;
  },

  async logout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async forgotPassword(email: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async resetPassword(newPassword: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  async getSession() {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  },

  hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
  },
};
