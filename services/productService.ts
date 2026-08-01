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
    return data || [];
  },

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('barcode', barcode)
      .eq('deleted', false)
      .single();

    if (error) return null;
    return data;
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
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
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
