import { createClient } from '@/lib/supabase/client';
import { StockTransaction, PurchaseOrder, Product } from '@/types';

export const inventoryService = {
  async adjustStock(
    productId: string,
    quantity: number,
    type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage' | 'transfer',
    reason: string,
    userId?: string,
    supermarketId?: string
  ): Promise<void> {
    const supabase = createClient();

    // 1. Fetch existing product stock
    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('stock_quantity, supermarket_id')
      .eq('id', productId)
      .single();

    if (fetchErr || !product) throw fetchErr || new Error('Product not found');

    const newStock = Math.max(0, product.stock_quantity + quantity);

    // 2. Update product stock quantity
    const { error: updateErr } = await supabase
      .from('products')
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (updateErr) throw updateErr;

    // 3. Insert detailed stock transaction record
    await supabase.from('stock_transactions').insert([
      {
        supermarket_id: supermarketId || product.supermarket_id,
        product_id: productId,
        type,
        quantity,
        reason,
        created_by: userId,
      },
    ]);
  },

  async getLowStockProducts(): Promise<Product[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('deleted', false)
      .order('stock_quantity', { ascending: true });

    if (error) throw error;
    return (data || []).filter((p: Product) => p.stock_quantity <= (p.reorder_level || 5));
  },

  async getNearExpiryProducts(daysThreshold: number = 30): Promise<Product[]> {
    const supabase = createClient();
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thresholdDate.toISOString().split('T')[0])
      .eq('deleted', false)
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getStockTransactions(limit: number = 50): Promise<StockTransaction[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*, product:products(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, supplier:suppliers(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPurchaseOrder(po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const supabase = createClient();
    const orderNumber = `PO-${Date.now().toString().slice(-6)}`;
    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([{ order_number: orderNumber, status: 'draft', ...po }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePOStatus(poId: string, status: 'draft' | 'ordered' | 'received' | 'cancelled'): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', poId);

    if (error) throw error;
  },
};
