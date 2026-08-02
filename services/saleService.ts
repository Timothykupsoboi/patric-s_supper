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

    if (payload.paymentMethod === 'credit' && payload.customer) {
      const currentDebt = payload.customer.balance ?? payload.customer.current_debt ?? 0;
      const creditLimit = payload.customer.credit_limit ?? payload.customer.borrow_limit ?? 5000;
      const projectedDebt = currentDebt + payload.netAmount;
      if (projectedDebt > creditLimit) {
        throw new Error(
          `Borrow limit exceeded! Maximum allowed credit is KES ${creditLimit}. Current debt is KES ${currentDebt}.`
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
          total_amount: payload.netAmount || payload.totalAmount,
          discount_amount: payload.discountAmount,
          tax_amount: payload.taxAmount,
          payment_method: payload.paymentMethod,
          payment_status: payload.paymentMethod === 'credit' ? 'unpaid' : 'paid',
          hold_status: 'active',
          notes: payload.notes,
        },
      ])
      .select()
      .single();

    if (saleError || !sale) throw saleError || new Error('Failed to create sale transaction');

    const saleItems = payload.cartItems.map((item) => {
      const itemSubtotal = item.product.selling_price * item.quantity - item.discount;
      const taxVal = (itemSubtotal * (item.product.tax_rate ?? item.product.vat_rate ?? 0)) / 100;
      return {
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        subtotal: itemSubtotal,
        discount: item.discount,
        tax: taxVal,
        supermarket_id: payload.supermarket_id,
        branch_id: payload.branch_id,
      };
    });

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) throw itemsError;

    // Trigger stock transactions (type: 'out')
    for (const item of payload.cartItems) {
      await supabase.from('stock_transactions').insert([
        {
          supermarket_id: payload.supermarket_id,
          branch_id: payload.branch_id,
          product_id: item.product.id,
          type: 'out',
          quantity: item.quantity,
          unit_cost: item.product.buying_price ?? item.product.cost_price ?? 0,
          notes: `POS Sale ${sale.id}`,
        },
      ]);
    }

    // Trigger customer credit charge if credit sale
    if (payload.paymentMethod === 'credit' && payload.customer) {
      await supabase.from('customer_credits').insert([
        {
          supermarket_id: payload.supermarket_id,
          branch_id: payload.branch_id,
          customer_id: payload.customer.id,
          type: 'charge',
          amount: payload.netAmount,
          description: `Credit Sale ${sale.id}`,
        },
      ]);
    }

    return {
      ...sale,
      invoice_number: `INV-${sale.id.slice(0, 8)}`,
      net_amount: sale.total_amount,
      status: sale.hold_status,
      sale_items: saleItems,
    };
  },

  async refundSale(saleId: string): Promise<Sale> {
    const supabase = createClient();

    const { data: sale, error: fetchErr } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('id', saleId)
      .single();

    if (fetchErr || !sale) throw fetchErr || new Error('Sale transaction not found');

    const { data: updatedSale, error: updateErr } = await supabase
      .from('sales')
      .update({
        hold_status: 'refunded',
        payment_status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', saleId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    for (const item of sale.sale_items || []) {
      await supabase.from('stock_transactions').insert([
        {
          supermarket_id: sale.supermarket_id,
          branch_id: sale.branch_id,
          product_id: item.product_id,
          type: 'in',
          quantity: item.quantity,
          unit_cost: item.unit_price,
          notes: `POS Sale Refund ${saleId}`,
        },
      ]);
    }

    if (sale.payment_method === 'credit' && sale.customer_id) {
      await supabase.from('customer_credits').insert([
        {
          supermarket_id: sale.supermarket_id,
          branch_id: sale.branch_id,
          customer_id: sale.customer_id,
          type: 'payment',
          amount: sale.total_amount,
          description: `Credit Sale Refund ${saleId}`,
        },
      ]);
    }

    return {
      ...updatedSale,
      invoice_number: `INV-${updatedSale.id.slice(0, 8)}`,
      net_amount: updatedSale.total_amount,
      status: updatedSale.hold_status,
    };
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
    
    return (data || []).map((s: any) => ({
      ...s,
      invoice_number: `INV-${s.id.slice(0, 8)}`,
      net_amount: s.total_amount,
      status: s.hold_status,
    }));
  },

  async getSalesMetrics(): Promise<{
    todaySales: number;
    todayRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    totalOrders: number;
  }> {
    const supabase = createClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 30);

    const { data: todaySalesData } = await supabase
      .from('sales')
      .select('total_amount')
      .gte('created_at', todayStart.toISOString())
      .eq('deleted', false);

    const { data: weekSalesData } = await supabase
      .from('sales')
      .select('total_amount')
      .gte('created_at', weekStart.toISOString())
      .eq('deleted', false);

    const { data: monthSalesData } = await supabase
      .from('sales')
      .select('total_amount')
      .gte('created_at', monthStart.toISOString())
      .eq('deleted', false);

    const todayRevenue = (todaySalesData || []).reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0);
    const weeklyRevenue = (weekSalesData || []).reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0);
    const monthlyRevenue = (monthSalesData || []).reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0);

    return {
      todaySales: (todaySalesData || []).length,
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      totalOrders: (monthSalesData || []).length,
    };
  },

  async getComprehensiveFinancialReport(): Promise<FinancialReportMetrics> {
    const supabase = createClient();

    const { data: sales = [] } = await supabase
      .from('sales')
      .select('total_amount, discount_amount, tax_amount, sale_items(*, product:products(buying_price))')
      .eq('deleted', false);

    const { data: expenses = [] } = await supabase
      .from('expenses')
      .select('amount')
      .eq('deleted', false);

    const { data: products = [] } = await supabase
      .from('products')
      .select('buying_price, selling_price, current_stock')
      .eq('deleted', false);

    let grossSales = 0;
    let totalDiscounts = 0;
    let totalTax = 0;
    let netSales = 0;
    let cogs = 0;

    (sales || []).forEach((s: any) => {
      grossSales += (s.total_amount || 0) + (s.discount_amount || 0);
      totalDiscounts += s.discount_amount || 0;
      totalTax += s.tax_amount || 0;
      netSales += s.total_amount || 0;

      (s.sale_items || []).forEach((item: any) => {
        const itemCost = item.product?.buying_price || (item.unit_price * 0.7);
        cogs += itemCost * item.quantity;
      });
    });

    const totalExpenses = (expenses || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const grossProfit = Math.max(0, netSales - cogs);
    const netProfit = grossProfit - totalExpenses;

    let inventoryCostValuation = 0;
    let inventoryRetailValuation = 0;

    (products || []).forEach((p: any) => {
      inventoryCostValuation += (p.buying_price || 0) * (p.current_stock || 0);
      inventoryRetailValuation += (p.selling_price || 0) * (p.current_stock || 0);
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
