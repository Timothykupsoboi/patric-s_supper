'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { Store, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const { setUserProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getRedirectPathByRole = (role?: string): string => {
    switch (role) {
      case 'platform_owner':
      case 'platform_admin':
      case 'super_admin':
        return '/admin/platform';
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
      case 'owner':
      case 'branch_manager':
      case 'manager':
      case 'sales_manager':
      default:
        return '/dashboard';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authService.login(email, password);
      if (res.profile) {
        setUserProfile(res.profile);
        const targetPath = getRedirectPathByRole(res.profile.role);
        router.push(targetPath);
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">ANTIGRAVITY POS</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise Supermarket SaaS Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
              <Input
                type="email"
                placeholder="staff@supermarket.co.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-xs"
                required
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400 text-center font-bold">{error}</p>}

          <Button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold text-xs" disabled={loading}>
            {loading ? 'Authenticating Credentials...' : 'Sign In to Enterprise Workspace'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Supabase RLS Protected</span>
          </div>
          <span>Automatic RBAC Routing</span>
        </div>
      </div>
    </div>
  );
}
