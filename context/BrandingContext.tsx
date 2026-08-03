'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { brandingService, BrandingSettings, DEFAULT_PLATFORM_BRANDING, generateColorPalette } from '@/services/brandingService';

interface BrandingContextType {
  branding: BrandingSettings;
  previewBranding: (preview: Partial<BrandingSettings>) => void;
  saveBranding: (updates: Partial<BrandingSettings>) => Promise<void>;
  resetBranding: () => void;
  isLoading: boolean;
  isPlatformOwner: boolean;
  isOwner: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_PLATFORM_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  const isPlatformOwner = user?.role === 'platform_owner';
  const isOwner = user?.role === 'supermarket_owner' || user?.role === 'owner';

  // Apply CSS root variables and document titles dynamically
  const applyBrandingStyles = useCallback((settings: BrandingSettings) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Palette Generation
    const palette = generateColorPalette(settings.primary_color || '#2563EB');

    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--ring', palette.primary);
    root.style.setProperty('--primary-hover', palette.hover);
    root.style.setProperty('--primary-light', palette.light);
    root.style.setProperty('--accent', settings.accent_color || '#10B981');

    // Theme Mode (light / dark / system)
    if (settings.theme_mode === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme_mode === 'light') {
      root.classList.remove('dark');
    }

    // Document Title & Favicon
    const displayName = settings.short_name || settings.business_name || 'Antigravity Retail';
    document.title = `${displayName} — Enterprise Retail POS`;

    if (settings.favicon_url) {
      let favicon = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'shortcut icon';
        document.head.appendChild(favicon);
      }
      favicon.href = settings.favicon_url;
    }
  }, []);

  // Fetch or Load Branding
  const loadBranding = useCallback(async () => {
    setIsLoading(true);

    // Platform Owner always sees platform default branding
    if (isPlatformOwner || !user?.supermarket_id) {
      setBranding(DEFAULT_PLATFORM_BRANDING);
      applyBrandingStyles(DEFAULT_PLATFORM_BRANDING);
      setIsLoading(false);
      return;
    }

    const supermarketId = user.supermarket_id;

    // Check localStorage cache first for fast load
    const cached = typeof window !== 'undefined' ? localStorage.getItem(`branding_cache_${supermarketId}`) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setBranding(parsed);
        applyBrandingStyles(parsed);
      } catch {
        // ignore cache parse error
      }
    }

    // Fetch fresh database branding
    try {
      const fresh = await brandingService.getBranding(supermarketId);
      setBranding(fresh);
      applyBrandingStyles(fresh);
    } catch {
      // Keep cached or default
    } finally {
      setIsLoading(false);
    }
  }, [user, isPlatformOwner, applyBrandingStyles]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  // Real-time Preview handler before saving
  const previewBranding = (preview: Partial<BrandingSettings>) => {
    if (isPlatformOwner) return; // Protected
    const updated = { ...branding, ...preview };
    setBranding(updated);
    applyBrandingStyles(updated);
  };

  // Save branding updates to Supabase & local cache
  const saveBranding = async (updates: Partial<BrandingSettings>) => {
    if (isPlatformOwner || !user?.supermarket_id) return; // Protected
    const updated = await brandingService.updateBranding(user.supermarket_id, updates);
    setBranding(updated);
    applyBrandingStyles(updated);
  };

  // Reset to saved database branding
  const resetBranding = () => {
    loadBranding();
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        previewBranding,
        saveBranding,
        resetBranding,
        isLoading,
        isPlatformOwner,
        isOwner,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
