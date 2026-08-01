'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { Store, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Forgot Password</h1>
          <p className="text-sm text-slate-400 mt-1">Enter your registered email to receive a recovery link.</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm text-slate-300">
              Password reset link sent to <strong className="text-white">{email}</strong>. Please check your inbox.
            </p>
            <Link href="/login" className="inline-flex items-center text-xs font-bold text-blue-400 hover:underline pt-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                <Input
                  type="email"
                  placeholder="cashier@supermarket.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  required
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}

            <Button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold" disabled={loading}>
              {loading ? 'Sending Request...' : 'Send Reset Link'}
            </Button>

            <div className="text-center pt-2">
              <Link href="/login" className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
