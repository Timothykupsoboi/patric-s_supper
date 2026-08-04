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
      .select('*')
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
    const ctx = await authService.getCurrentUserContext();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    let query = supabase
      .from('products')
      .select('*')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thresholdDate.toISOString().split('T')[0])
      .eq('deleted', false)
      .order('expiry_date', { ascending: true });

    if (ctx?.supermarketId) {
      query = query.eq('supermarket_id', ctx.supermarketId);
    }

    const { data, error } = await query;
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
    const ctx = await authService.getCurrentUserContext();
    let query = supabase
      .from('stock_transactions')
      .select('*, product:products(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (ctx?.supermarketId) {
      query = query.eq('supermarket_id', ctx.supermarketId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    let query = supabase
      .from('purchases')
      .select('*, supplier:suppliers(*)')
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (ctx?.supermarketId) {
      query = query.eq('supermarket_id', ctx.supermarketId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createPurchaseOrder(
    po: Partial<PurchaseOrder>,
    items: { product_id: string; quantity: number; cost_price: number }[] = []
  ): Promise<PurchaseOrder> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const rawPo = po as any;

    const poPayload = {
      po_number: rawPo.po_number || `PO-${Date.now().toString().slice(-6)}`,
      supplier_id: po.supplier_id,
      status: po.status || 'draft',
      total_amount: po.total_amount || 0,
      notes: rawPo.notes || null,
      order_date: rawPo.order_date || new Date().toISOString().split('T')[0],
      expected_delivery_date: rawPo.expected_delivery_date || null,
      supermarket_id: po.supermarket_id || ctx?.supermarketId,
      branch_id: po.branch_id || ctx?.branchId,
    };

    const { data: newPo, error: poErr } = await supabase
      .from('purchases')
      .insert([poPayload])
      .select()
      .single();

    if (poErr) throw poErr;

    if (items && items.length > 0) {
      const itemsPayload = items.map((item) => ({
        purchase_id: newPo.id,
        product_id: item.product_id,
        quantity: item.quantity,
        cost_price: item.cost_price,
        supermarket_id: newPo.supermarket_id,
        branch_id: newPo.branch_id,
      }));

      const { error: itemsErr } = await supabase.from('purchase_items').insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    return newPo;
  },

  async updatePOStatus(id: string, status: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('purchases')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
