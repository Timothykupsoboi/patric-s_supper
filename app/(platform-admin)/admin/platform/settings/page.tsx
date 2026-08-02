'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Mail, MessageSquare, CreditCard, Shield, Globe } from 'lucide-react';

export default function PlatformSettingsPage() {
  const [platformName, setPlatformName] = useState("Patrick's Supermarket SaaS Enterprise");
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [emailHost, setEmailHost] = useState('smtp.sendgrid.net');
  const [supportEmail, setSupportEmail] = useState('support@patricksaas.com');
  const [smsProvider, setSmsProvider] = useState('AfricaStalking / Twilio SMS');
  const [gateways, setGateways] = useState(['Stripe Credit Card', 'M-Pesa STK Push Gateway', 'PayPal Enterprise']);
  const [defaultCurrency, setDefaultCurrency] = useState('KES');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            <span>Platform Global System Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure platform branding, email SMTP, SMS gateways, payment providers, currencies, and maintenance mode
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* 1. Branding & Name */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Platform Branding & General Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SaaS Platform Name"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white"
              required
            />
            <Input
              label="Primary Branding Accent Color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white font-mono"
              required
            />
          </div>
        </div>

        {/* 2. Email & Communications */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>Email SMTP & Communication Gateway</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SMTP Host / Email Provider"
              value={emailHost}
              onChange={(e) => setEmailHost(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white font-mono"
              required
            />
            <Input
              label="Platform Support Email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white"
              required
            />
          </div>
        </div>

        {/* 3. SMS & Payment Providers */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <span>SMS & Payment Gateways Configuration</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SMS Gateway Provider"
              value={smsProvider}
              onChange={(e) => setSmsProvider(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white"
              required
            />
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Base Platform Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
              >
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="USD">USD - United States Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Maintenance Mode Toggle */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Global Maintenance Mode</span>
          </h3>
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <p className="font-extrabold text-white">Toggle System Maintenance</p>
              <p className="text-[11px] text-slate-400">When enabled, non-owner users will see a maintenance notice message.</p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all border ${
                maintenanceMode
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}
            >
              {maintenanceMode ? 'Maintenance Mode ACTIVE' : 'System Operational'}
            </button>
          </div>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold rounded-xl text-center">
            ✓ Platform Settings Saved Successfully!
          </div>
        )}

        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-3 text-sm flex items-center justify-center space-x-2">
          <Save className="w-4 h-4" />
          <span>Save Platform Settings</span>
        </Button>
      </form>
    </div>
  );
}
