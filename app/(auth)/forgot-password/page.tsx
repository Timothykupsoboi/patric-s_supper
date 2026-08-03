'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { Store, Mail, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      toast.error('Validation Error', msg);
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(cleanEmail);
      setSubmitted(true);
      toast.success('Reset Link Sent', `Password recovery instructions sent to ${cleanEmail}`);
    } catch (err: any) {
      const msg = err.message || 'Password reset request failed. Please check the email and try again.';
      setError(msg);
      toast.error('Reset Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Decorative Glow Effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-400/30 shadow-lg shadow-blue-900/40">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Forgot Password</h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Enter your registered email address to receive a secure recovery link.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-5 relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-white">Reset Link Sent!</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Password recovery instructions have been sent to <strong className="text-white font-bold">{email}</strong>.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10" noValidate>
            {error && (
              <div className="p-3.5 bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold rounded-2xl flex items-start space-x-2 animate-in fade-in-50">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Input
              isFloating
              label="Registered Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              disabled={loading}
              autoFocus
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-extrabold"
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </Button>

            <div className="text-center pt-2 border-t border-slate-800/80">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
