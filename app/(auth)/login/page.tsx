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
    <div className="min-h-screen w-full bg-slate-950 flex flex-col lg:flex-row text-slate-100 font-sans">
      {/* Left Column: Platform Branding */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 lg:p-16 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-indigo-900/40">
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Patrick's Supermarket Platform</h1>
              <p className="text-xs font-medium text-indigo-400">Enterprise Supermarket Management System</p>
            </div>
          </div>
        </div>

        {/* Platform Hero Content */}
        <div className="relative z-10 my-12 lg:my-0 space-y-6 max-w-lg">
          <div className="inline-flex items-center space-x-2 bg-indigo-900/40 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Multi-Tenant Platform</span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            Enterprise Supermarket Platform
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Secure authentication gateway connecting platform owners, supermarket administrators, and staff to their dedicated portals.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs font-semibold text-slate-200">
            {[
              'Supabase Row Level Security',
              'Multi-Tenant Data Isolation',
              'High-Speed POS Register',
              'Inventory & Stock Control',
              'Real-Time Financial Reports',
              'Role-Based Access Control',
            ].map((feat, i) => (
              <div key={i} className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">Enterprise Auth Secured</span>
          </div>
          <span>Platform Version 2.5</span>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-950">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-950/20">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-600/15 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">Enter your credentials to access your portal</p>
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
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <Input
                  id="email-input"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
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
                <Link href="/forgot-password" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
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
                  className="pl-10 pr-10 bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
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
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                />
                <span>Remember Me</span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center space-x-2 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
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
