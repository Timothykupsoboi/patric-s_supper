'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { authService } from '@/services/authService';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Listen for recovery event or check active session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasValidSession(true);
      }
      setVerifyingSession(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasValidSession(true);
      }
      setVerifyingSession(false);
    }).catch(() => {
      setVerifyingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setError(msg);
      toast.error('Validation Error', msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setError(msg);
      toast.error('Validation Error', msg);
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(password);
      setSuccess(true);
      toast.success('Password Updated', 'Your account password was updated successfully.');
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 2000);
    } catch (err: any) {
      const msg = err.message || 'Password update failed. Please request a new reset link.';
      setError(msg);
      toast.error('Update Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  if (verifyingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
        <div className="flex items-center space-x-3 bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800 shadow-xl">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-xs font-bold tracking-wide">Verifying Recovery Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Decorative Glow Effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-400/30 shadow-lg shadow-blue-900/40">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Enter your new account password below to update your credentials.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-white">Password Updated Successfully!</h3>
            <p className="text-xs text-slate-300 font-medium">
              Your password has been updated. Redirecting to login page...
            </p>
          </div>
        ) : !hasValidSession ? (
          <div className="text-center space-y-4 relative z-10 animate-in fade-in">
            <div className="w-14 h-14 bg-red-950/80 border border-red-800 text-red-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-950">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-extrabold text-white">Invalid or Expired Link</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              This password recovery link is missing, invalid, or has expired. Please request a new password reset link.
            </p>
            <div className="pt-2">
              <Link
                href="/forgot-password"
                className="inline-flex items-center text-xs font-bold text-blue-400 hover:underline"
              >
                Request New Reset Link
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 relative z-10" noValidate>
            {error && (
              <div className="p-3.5 bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold rounded-2xl flex items-start space-x-2 animate-in fade-in-50">
                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* New Password */}
            <div className="relative">
              <Input
                isFloating
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                disabled={loading}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors cursor-pointer z-20"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <Input
              isFloating
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-extrabold mt-2"
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>

            <div className="text-center pt-2 border-t border-slate-800/80">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
