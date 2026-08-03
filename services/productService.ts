import { createClient } from '@/lib/supabase/client';
import { Product, Category } from '@/types';
import { authService } from './authService';

export const productService = {
  async getProducts(): Promise<Product[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('deleted', false)
      .order('name', { ascending: true });

    if (error) throw error;
    
    return (data || []).map((p: Product) => ({
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

  async createCategory(category: Partial<Category>): Promise<Category> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const payload = {
      name: category.name,
      description: category.description,
      supermarket_id: category.supermarket_id || ctx?.supermarketId,
      branch_id: category.branch_id || ctx?.branchId,
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();

    const payload: Record<string, unknown> = {
      name: product.name,
      sku: product.sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: product.barcode || `BC-${Date.now()}`,
      unit: product.unit || 'Pcs',
      buying_price: product.buying_price ?? product.cost_price ?? 0,
      selling_price: product.selling_price ?? 0,
      current_stock: product.current_stock ?? product.stock_quantity ?? 0,
      minimum_stock: product.minimum_stock ?? product.reorder_level ?? 5,
      tax_rate: product.tax_rate ?? product.vat_rate ?? 16,
      supermarket_id: product.supermarket_id || ctx?.supermarketId,
      branch_id: product.branch_id || ctx?.branchId,
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
    if (product.image_url && product.image_url.trim() !== '') {
      payload.image_url = product.image_url;
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
    const ctx = await authService.getCurrentUserContext();

    // Extract values considering both standard DB column names and legacy aliases
    const buying_price = updates.buying_price !== undefined ? updates.buying_price : updates.cost_price;
    const current_stock = updates.current_stock !== undefined ? updates.current_stock : updates.stock_quantity;
    const minimum_stock = updates.minimum_stock !== undefined ? updates.minimum_stock : updates.reorder_level;
    const tax_rate = updates.tax_rate !== undefined ? updates.tax_rate : updates.vat_rate;

    const payload: Record<string, unknown> = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.barcode !== undefined) payload.barcode = updates.barcode;
    if (updates.sku !== undefined) payload.sku = updates.sku || null;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (buying_price !== undefined) payload.buying_price = buying_price;
    if (updates.selling_price !== undefined) payload.selling_price = updates.selling_price;
    if (updates.wholesale_price !== undefined) payload.wholesale_price = updates.wholesale_price;
    if (updates.minimum_price !== undefined) payload.minimum_price = updates.minimum_price;
    if (current_stock !== undefined) payload.current_stock = current_stock;
    if (minimum_stock !== undefined) payload.minimum_stock = minimum_stock;
    if (updates.maximum_stock !== undefined) payload.maximum_stock = updates.maximum_stock;
    if (tax_rate !== undefined) payload.tax_rate = tax_rate;
    if (updates.expiry_date !== undefined) payload.expiry_date = updates.expiry_date && updates.expiry_date.trim() !== '' ? updates.expiry_date : null;
    if (updates.category_id !== undefined) payload.category_id = updates.category_id && updates.category_id.trim() !== '' ? updates.category_id : null;
    if (updates.supplier_id !== undefined) payload.supplier_id = updates.supplier_id && updates.supplier_id.trim() !== '' ? updates.supplier_id : null;
    if (updates.image_url !== undefined) payload.image_url = updates.image_url && updates.image_url.trim() !== '' ? updates.image_url : null;
    if (updates.description !== undefined) payload.description = updates.description && updates.description.trim() !== '' ? updates.description : null;
    if (updates.location !== undefined) payload.location = updates.location && updates.location.trim() !== '' ? updates.location : null;

    // Preserve supermarket_id and branch_id for RLS compliance
    if (updates.supermarket_id) payload.supermarket_id = updates.supermarket_id;
    else if (ctx?.supermarketId) payload.supermarket_id = ctx.supermarketId;

    if (updates.branch_id) payload.branch_id = updates.branch_id;
    else if (ctx?.branchId) payload.branch_id = ctx.branchId;

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase Product Update Error:', error);
      throw new Error(error.message || 'Failed to update product in Supabase');
    }

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
