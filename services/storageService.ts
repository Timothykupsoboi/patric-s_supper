import { createClient } from '@/lib/supabase/client';

export const storageService = {
  async uploadProductImage(file: File): Promise<string> {
    const supabase = createClient();
    const fileName = `product-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
      // Fallback: Return data URL or error message if storage bucket isn't public yet
      console.warn('Supabase storage upload warning:', error.message);
      return URL.createObjectURL(file);
    }

    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  },

  async uploadStoreLogo(file: File): Promise<string> {
    const supabase = createClient();
    const fileName = `logo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase.storage
      .from('store-logos')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
      console.warn('Supabase store logo upload warning:', error.message);
      return URL.createObjectURL(file);
    }

    const { data: publicUrlData } = supabase.storage.from('store-logos').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  },
};
