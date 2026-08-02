'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingService } from '@/services/settingService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, AlertCircle, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: supermarket, isLoading } = useQuery({
    queryKey: ['settings', user?.supermarket_id],
    queryFn: () => settingService.getSettings(user?.supermarket_id),
  });

  useEffect(() => {
    if (supermarket) {
      setStoreName(supermarket.name || '');
      setPhone(supermarket.phone || '');
      setAddress(supermarket.address || '');
      setCurrency(supermarket.currency || 'KES');
    }
  }, [supermarket]);

  const updateSettingsMutation = useMutation({
    mutationFn: (updates: any) => settingService.updateSettings(user?.supermarket_id || '', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setErrorMessage(null);
      setSuccessMessage('Business settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to save settings.');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      name: storeName,
      phone,
      address,
      currency,
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Business Profile & System Settings</h1>
        <p className="text-xs text-gray-500">Configure supermarket branding, thermal receipt header, and currency</p>
      </div>

      {successMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-md">
          <Sparkles className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-md">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Supermarket Store Profile</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input label="Store Name (Receipt Header)" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Business Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <Input label="Physical Address / Location" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency & Regional Settings</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Currency Symbol" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
          </div>
        </Card>

        <div className="flex items-center space-x-3">
          <Button type="submit" disabled={updateSettingsMutation.isPending || isLoading} className="bg-blue-600 hover:bg-blue-700 font-bold px-6 py-2.5">
            <Save className="w-4 h-4 mr-2" />
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Business Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
