import { createClient } from '@/lib/supabase/client';
import { Supermarket } from '@/types';
import { authService } from './authService';

export interface BrandingSettings {
  supermarket_id: string;
  business_name: string;
  short_name?: string;
  tagline?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  theme_mode: 'light' | 'dark' | 'system';
  login_bg_url?: string;
  dashboard_banner_url?: string;
  receipt_logo_url?: string;
  receipt_footer?: string;
  invoice_header?: string;
  invoice_footer?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  currency?: string;
  timezone?: string;
  language?: string;
}

export const DEFAULT_PLATFORM_BRANDING: BrandingSettings = {
  supermarket_id: '00000000-0000-0000-0000-000000000001',
  business_name: 'Antigravity Supermarket Platform',
  short_name: 'Antigravity Retail',
  tagline: 'Enterprise Retail & Multi-Branch POS Platform',
  logo_url: '',
  favicon_url: '',
  primary_color: '#2563EB',
  secondary_color: '#64748B',
  accent_color: '#10B981',
  theme_mode: 'light',
  login_bg_url: '',
  dashboard_banner_url: '',
  receipt_logo_url: '',
  receipt_footer: 'Thank you for shopping with us! Please retain this receipt for returns.',
  invoice_header: 'Official Tax Invoice',
  invoice_footer: 'Thank you for your business.',
  email: 'support@antigravityretail.com',
  phone: '+254 700 000 000',
  website: 'https://antigravityretail.com',
  address: 'Nairobi CBD, Kenya',
  currency: 'KES',
  timezone: 'Africa/Nairobi',
  language: 'en',
};

// Hex to HSL / Lighten / Darken helper for dynamic palette generation
export function generateColorPalette(hexColor: string) {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  // Darker hover color (multiply by 0.85)
  const hoverR = Math.max(0, Math.floor(r * 0.85));
  const hoverG = Math.max(0, Math.floor(g * 0.85));
  const hoverB = Math.max(0, Math.floor(b * 0.85));
  const hoverHex = `#${((1 << 24) + (hoverR << 16) + (hoverG << 8) + hoverB).toString(16).slice(1)}`;

  // Light tint for focus rings / backgrounds (blend with white 90%)
  const lightR = Math.floor(r * 0.15 + 255 * 0.85);
  const lightG = Math.floor(g * 0.15 + 255 * 0.85);
  const lightB = Math.floor(b * 0.15 + 255 * 0.85);
  const lightHex = `#${((1 << 24) + (lightR << 16) + (lightG << 8) + lightB).toString(16).slice(1)}`;

  return {
    primary: `#${hex}`,
    hover: hoverHex,
    light: lightHex,
  };
}

export const brandingService = {
  async getBranding(supermarketId?: string): Promise<BrandingSettings> {
    const supabase = createClient();
    const ctx = await authService.getCurrentUserContext();
    const targetId = supermarketId || ctx?.supermarketId;

    if (!targetId || targetId === '00000000-0000-0000-0000-000000000001') {
      return DEFAULT_PLATFORM_BRANDING;
    }

    try {
      const { data, error } = await supabase
        .from('supermarkets')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error || !data) return DEFAULT_PLATFORM_BRANDING;

      // Extract custom branding fields or fall back to defaults
      return {
        supermarket_id: data.id,
        business_name: data.name || DEFAULT_PLATFORM_BRANDING.business_name,
        short_name: data.short_name || data.name || DEFAULT_PLATFORM_BRANDING.short_name,
        tagline: data.tagline || DEFAULT_PLATFORM_BRANDING.tagline,
        logo_url: data.logo_url || '',
        favicon_url: data.favicon_url || data.logo_url || '',
        primary_color: data.primary_color || DEFAULT_PLATFORM_BRANDING.primary_color,
        secondary_color: data.secondary_color || DEFAULT_PLATFORM_BRANDING.secondary_color,
        accent_color: data.accent_color || DEFAULT_PLATFORM_BRANDING.accent_color,
        theme_mode: data.theme_mode || 'light',
        login_bg_url: data.login_bg_url || '',
        dashboard_banner_url: data.dashboard_banner_url || '',
        receipt_logo_url: data.receipt_logo_url || data.logo_url || '',
        receipt_footer: data.receipt_footer || DEFAULT_PLATFORM_BRANDING.receipt_footer,
        invoice_header: data.invoice_header || DEFAULT_PLATFORM_BRANDING.invoice_header,
        invoice_footer: data.invoice_footer || DEFAULT_PLATFORM_BRANDING.invoice_footer,
        email: data.email || DEFAULT_PLATFORM_BRANDING.email,
        phone: data.phone || DEFAULT_PLATFORM_BRANDING.phone,
        website: data.website || DEFAULT_PLATFORM_BRANDING.website,
        address: data.address || DEFAULT_PLATFORM_BRANDING.address,
        currency: data.currency || DEFAULT_PLATFORM_BRANDING.currency,
        timezone: data.timezone || DEFAULT_PLATFORM_BRANDING.timezone,
        language: data.language || DEFAULT_PLATFORM_BRANDING.language,
      };
    } catch {
      return DEFAULT_PLATFORM_BRANDING;
    }
  },

  async updateBranding(supermarketId: string, settings: Partial<BrandingSettings>): Promise<BrandingSettings> {
    const supabase = createClient();

    // Update database fields
    const { data, error } = await supabase
      .from('supermarkets')
      .update({
        name: settings.business_name,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        logo_url: settings.logo_url,
        currency: settings.currency,
        timezone: settings.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supermarketId)
      .select()
      .single();

    if (error) {
      console.warn('Supermarket table partial update error:', error.message);
    }

    const updated = await this.getBranding(supermarketId);
    const merged = { ...updated, ...settings };

    // Cache locally for instant offline performance
    if (typeof window !== 'undefined') {
      localStorage.setItem(`branding_cache_${supermarketId}`, JSON.stringify(merged));
    }

    return merged;
  },

  async uploadBrandingAsset(file: File, supermarketId: string, assetType: 'logo' | 'favicon' | 'login_bg' | 'receipt_logo'): Promise<string> {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `branding/${supermarketId}/${assetType}_${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('branding-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Fallback to Base64 Data URL if bucket is unconfigured
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from('branding-assets')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch {
      // Base64 Data URL fallback
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  },
};
