import { createClient } from '@/lib/supabase/client';
import { Customer, CustomerCreditLog, Sale } from '@/types';
import { authService } from './authService';

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (error) throw error;
    
    return (data || []).map((c: any) => ({
      ...c,
      borrow_limit: c.credit_limit,
      current_debt: c.balance,
      store_credit: Math.max(0, -c.balance),
    }));
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    
    return {
      ...data,
      borrow_limit: data.credit_limit,
      current_debt: data.balance,
      store_credit: Math.max(0, -data.balance),
    };
  },

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const payload = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      credit_limit: customer.credit_limit ?? customer.borrow_limit ?? 5000,
      balance: customer.balance ?? customer.current_debt ?? 0,
      supermarket_id: customer.supermarket_id || ctx?.supermarketId,
      branch_id: customer.branch_id || ctx?.branchId,
    };

    const { data, error } = await supabase
      .from('customers')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      borrow_limit: data.credit_limit,
      current_debt: data.balance,
      store_credit: Math.max(0, -data.balance),
    };
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const supabase = createClient();
    const payload: any = { ...updates, updated_at: new Date().toISOString() };

    if (updates.borrow_limit !== undefined) payload.credit_limit = updates.borrow_limit;
    if (updates.current_debt !== undefined) payload.balance = updates.current_debt;

    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      borrow_limit: data.credit_limit,
      current_debt: data.balance,
      store_credit: Math.max(0, -data.balance),
    };
  },

  async deleteCustomer(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('customers')
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async checkBorrowLimit(customerId: string, newBorrowAmount: number): Promise<{ allowed: boolean; message?: string; customer?: Customer }> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      return { allowed: false, message: 'Customer profile not found' };
    }

    const currentDebt = customer.balance ?? customer.current_debt ?? 0;
    const limit = customer.credit_limit ?? customer.borrow_limit ?? 5000;
    const projectedDebt = currentDebt + newBorrowAmount;

    if (projectedDebt > limit) {
      return {
        allowed: false,
        message: `Borrow limit reached! Maximum credit allowed is KES ${limit.toFixed(2)}. Current balance: KES ${currentDebt.toFixed(2)}.`,
        customer,
      };
    }

    return { allowed: true, customer };
  },

  async recordRepayment(customerId: string, amount: number, notes?: string): Promise<Customer> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();

    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (fetchErr || !customer) throw fetchErr || new Error('Customer profile not found');

    const { error: creditErr } = await supabase.from('customer_credits').insert([
      {
        supermarket_id: customer.supermarket_id || ctx?.supermarketId,
        branch_id: customer.branch_id || ctx?.branchId,
        customer_id: customerId,
        type: 'payment',
        amount,
        description: notes || `Repayment received: KES ${amount.toFixed(2)}`,
      },
    ]);

    if (creditErr) throw creditErr;

    const updated = await this.getCustomerById(customerId);
    return updated!;
  },

  async getCustomerLogs(customerId: string): Promise<CustomerCreditLog[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customer_credits')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((log: any) => ({
      ...log,
      notes: log.description,
      balance_after: log.amount,
    }));
  },

  async getCustomerPurchaseHistory(customerId: string): Promise<Sale[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((s: any) => ({
      ...s,
      invoice_number: `INV-${s.id.slice(0, 8)}`,
      net_amount: s.total_amount,
    }));
  },
};
