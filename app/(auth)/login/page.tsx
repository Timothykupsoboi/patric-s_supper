'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { authService } from '@/services/authService';
import {
  ShoppingCart, Lock, Mail, Eye, EyeOff, ArrowRight,
  ShieldCheck, CheckCircle2, Store, Sparkles, AlertTriangle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, setUserProfile } = useAuth();
  const { branding } = useBranding();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Check URL params for password reset success message
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === 'success') {
        const msg = 'Password updated successfully! Please sign in with your new credentials.';
        setSuccessNotice(msg);
        toast.success('Password Updated', msg);
      }
    }
  }, [toast]);

  // Auto redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (user.role === 'platform_owner') {
        router.push('/admin/platform');
      } else {
        router.push('/terminal-login');
      }
    }
  }, [user, router]);

  const getRedirectPathByRole = (role?: string): string => {
    if (role === 'platform_owner') {
      return '/admin/platform';
    }
    return '/terminal-login';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      toast.error('Authentication Error', 'Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 1) {
      setError('Please enter your password.');
      toast.error('Authentication Error', 'Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth & validate profile & supermarket status
      const res = await authService.login(email.trim(), password);

      // 2. Set authenticated session profile & redirect based on credentials
      if (res.profile) {
        setUserProfile(res.profile);
        toast.success('Welcome Back!', `Signed in as ${res.profile.name}`);
        const targetPath = getRedirectPathByRole(res.profile.role);
        router.push(targetPath);
      } else {
        const errMsg = 'Account profile not found. Please contact your administrator.';
        setError(errMsg);
        toast.error('Sign In Failed', errMsg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
      setError(msg);
      toast.error('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-white">
      {/* LEFT COLUMN — Branding + Login Form */}
      <div className="w-full lg:w-[42%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 py-12 bg-white relative z-10">

        {/* Logo / Brand */}
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-8">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.business_name} className="w-12 h-12 object-contain rounded-xl" />
            ) : (
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md text-white font-black text-lg"
                style={{ backgroundColor: branding.primary_color || '#2563EB' }}
              >
                <Store className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p
                className="text-[10px] font-black tracking-widest uppercase"
                style={{ color: branding.primary_color || '#2563EB' }}
              >
                {branding.short_name || 'Supermarket'}
              </p>
              <p className="text-sm font-black text-slate-800 leading-none tracking-tight">
                {branding.business_name || 'Retail Platform'}
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            {branding.tagline || 'Sign in to access your supermarket management portal.'}
          </p>
        </div>

        {/* Success Banner */}
        {successNotice && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-start space-x-2 animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-start space-x-2 animate-in fade-in-50">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Sign In Form ── */}
        <form onSubmit={handleLogin} className="space-y-4" noValidate>

          {/* Floating Email Input */}
          <Input
            isFloating
            label="Email Address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            disabled={loading}
            autoFocus
            required
          />

          {/* Password with Floating Label & Toggle */}
          <div>
            <div className="relative">
              <Input
                isFloating
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors cursor-pointer z-20"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end mt-1.5">
              <Link
                href="/forgot-password"
                className="text-xs font-bold hover:underline transition-colors"
                style={{ color: branding.primary_color || '#2563EB' }}
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
            />
            <label
              htmlFor="remember-me"
              className="text-xs text-slate-600 font-bold cursor-pointer select-none"
            >
              Remember me on this device
            </label>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 font-extrabold"
            style={{ backgroundColor: branding.primary_color || '#2563EB', borderColor: branding.primary_color || '#2563EB' }}
            isLoading={loading}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </form>

        {/* Trust indicators */}
        <div className="mt-10 pt-6 border-t border-slate-100">
          <div className="flex flex-wrap gap-3">
            {[
              { icon: ShieldCheck, text: 'Supabase Auth' },
              { icon: CheckCircle2, text: 'Multi-Tenant RLS' },
              { icon: Store, text: 'Enterprise POS' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500"
              >
                <Icon className="w-3.5 h-3.5 text-blue-500" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-[11px] text-slate-400 font-medium">
          © 2026 {branding.business_name}. All rights reserved.
        </p>
      </div>

      {/* RIGHT COLUMN — Hero Image Panel */}
      <div className="hidden lg:block lg:w-[58%] relative overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-blue-900/30 via-transparent to-blue-950/50 pointer-events-none" />
        <Image
          src={branding.login_bg_url || '/supermarket-hero.png'}
          alt={`Supermarket — ${branding.business_name}`}
          fill
          sizes="(min-width: 1024px) 58vw"
          className="object-cover"
          priority
        />
        <div className="absolute bottom-10 left-10 z-20 max-w-xs">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center space-x-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: branding.primary_color || '#2563EB' }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {branding.short_name || 'Enterprise'}
              </span>
            </div>
            <p className="text-sm font-bold text-white leading-snug">
              {branding.tagline || 'Unified supermarket management — inventory, POS, staff, reports and more.'}
            </p>
            <div className="mt-3 flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-300 font-bold">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
