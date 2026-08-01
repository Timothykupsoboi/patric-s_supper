import { createClient } from '@/lib/supabase/client';
import { Product, Category } from '@/types';

export const productService = {
  async getProducts(): Promise<Product[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (error) throw error;
    
    return (data || []).map((p: any) => ({
      ...p,
      cost_price: p.buying_price,
      stock_quantity: p.current_stock,
      reorder_level: p.minimum_stock,
      vat_rate: p.tax_rate,
    }));
  },

  async getCategories(): Promise<Category[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const supabase = createClient();
    const payload: any = {
      name: product.name,
      sku: product.sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: product.barcode || `BC-${Date.now()}`,
      unit: product.unit || 'Pcs',
      buying_price: product.buying_price ?? product.cost_price ?? 0,
      selling_price: product.selling_price ?? 0,
      current_stock: product.current_stock ?? product.stock_quantity ?? 0,
      minimum_stock: product.minimum_stock ?? product.reorder_level ?? 5,
      tax_rate: product.tax_rate ?? product.vat_rate ?? 16,
    };

    if (product.category_id && product.category_id.trim() !== '') {
      payload.category_id = product.category_id;
    }
    if (product.supplier_id && product.supplier_id.trim() !== '') {
      payload.supplier_id = product.supplier_id;
    }
    if (product.expiry_date && product.expiry_date.trim() !== '') {
      payload.expiry_date = product.expiry_date;
    }
    if (product.supermarket_id && product.supermarket_id.trim() !== '') {
      payload.supermarket_id = product.supermarket_id;
    }

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase Product Insert Error:', error);
      throw new Error(error.message || 'Failed to insert product into Supabase');
    }

    return {
      ...data,
      cost_price: data.buying_price,
      stock_quantity: data.current_stock,
      reorder_level: data.minimum_stock,
      vat_rate: data.tax_rate,
    };
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const supabase = createClient();
    const payload: any = { ...updates, updated_at: new Date().toISOString() };
    
    if (updates.cost_price !== undefined) payload.buying_price = updates.cost_price;
    if (updates.stock_quantity !== undefined) payload.current_stock = updates.stock_quantity;
    if (updates.reorder_level !== undefined) payload.minimum_stock = updates.reorder_level;
    if (updates.vat_rate !== undefined) payload.tax_rate = updates.vat_rate;

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      cost_price: data.buying_price,
      stock_quantity: data.current_stock,
      reorder_level: data.minimum_stock,
      vat_rate: data.tax_rate,
    };
  },

  async deleteProduct(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
