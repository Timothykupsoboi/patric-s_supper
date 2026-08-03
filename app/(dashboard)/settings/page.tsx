'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingService } from '@/services/settingService';
import { employeeService } from '@/services/employeeService';
import { authService } from '@/services/authService';
import { storageService } from '@/services/storageService';
import { brandingService, BrandingSettings } from '@/services/brandingService';
import { mpesaService, MpesaConfig } from '@/services/mpesaService';
import { whatsappService, WhatsAppConfig } from '@/services/whatsappService';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  Save, AlertCircle, Sparkles, UserCheck, Store, Lock, Timer, Palette,
  Upload, X, Camera, Loader2, CheckCircle2, Eye, Receipt, Globe, Clock, ShieldAlert, Image as ImageIcon,
  Smartphone, Key, ShieldCheck, RefreshCw, Layers, Check, MessageSquare,
} from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface ImageUploaderProps {
  label: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  assetType: 'logo' | 'favicon' | 'login_bg' | 'receipt_logo';
}

function BrandingAssetUploader({ label, currentUrl = '', onUploaded, assetType }: ImageUploaderProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(currentUrl);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  const handleFile = async (file: File) => {
    if (file.size > MAX_SIZE_BYTES) return;
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const url = await brandingService.uploadBrandingAsset(file, user?.supermarket_id || 'default', assetType);
      setPreview(url);
      onUploaded(url);
    } catch {
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 font-sans">
      <label className="block text-xs font-bold text-slate-700">{label}</label>
      <div className="flex items-center space-x-3">
        <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative shadow-xs">
          {preview ? (
            <img src={preview} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-300" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} isLoading={uploading}>
            <Upload className="w-3.5 h-3.5 mr-1" /> Change Image
          </Button>
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview('');
                onUploaded('');
              }}
              className="block text-[11px] font-bold text-red-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const { user, autoLockTimeoutMinutes, updateAutoLockTimeout } = useAuth();
  const { branding, saveBranding, previewBranding, isPlatformOwner, isOwner } = useBranding();

  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'branding' | 'mpesa' | 'whatsapp' | 'terminal'>('profile');

  // Personal Profile State
  const [fullName, setFullName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Store Settings State
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('KES');

  // White Label Branding Form State
  const [bName, setBName] = useState(branding.business_name || '');
  const [sName, setSName] = useState(branding.short_name || '');
  const [tagline, setTagline] = useState(branding.tagline || '');
  const [logoUrl, setLogoUrl] = useState(branding.logo_url || '');
  const [faviconUrl, setFaviconUrl] = useState(branding.favicon_url || '');
  const [primaryColor, setPrimaryColor] = useState(branding.primary_color || '#2563EB');
  const [secondaryColor, setSecondaryColor] = useState(branding.secondary_color || '#64748B');
  const [accentColor, setAccentColor] = useState(branding.accent_color || '#10B981');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(branding.theme_mode || 'light');
  const [loginBgUrl, setLoginBgUrl] = useState(branding.login_bg_url || '');
  const [receiptLogoUrl, setReceiptLogoUrl] = useState(branding.receipt_logo_url || '');
  const [receiptFooter, setReceiptFooter] = useState(branding.receipt_footer || '');
  const [invoiceHeader, setInvoiceHeader] = useState(branding.invoice_header || '');
  const [invoiceFooter, setInvoiceFooter] = useState(branding.invoice_footer || '');
  const [bEmail, setBEmail] = useState(branding.email || '');
  const [bPhone, setBPhone] = useState(branding.phone || '');
  const [bWebsite, setBWebsite] = useState(branding.website || '');
  const [bAddress, setBAddress] = useState(branding.address || '');
  const [bCurrency, setBCurrency] = useState(branding.currency || 'KES');
  const [bTimezone, setBTimezone] = useState(branding.timezone || 'Africa/Nairobi');

  const [savingBranding, setSavingBranding] = useState(false);

  // M-Pesa Integration Form State
  const [mpesaEnv, setMpesaEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [shortcode, setShortcode] = useState('174379');
  const [tillNumber, setTillNumber] = useState('889900');
  const [paybillNumber, setPaybillNumber] = useState('600100');
  const [passkey, setPasskey] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('https://api.antigravityretail.com/mpesa/callback');
  const [accountRef, setAccountRef] = useState('STORE_POS');
  const [enableStk, setEnableStk] = useState(true);
  const [enablePaybill, setEnablePaybill] = useState(true);
  const [enableTill, setEnableTill] = useState(true);
  const [enableRefunds, setEnableRefunds] = useState(true);
  const [enableReconciliation, setEnableReconciliation] = useState(true);

  const [testingMpesa, setTestingMpesa] = useState(false);
  const [savingMpesa, setSavingMpesa] = useState(false);

  // WhatsApp Integration Form State
  const [waEnabled, setWaEnabled] = useState(true);
  const [phoneNumId, setPhoneNumId] = useState('109283746501928');
  const [bizAccountId, setBizAccountId] = useState('881920394819203');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('antigravity_wa_verify_sec_99');
  const [countryCode, setCountryCode] = useState('+254');
  const [displayName, setDisplayName] = useState('Nairobi Supermarket Official');
  const [bizPhone, setBizPhone] = useState('254700000000');

  const [testingWa, setTestingWa] = useState(false);
  const [savingWa, setSavingWa] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setUserPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    setBName(branding.business_name || '');
    setSName(branding.short_name || '');
    setTagline(branding.tagline || '');
    setLogoUrl(branding.logo_url || '');
    setFaviconUrl(branding.favicon_url || '');
    setPrimaryColor(branding.primary_color || '#2563EB');
    setSecondaryColor(branding.secondary_color || '#64748B');
    setAccentColor(branding.accent_color || '#10B981');
    setThemeMode(branding.theme_mode || 'light');
    setLoginBgUrl(branding.login_bg_url || '');
    setReceiptLogoUrl(branding.receipt_logo_url || '');
    setReceiptFooter(branding.receipt_footer || '');
    setInvoiceHeader(branding.invoice_header || '');
    setInvoiceFooter(branding.invoice_footer || '');
    setBEmail(branding.email || '');
    setBPhone(branding.phone || '');
    setBWebsite(branding.website || '');
    setBAddress(branding.address || '');
    setBCurrency(branding.currency || 'KES');
    setBTimezone(branding.timezone || 'Africa/Nairobi');
  }, [branding]);

  // Load M-Pesa & WhatsApp configurations
  useEffect(() => {
    if (user?.supermarket_id) {
      mpesaService.getConfig(user.supermarket_id).then((cfg) => {
        setMpesaEnv(cfg.environment);
        setConsumerKey(cfg.consumer_key);
        setConsumerSecret(cfg.consumer_secret);
        setShortcode(cfg.business_shortcode);
        setTillNumber(cfg.till_number || '');
        setPaybillNumber(cfg.paybill_number || '');
        setPasskey(cfg.passkey);
        setCallbackUrl(cfg.callback_url);
        setAccountRef(cfg.account_reference);
        setEnableStk(cfg.enable_stk_push);
        setEnablePaybill(cfg.enable_paybill);
        setEnableTill(cfg.enable_till);
        setEnableRefunds(cfg.enable_refunds);
        setEnableReconciliation(cfg.enable_reconciliation);
      });

      whatsappService.getConfig(user.supermarket_id).then((wacfg) => {
        setWaEnabled(wacfg.is_enabled);
        setPhoneNumId(wacfg.phone_number_id);
        setBizAccountId(wacfg.business_account_id);
        setAccessToken(wacfg.permanent_access_token);
        setVerifyToken(wacfg.webhook_verify_token);
        setCountryCode(wacfg.default_country_code);
        setDisplayName(wacfg.display_name);
        setBizPhone(wacfg.business_phone);
      });
    }
  }, [user]);

  const handleTestWa = async () => {
    setTestingWa(true);
    try {
      const res = await whatsappService.testConnection({
        phone_number_id: phoneNumId,
        permanent_access_token: accessToken,
        display_name: displayName,
      });
      if (res.success) {
        toast.success('WhatsApp API Connected', res.message);
      } else {
        toast.error('Connection Failed', res.message);
      }
    } catch (err: any) {
      toast.error('WhatsApp Test Error', err.message || 'WhatsApp Cloud API test failed.');
    } fontFinally: {
      setTestingWa(false);
    }
  };

  const handleSaveWaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWa(true);
    try {
      await whatsappService.saveConfig(user?.supermarket_id || '00000000-0000-0000-0000-000000000001', {
        is_enabled: waEnabled,
        phone_number_id: phoneNumId,
        business_account_id: bizAccountId,
        permanent_access_token: accessToken,
        webhook_verify_token: verifyToken,
        default_country_code: countryCode,
        display_name: displayName,
        business_phone: bizPhone,
      });
      toast.success('WhatsApp Credentials Saved', 'Meta Cloud API settings updated for this supermarket.');
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Could not save WhatsApp configuration.');
    } finally {
      setSavingWa(false);
    }
  };

  const handleTestMpesa = async () => {
    setTestingMpesa(true);
    try {
      const res = await mpesaService.testConnection({
        environment: mpesaEnv,
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        business_shortcode: shortcode,
      });
      if (res.success) {
        toast.success('M-Pesa API Connection Successful', res.message);
      } else {
        toast.error('Connection Failed', res.message);
      }
    } catch (err: any) {
      toast.error('Test Connection Error', err.message || 'M-Pesa API test failed.');
    } finally {
      setTestingMpesa(false);
    }
  };

  const handleSaveMpesaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMpesa(true);
    try {
      await mpesaService.saveConfig(user?.supermarket_id || '00000000-0000-0000-0000-000000000001', {
        environment: mpesaEnv,
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        business_shortcode: shortcode,
        till_number: tillNumber,
        paybill_number: paybillNumber,
        passkey,
        callback_url: callbackUrl,
        account_reference: accountRef,
        enable_stk_push: enableStk,
        enable_paybill: enablePaybill,
        enable_till: enableTill,
        enable_refunds: enableRefunds,
        enable_reconciliation: enableReconciliation,
      });
      toast.success('M-Pesa Credentials Saved', 'Safaricom Daraja API settings updated for this supermarket.');
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Could not save M-Pesa configuration.');
    } finally {
      setSavingMpesa(false);
    }
  };

  // Live preview update triggers
  const handleBrandingChange = (key: string, val: any) => {
    const draft = {
      business_name: key === 'bName' ? val : bName,
      short_name: key === 'sName' ? val : sName,
      tagline: key === 'tagline' ? val : tagline,
      logo_url: key === 'logoUrl' ? val : logoUrl,
      primary_color: key === 'primaryColor' ? val : primaryColor,
      secondary_color: key === 'secondaryColor' ? val : secondaryColor,
      accent_color: key === 'accentColor' ? val : accentColor,
      theme_mode: key === 'themeMode' ? val : themeMode,
      receipt_footer: key === 'receiptFooter' ? val : receiptFooter,
    };
    previewBranding(draft);
  };

  const handleSaveBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      await saveBranding({
        business_name: bName,
        short_name: sName,
        tagline,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        theme_mode: themeMode,
        login_bg_url: loginBgUrl,
        receipt_logo_url: receiptLogoUrl,
        receipt_footer: receiptFooter,
        invoice_header: invoiceHeader,
        invoice_footer: invoiceFooter,
        email: bEmail,
        phone: bPhone,
        website: bWebsite,
        address: bAddress,
        currency: bCurrency,
        timezone: bTimezone,
      });
      toast.success('Branding Updated', 'Supermarket white label settings saved successfully.');
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Could not save branding settings.');
    } finally {
      setSavingBranding(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Settings & Integrations</h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage store profiles, white label branding, M-Pesa STK Push credentials, and WhatsApp Cloud API</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'profile', label: 'My Account Profile', icon: UserCheck },
          { id: 'store', label: 'Store Information', icon: Store },
          { id: 'branding', label: 'White Label & Branding', icon: Palette },
          { id: 'mpesa', label: 'M-Pesa Integration', icon: Smartphone },
          { id: 'whatsapp', label: 'WhatsApp Integration', icon: MessageSquare },
          { id: 'terminal', label: 'Terminal Shift Lock', icon: Timer },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: WhatsApp Integration */}
      {activeTab === 'whatsapp' && (
        <form onSubmit={handleSaveWaSubmit} className="space-y-6 max-w-3xl font-sans">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-extrabold flex items-center space-x-2 text-emerald-900">
                <MessageSquare className="w-4.5 h-4.5 text-emerald-600" />
                <span>Meta WhatsApp Business Cloud API Gateway</span>
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <label className="flex items-center space-x-2.5 p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={waEnabled}
                  onChange={(e) => setWaEnabled(e.target.checked)}
                  disabled={!isOwner}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-emerald-900">Enable Automated WhatsApp Notifications</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input isFloating label="WhatsApp Phone Number ID" value={phoneNumId} onChange={(e) => setPhoneNumId(e.target.value)} disabled={!isOwner} required />
                <Input isFloating label="WhatsApp Business Account ID" value={bizAccountId} onChange={(e) => setBizAccountId(e.target.value)} disabled={!isOwner} required />
              </div>

              <Input
                isFloating
                label="Permanent Meta Graph Access Token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={!isOwner}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input isFloating label="Business Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={!isOwner} />
                <Input isFloating label="Business Phone Number (2547...)" value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} disabled={!isOwner} />
              </div>
            </div>
          </Card>

          {isOwner && (
            <div className="flex space-x-3 pt-2">
              <Button type="button" onClick={handleTestWa} variant="outline" size="lg" isLoading={testingWa}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Meta API Connection
              </Button>
              <Button type="submit" variant="primary" size="lg" isLoading={savingWa} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save WhatsApp Configuration
              </Button>
            </div>
          )}
        </form>
      )}

      {/* Tab 4: M-Pesa Integration */}
      {activeTab === 'mpesa' && (
        <form onSubmit={handleSaveMpesaSubmit} className="space-y-6 max-w-3xl font-sans">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-extrabold flex items-center space-x-2 text-emerald-900">
                <Smartphone className="w-4.5 h-4.5 text-emerald-600" />
                <span>Safaricom Daraja API Gateway Environment</span>
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <Select
                isFloating
                label="M-Pesa API Environment"
                value={mpesaEnv}
                onChange={(e) => setMpesaEnv(e.target.value as any)}
                disabled={!isOwner}
                options={[
                  { value: 'sandbox', label: 'Sandbox (Testing & Simulation)' },
                  { value: 'production', label: 'Production (Live Daraja Gateway)' },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input isFloating label="Business Shortcode" value={shortcode} onChange={(e) => setShortcode(e.target.value)} disabled={!isOwner} required />
                <Input isFloating label="PayBill Number" value={paybillNumber} onChange={(e) => setPaybillNumber(e.target.value)} disabled={!isOwner} />
                <Input isFloating label="Buy Goods Till Number" value={tillNumber} onChange={(e) => setTillNumber(e.target.value)} disabled={!isOwner} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-extrabold flex items-center space-x-2">
                <Key className="w-4.5 h-4.5 text-blue-600" />
                <span>API Consumer Keys & Passkey</span>
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <Input
                isFloating
                label="Consumer Key"
                type="password"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                disabled={!isOwner}
                required
              />
              <Input
                isFloating
                label="Consumer Secret"
                type="password"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                disabled={!isOwner}
                required
              />
              <Input
                isFloating
                label="Online Passkey (LIPA NA M-PESA ONLINE)"
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                disabled={!isOwner}
                required
              />
            </div>
          </Card>

          {isOwner && (
            <div className="flex space-x-3 pt-2">
              <Button type="button" onClick={handleTestMpesa} variant="outline" size="lg" isLoading={testingMpesa}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test API Connection
              </Button>
              <Button type="submit" variant="primary" size="lg" isLoading={savingMpesa} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save M-Pesa Configuration
              </Button>
            </div>
          )}
        </form>
      )}

      {/* Tab 3: White Label & Branding */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSaveBrandingSubmit} className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold flex items-center space-x-2">
                    <Store className="w-4 h-4 text-blue-600" />
                    <span>Business Identity & Tagline</span>
                  </CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  <Input
                    isFloating
                    label="Business / Supermarket Name"
                    value={bName}
                    onChange={(e) => {
                      setBName(e.target.value);
                      handleBrandingChange('bName', e.target.value);
                    }}
                    disabled={!isOwner}
                    required
                  />
                  <Input
                    isFloating
                    label="Short Business Name (for Sidebar & Badge)"
                    value={sName}
                    onChange={(e) => {
                      setSName(e.target.value);
                      handleBrandingChange('sName', e.target.value);
                    }}
                    disabled={!isOwner}
                  />
                </div>
              </Card>

              {isOwner && (
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="lg" isLoading={savingBranding}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Branding Changes
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <div className="space-y-4 max-w-md">
            <Input isFloating label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input isFloating label="Phone Number" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
            <Input isFloating label="Email Address" value={user?.email || ''} disabled className="bg-slate-50" />
          </div>
        </Card>
      )}

      {/* Tab 2: Store */}
      {activeTab === 'store' && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <div className="space-y-4 max-w-md">
            <Input isFloating label="Store Name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            <Input isFloating label="Store Phone" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
          </div>
        </Card>
      )}

      {/* Tab 6: Terminal Lock */}
      {activeTab === 'terminal' && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Terminal Shift Lock Timeout</CardTitle>
          </CardHeader>
          <div className="space-y-4 max-w-md">
            <Input
              isFloating
              label="Auto-Lock Timeout (Minutes)"
              type="number"
              value={autoLockTimeoutMinutes}
              onChange={(e) => updateAutoLockTimeout(parseInt(e.target.value) || 15)}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
