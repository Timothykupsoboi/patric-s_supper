import { createClient } from '@/lib/supabase/client';
import { Customer, CustomerCreditLog, Sale } from '@/types';

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          borrow_limit: 5000,
          current_debt: 0,
          store_credit: 0,
          is_active: true,
          ...customer,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async checkBorrowLimit(customerId: string, newBorrowAmount: number): Promise<{ allowed: boolean; message?: string; customer?: Customer }> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      return { allowed: false, message: 'Customer profile not found' };
    }

    const projectedDebt = customer.current_debt + newBorrowAmount;
    if (projectedDebt > customer.borrow_limit) {
      return {
        allowed: false,
        message: `Borrow limit reached! Maximum allowed credit is KES ${customer.borrow_limit.toFixed(2)}. Current debt: KES ${customer.current_debt.toFixed(2)}. Transaction of KES ${newBorrowAmount.toFixed(2)} exceeds limit by KES ${(projectedDebt - customer.borrow_limit).toFixed(2)}.`,
        customer,
      };
    }

    return { allowed: true, customer };
  },

  async recordRepayment(customerId: string, amount: number, notes?: string): Promise<Customer> {
    const supabase = createClient();

    // 1. Fetch fresh customer record to prevent race conditions
    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (fetchErr || !customer) throw fetchErr || new Error('Customer not found');

    const currentDebt = customer.current_debt || 0;
    const currentCredit = customer.store_credit || 0;

    let newDebt = 0;
    let newCredit = currentCredit;

    if (amount <= currentDebt) {
      newDebt = currentDebt - amount;
    } else {
      // Overpayment: clear debt and add excess to store credit balance
      const overpayment = amount - currentDebt;
      newDebt = 0;
      newCredit += overpayment;
    }

    // 2. Update customer record
    const { data: updatedCustomer, error: updateErr } = await supabase
      .from('customers')
      .update({
        current_debt: newDebt,
        store_credit: newCredit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 3. Log detailed credit transaction log
    await supabase.from('customer_credits').insert([
      {
        supermarket_id: customer.supermarket_id,
        customer_id: customerId,
        type: 'repayment',
        amount,
        balance_after: newDebt,
        notes: notes || `Repayment received (Debt: KES ${newDebt.toFixed(2)}, Credit: KES ${newCredit.toFixed(2)})`,
      },
    ]);

    return updatedCustomer;
  },

  async getCustomerLogs(customerId: string): Promise<CustomerCreditLog[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customer_credits')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCustomerPurchaseHistory(customerId: string): Promise<Sale[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
