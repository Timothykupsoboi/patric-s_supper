import { createClient } from '@/lib/supabase/client';
import { Expense } from '@/types';
import { authService } from './authService';

export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (ctx?.supermarketId) {
      query = query.eq('supermarket_id', ctx.supermarketId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((exp: any) => ({
      ...exp,
      title: exp.description || exp.category,
      payment_method: 'cash',
    }));
  },

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const validCategories = ['rent', 'electricity', 'water', 'transport', 'salary', 'maintenance', 'internet', 'other'];
    const catInput = (expense.category || 'other').toLowerCase();
    const finalCategory = validCategories.includes(catInput) ? catInput : 'other';

    let branchId = expense.branch_id || ctx?.branchId;
    if (!branchId && ctx?.supermarketId) {
      const { data: defaultBranch } = await supabase
        .from('branches')
        .select('id')
        .eq('supermarket_id', ctx.supermarketId)
        .eq('deleted', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (defaultBranch) branchId = defaultBranch.id;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          supermarket_id: expense.supermarket_id || ctx?.supermarketId,
          branch_id: branchId || undefined,
          category: finalCategory,
          amount: expense.amount || 0,
          description: expense.title || expense.description || 'Operational Expense',
          date: expense.date || new Date().toISOString().split('T')[0],
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      title: data.description,
      payment_method: 'cash',
    };
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const supabase = createClient();
    const validCategories = ['rent', 'electricity', 'water', 'transport', 'salary', 'maintenance', 'internet', 'other'];
    const dbUpdates: any = { updated_at: new Date().toISOString() };

    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.description || updates.title) dbUpdates.description = updates.title || updates.description;
    if (updates.category) {
      const catInput = updates.category.toLowerCase();
      dbUpdates.category = validCategories.includes(catInput) ? catInput : 'other';
    }
    if (updates.date) dbUpdates.date = updates.date;

    const { data, error } = await supabase
      .from('expenses')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      title: data.description,
      payment_method: 'cash',
    };
  },

  async deleteExpense(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('expenses')
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
