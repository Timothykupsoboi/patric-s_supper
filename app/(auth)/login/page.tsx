'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import {
  ShoppingCart, Lock, Mail, Eye, EyeOff, ArrowRight,
  ShieldCheck, CheckCircle2, Store, Sparkles, AlertTriangle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─────────────────────────────────────────────────────────────────────────────
// ALL logic below is IDENTICAL to the original — only the JSX layout changed.
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { user, setUserProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError('Invalid email or password.');
      return;
    }

    if (!password || password.length < 1) {
      setError('Invalid email or password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth & validate profile & supermarket status
      const res = await authService.login(email.trim(), password);

      // 2. Set authenticated session profile & redirect based on credentials
      if (res.profile) {
        setUserProfile(res.profile);
        const targetPath = getRedirectPathByRole(res.profile.role);
        router.push(targetPath);
      } else {
        setError('Account profile not found. Please contact your administrator.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-white">

      {/* ══════════════════════════════════════════════════════════
          LEFT COLUMN (40%) — Branding + Login Form
      ══════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[42%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 py-12 bg-white relative z-10">

        {/* Logo / Brand */}
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-600 tracking-widest uppercase">Patrick's</p>
              <p className="text-sm font-black text-slate-800 leading-none tracking-tight">Supermarket Platform</p>
            </div>
          </div>

          <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Sign in to access your supermarket management portal.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-start space-x-2 animate-in fade-in-50">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Sign In Form ── */}
        <form onSubmit={handleLogin} className="space-y-4" noValidate>

          {/* Email */}
          <div>
            <label
              htmlFor="email-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                className="w-full pl-10 pr-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="password-input"
                className="text-xs font-bold text-slate-700"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-11 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
              className="text-xs text-slate-600 font-medium cursor-pointer select-none"
            >
              Remember me on this device
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
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
        <p className="mt-6 text-[11px] text-slate-400">
          © 2026 Patrick's Supermarket Platform. All rights reserved.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          RIGHT COLUMN (60%) — Hero Image Panel
          Hidden on mobile/tablet, visible lg+
      ══════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block lg:w-[58%] relative overflow-hidden">
        {/* Background gradient overlay on top of image */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-blue-900/30 via-transparent to-blue-950/50 pointer-events-none" />

        {/* Hero Image */}
        <Image
          src="/supermarket-hero.png"
          alt="Modern supermarket — Patrick's Supermarket Platform"
          fill
          sizes="(min-width: 1024px) 58vw"
          className="object-cover"
          priority
        />

        {/* Floating info card bottom-left */}
        <div className="absolute bottom-10 left-10 z-20 max-w-xs">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Enterprise Platform
              </span>
            </div>
            <p className="text-sm font-bold text-white leading-snug">
              Unified supermarket management — inventory, POS, staff, reports and more.
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
