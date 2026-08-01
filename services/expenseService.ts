import { createClient } from '@/lib/supabase/client';
import { Expense } from '@/types';

export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExpense(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  },
};
