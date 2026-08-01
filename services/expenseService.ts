import { createClient } from '@/lib/supabase/client';
import { Expense } from '@/types';

export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((exp: any) => ({
      ...exp,
      title: exp.description || exp.category,
      payment_method: 'cash',
    }));
  },

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    const supabase = createClient();
    const validCategories = ['rent', 'electricity', 'water', 'transport', 'salary', 'maintenance', 'internet', 'other'];
    const catInput = (expense.category || 'other').toLowerCase();
    const finalCategory = validCategories.includes(catInput) ? catInput : 'other';

    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          supermarket_id: expense.supermarket_id,
          branch_id: expense.branch_id,
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

  async deleteExpense(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('expenses')
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
