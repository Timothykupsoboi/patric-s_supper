import { createClient } from '@/lib/supabase/client';
import { Sale, CartItem, PaymentMethod, Customer } from '@/types';

export interface CompleteSalePayload {
  supermarket_id: string;
  branch_id?: string;
  cashier_id: string;
  customer?: Customer;
  cartItems: CartItem[];
  paymentMethod: PaymentMethod;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  totalAmount: number;
  notes?: string;
  mpesaRef?: string;
}

export interface FinancialReportMetrics {
  grossSales: number;
  totalDiscounts: number;
  totalTax: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  inventoryCostValuation: number;
  inventoryRetailValuation: number;
  potentialMargin: number;
}

export const saleService = {
  async completeSale(payload: CompleteSalePayload): Promise<Sale> {
    const supabase = createClient();
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    if (payload.paymentMethod === 'credit' && payload.customer) {
      const projectedDebt = payload.customer.current_debt + payload.netAmount;
      if (projectedDebt > payload.customer.borrow_limit) {
        throw new Error(
          `Borrow limit exceeded! Maximum allowed credit is KES ${payload.customer.borrow_limit}. Current debt is KES ${payload.customer.current_debt}.`
        );
      }
    }

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([
        {
          supermarket_id: payload.supermarket_id,
          branch_id: payload.branch_id,
          cashier_id: payload.cashier_id,
          customer_id: payload.customer?.id,
          invoice_number: invoiceNumber,
          total_amount: payload.totalAmount,
          discount_amount: payload.discountAmount,
          tax_amount: payload.taxAmount,
          net_amount: payload.netAmount,
          payment_method: payload.paymentMethod,
          status: 'completed',
          notes: payload.notes,
        },
      ])
      .select()
      .single();

    if (saleError || !sale) throw saleError || new Error('Failed to create sale header');

    const saleItems = payload.cartItems.map((item) => {
      const itemSubtotal = item.product.selling_price * item.quantity - item.discount;
      const vatAmount = (itemSubtotal * (item.product.vat_rate || 0)) / 100;
      return {
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        discount: item.discount,
        total_price: itemSubtotal,
        vat_amount: vatAmount,
      };
    });

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) throw itemsError;

    for (const item of payload.cartItems) {
      const newQuantity = Math.max(0, item.product.stock_quantity - item.quantity);
      await supabase
        .from('products')
        .update({ stock_quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', item.product.id);

      await supabase.from('stock_transactions').insert([
        {
          supermarket_id: payload.supermarket_id,
          branch_id: payload.branch_id,
          product_id: item.product.id,
          type: 'sale',
          quantity: -item.quantity,
          reason: `Sale ${invoiceNumber}`,
          created_by: payload.cashier_id,
        },
      ]);
    }

    if (payload.paymentMethod === 'credit' && payload.customer) {
      const newDebt = payload.customer.current_debt + payload.netAmount;
      await supabase
        .from('customers')
        .update({ current_debt: newDebt, updated_at: new Date().toISOString() })
        .eq('id', payload.customer.id);

      await supabase.from('customer_credits').insert([
        {
          supermarket_id: payload.supermarket_id,
          customer_id: payload.customer.id,
          sale_id: sale.id,
          type: 'borrow',
          amount: payload.netAmount,
          balance_after: newDebt,
          notes: `Credit Sale ${invoiceNumber}`,
        },
      ]);
    }

    return { ...sale, sale_items: saleItems };
  },

  async getRecentSales(limit: number = 20): Promise<Sale[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sales')
      .select('*, customer:customers(*), cashier:users(*), sale_items(*)')
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getSalesMetrics(): Promise<{ todaySales: number; todayRevenue: number; totalOrders: number }> {
    const supabase = createClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('sales')
      .select('net_amount')
      .gte('created_at', todayStart.toISOString())
      .eq('status', 'completed');

    if (error) throw error;

    const todayRevenue = (data || []).reduce((acc: number, curr: { net_amount: number }) => acc + (curr.net_amount || 0), 0);
    return {
      todaySales: (data || []).length,
      todayRevenue,
      totalOrders: (data || []).length,
    };
  },

  async getComprehensiveFinancialReport(): Promise<FinancialReportMetrics> {
    const supabase = createClient();

    // 1. Query Sales
    const { data: sales = [] } = await supabase
      .from('sales')
      .select('total_amount, discount_amount, tax_amount, net_amount, sale_items(*, product:products(cost_price))')
      .eq('status', 'completed')
      .eq('deleted', false);

    // 2. Query Expenses
    const { data: expenses = [] } = await supabase
      .from('expenses')
      .select('amount');

    // 3. Query Products Valuation
    const { data: products = [] } = await supabase
      .from('products')
      .select('cost_price, selling_price, stock_quantity')
      .eq('deleted', false);

    let grossSales = 0;
    let totalDiscounts = 0;
    let totalTax = 0;
    let netSales = 0;
    let cogs = 0;

    (sales || []).forEach((s: any) => {
      grossSales += s.total_amount || 0;
      totalDiscounts += s.discount_amount || 0;
      totalTax += s.tax_amount || 0;
      netSales += s.net_amount || 0;

      (s.sale_items || []).forEach((item: any) => {
        const itemCost = item.product?.cost_price || (item.unit_price * 0.7); // Fallback cost ratio if missing
        cogs += itemCost * item.quantity;
      });
    });

    const totalExpenses = (expenses || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const grossProfit = Math.max(0, netSales - cogs);
    const netProfit = grossProfit - totalExpenses;

    let inventoryCostValuation = 0;
    let inventoryRetailValuation = 0;

    (products || []).forEach((p: any) => {
      inventoryCostValuation += (p.cost_price || 0) * (p.stock_quantity || 0);
      inventoryRetailValuation += (p.selling_price || 0) * (p.stock_quantity || 0);
    });

    const potentialMargin = Math.max(0, inventoryRetailValuation - inventoryCostValuation);

    return {
      grossSales,
      totalDiscounts,
      totalTax,
      netSales,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      inventoryCostValuation,
      inventoryRetailValuation,
      potentialMargin,
    };
  },
};
