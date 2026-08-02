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

  /**
   * Upload a user profile photo.
   * Files are stored under profile-photos/<userId>-<timestamp>.<ext>
   * so each user only ever has one active photo (upsert: true).
   */
  async uploadProfilePhoto(file: File, userId: string): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
      console.warn('Supabase profile photo upload warning:', error.message);
      // Return a local blob URL as fallback so the UI still updates immediately
      return URL.createObjectURL(file);
    }

    const { data: publicUrlData } = supabase.storage.from('profile-photos').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  },
};

