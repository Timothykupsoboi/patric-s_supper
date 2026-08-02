'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { ShoppingCart, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, Store, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const { user, setUserProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleInfo, setRoleInfo] = useState<{ category: string; role: string } | null>(null);

  // Auto redirect if already authenticated
  useEffect(() => {
    if (user) {
      const category = authService.getRoleCategory(user.role);
      setRoleInfo({ category, role: user.role });
      const targetPath = getRedirectPathByRole(user.role);
      router.push(targetPath);
    }
  }, [user, router]);

  const getRedirectPathByRole = (role?: string): string => {
    if (!role) return '/dashboard';
    const category = authService.getRoleCategory(role as any);
    if (category === 'Platform Owner') {
      return '/admin/platform';
    }
    if (category === 'Supermarket Owner') {
      return '/dashboard';
    }
    // Employee roles routing:
    switch (role) {
      case 'cashier':
        return '/pos';
      case 'store_keeper':
      case 'inventory_manager':
        return '/inventory';
      case 'accountant':
        return '/reports';
      case 'procurement_officer':
        return '/suppliers';
      case 'customer_service':
        return '/customers';
      default:
        return '/dashboard';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRoleInfo(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }

    if (!password || password.length < 4) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Supabase Auth login
      const res = await authService.login(email, password);

      // 2. Determine user profile & role directly from database
      if (res.profile) {
        if (res.profile.is_active === false) {
          throw new Error('Your user account has been suspended by the administrator.');
        }

        const category = authService.getRoleCategory(res.profile.role);
        setRoleInfo({ category, role: res.profile.role });
        setUserProfile(res.profile);

        const targetPath = getRedirectPathByRole(res.profile.role);
        router.push(targetPath);
      } else {
        throw new Error('User profile not found in database. Please contact your system administrator.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please check your email and password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col lg:flex-row text-slate-100 font-sans">
      {/* Left Column: Branding / Supermarket Illustration */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-8 lg:p-16 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-emerald-900/40">
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30 border border-emerald-400/30">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">Patrick's Supermarket</h1>
              <p className="text-xs font-medium text-emerald-400">Enterprise Retail Management SaaS</p>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 my-12 lg:my-0 space-y-6 max-w-lg">
          <div className="inline-flex items-center space-x-2 bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cloud-Native Supermarket Platform</span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            Streamline Supermarket Operations at Enterprise Scale
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Multi-tenant architecture unifying high-speed POS registers, automated inventory reconciliation, store credit debtors ledger, and real-time financial reporting.
          </p>

          {/* Feature Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs font-semibold text-slate-200">
            {[
              'Real-Time POS & Barcode Scanner',
              'Multi-Branch & Store Scoping',
              'Automated Stock Movements',
              'Debtors & Credit Limits',
              'Subsecond Financial Reports',
              'Supabase Row Level Security',
            ].map((feat, i) => (
              <div key={i} className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-400">Supabase RLS Protected</span>
          </div>
          <span>Enterprise Edition v2.5</span>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-950">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-emerald-950/20">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-emerald-600/15 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
              <Store className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h2>
            <p className="text-xs text-slate-400 mt-1">Sign in to continue to Enterprise Retail Management System</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold rounded-2xl flex items-start space-x-2 animate-in fade-in-50">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5" htmlFor="email-input">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <Input
                  id="email-input"
                  type="email"
                  placeholder="staff@supermarket.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl focus:border-emerald-500 focus:ring-emerald-500 py-2.5"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-300" htmlFor="password-input">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <Input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl focus:border-emerald-500 focus:ring-emerald-500 py-2.5"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-400 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center space-x-2 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Supermarket Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-8">
            © 2026 Patrick's Supermarket Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
