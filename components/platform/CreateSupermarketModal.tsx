'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { platformAdminService, CreateSupermarketPayload } from '@/services/platformAdminService';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, UserCheck, MapPin, Globe, CreditCard, Building, AlertCircle, Loader2 } from 'lucide-react';

interface CreateSupermarketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSupermarketModal({ isOpen, onClose }: CreateSupermarketModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [currency, setCurrency] = useState('KES');
  const [timezone, setTimezone] = useState('Africa/Nairobi');
  const [address, setAddress] = useState('');
  const [plan, setPlan] = useState('starter');
  const [trialDays, setTrialDays] = useState('14');
  const [logoUrl, setLogoUrl] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('Main Branch');

  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: CreateSupermarketPayload) =>
      platformAdminService.createSupermarketTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformSupermarketsList'] });
      queryClient.invalidateQueries({ queryKey: ['platformMetrics'] });
      setSuccessMessage('✓ Supermarket created successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
        // Reset form
        setName('');
        setRegNumber('');
        setOwnerName('');
        setOwnerEmail('');
        setOwnerPhone('');
        setAddress('');
        setLogoUrl('');
        setValidationError('');
      }, 1500);
    },
    onError: (err: any) => {
      setValidationError(err.message || 'Failed to create supermarket. Please verify credentials.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Supermarket Business Name is required.');
      return;
    }
    if (!ownerName.trim()) {
      setValidationError('Supermarket Owner Full Name is required.');
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      setValidationError('A valid Owner Email Address is required.');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      registration_number: regNumber.trim(),
      owner_name: ownerName.trim(),
      owner_email: ownerEmail.trim(),
      owner_phone: ownerPhone.trim(),
      country,
      currency,
      timezone,
      business_address: address.trim(),
      subscription_plan: plan,
      trial_period_days: parseInt(trialDays) || 14,
      logo_url: logoUrl.trim(),
      default_branch_name: defaultBranch.trim() || 'Main Branch',
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Supermarket Tenant"
      className="max-w-2xl bg-slate-900 border-slate-800 text-white max-h-[90vh] flex flex-col"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 text-xs">
        {/* Top Banners */}
        {validationError && (
          <div className="flex-none p-3 mb-3 bg-red-950/80 border border-red-800 text-red-300 font-bold rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{validationError}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex-none p-3 mb-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold rounded-xl flex items-center space-x-2">
            <Store className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1 text-xs touch-pan-y">
          {/* Section 1: Supermarket Organization */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <p className="font-extrabold text-white flex items-center space-x-2">
              <Store className="w-4 h-4 text-indigo-400" />
              <span>1. Organization Details</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Supermarket Business Name *"
                placeholder="e.g. Westlands Fresh Mart"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white"
                required
              />
              <Input
                label="Business Registration # (Optional)"
                placeholder="e.g. REG-2026-994"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Default Branch Name *"
                placeholder="e.g. Main Branch"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white"
                required
              />
              <Input
                label="Supermarket Logo URL (Optional)"
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white"
              />
            </div>

            <Input
              label="Headquarters Business Address"
              placeholder="e.g. Westlands Road, Nairobi"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>

          {/* Section 2: Owner Information */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <p className="font-extrabold text-white flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>2. Supermarket Owner Account Credentials</span>
            </p>

            <Input
              label="Owner Full Name *"
              placeholder="e.g. Patrick Kamau"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="bg-slate-900 border-slate-800 text-white"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Owner Email Address *"
                type="email"
                placeholder="owner@supermarket.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white"
                required
              />
              <Input
                label="Owner Phone Number"
                placeholder="+254 700 000 000"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white"
              />
            </div>
          </div>

          {/* Section 3: Subscription & Localization */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <p className="font-extrabold text-white flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>3. Subscription Plan & Regional Localization</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subscription Plan Tier</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="free_trial">Free Trial Plan</option>
                  <option value="starter">Starter Plan (Up to 2 Branches)</option>
                  <option value="professional">Professional Plan (Up to 10 Branches)</option>
                  <option value="enterprise">Enterprise Plan (Unlimited Branches)</option>
                </select>
              </div>

              <Input
                label="Trial Duration (Days)"
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white"
              />
              <Input
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white font-mono"
              />
              <Input
                label="Time Zone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Fixed Footer Action Buttons */}
        <div className="flex-none pt-4 mt-3 border-t border-slate-800 flex space-x-3 bg-slate-900 sticky bottom-0 z-10">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-slate-900 border-slate-800 text-slate-300 hover:text-white font-bold py-2.5"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold py-2.5 text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/40"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                <span>Creating Supermarket...</span>
              </>
            ) : (
              <span>Create Supermarket</span>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
