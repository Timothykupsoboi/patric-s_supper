import { createClient } from '@/lib/supabase/client';
import { StockTransaction, PurchaseOrder, Product } from '@/types';
import { authService } from './authService';

export const inventoryService = {
  async adjustStock(
    productId: string,
    quantity: number,
    type: 'in' | 'out' | 'adjustment_add' | 'adjustment_sub' | 'transfer_in' | 'transfer_out' | 'damaged' | 'expired',
    reason: string,
    userId?: string,
    supermarketId?: string
  ): Promise<void> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();

    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('buying_price, supermarket_id, branch_id')
      .eq('id', productId)
      .single();

    if (fetchErr || !product) throw fetchErr || new Error('Product not found');

    const { error: txErr } = await supabase.from('stock_transactions').insert([
      {
        supermarket_id: supermarketId || product.supermarket_id || ctx?.supermarketId,
        branch_id: product.branch_id || ctx?.branchId,
        product_id: productId,
        type,
        quantity: Math.abs(quantity),
        unit_cost: product.buying_price || 0,
        notes: reason,
      },
    ]);

    if (txErr) throw txErr;
  },

  async getLowStockProducts(): Promise<Product[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('deleted', false)
      .order('current_stock', { ascending: true });

    if (error) throw error;

    return (data || [])
      .filter((p: any) => p.current_stock <= (p.minimum_stock || 5))
      .map((p: any) => ({
        ...p,
        cost_price: p.buying_price,
        stock_quantity: p.current_stock,
        reorder_level: p.minimum_stock,
      }));
  },

  async getNearExpiryProducts(daysThreshold: number = 30): Promise<Product[]> {
    const supabase = createClient();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thresholdDate.toISOString().split('T')[0])
      .eq('deleted', false)
      .order('expiry_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      ...p,
      cost_price: p.buying_price,
      stock_quantity: p.current_stock,
      reorder_level: p.minimum_stock,
    }));
  },

  async getStockTransactions(limit: number = 50): Promise<StockTransaction[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*, product:products(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((tx: any) => ({
      ...tx,
      reason: tx.notes,
      product: tx.product ? {
        ...tx.product,
        cost_price: tx.product.buying_price,
        stock_quantity: tx.product.current_stock,
      } : undefined,
    }));
  },

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('purchases')
      .select('*, supplier:suppliers(*)')
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      ...p,
      order_number: `PO-${p.id.slice(0, 8)}`,
    }));
  },

  async createPurchaseOrder(po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const { data, error } = await supabase
      .from('purchases')
      .insert([
        {
          supermarket_id: po.supermarket_id || ctx?.supermarketId,
          branch_id: po.branch_id || ctx?.branchId,
          supplier_id: po.supplier_id,
          total_amount: po.total_amount || 0,
          status: 'ordered',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      order_number: `PO-${data.id.slice(0, 8)}`,
    };
  },

  async updatePOStatus(poId: string, status: 'ordered' | 'received' | 'returned'): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('purchases')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', poId);

    if (error) throw error;
  },
};
