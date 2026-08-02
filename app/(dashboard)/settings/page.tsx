'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingService } from '@/services/settingService';
import { employeeService } from '@/services/employeeService';
import { authService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, AlertCircle, Sparkles, UserCheck, Store, Lock, Camera } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'store'>('profile');

  // Personal Profile State
  const [fullName, setFullName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Store Settings State
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('KES');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setUserPhone(user.phone || '');
      setPhotoUrl(user.photo_url || '');
    }
  }, [user]);

  const { data: supermarket, isLoading } = useQuery({
    queryKey: ['settings', user?.supermarket_id],
    queryFn: () => settingService.getSettings(user?.supermarket_id),
  });

  useEffect(() => {
    if (supermarket) {
      setStoreName(supermarket.name || '');
      setStorePhone(supermarket.phone || '');
      setAddress(supermarket.address || '');
      setCurrency(supermarket.currency || 'KES');
    }
  }, [supermarket]);

  // Update Personal Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      // 1. Update database user profile
      await employeeService.updateEmployee(user.id, {
        name: fullName,
        phone: userPhone,
        photo_url: photoUrl || undefined,
      });

      // 2. Update Password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await authService.resetPassword(newPassword);
      }
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setErrorMessage(null);
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Personal profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to update personal profile.');
    },
  });

  // Update Store Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (updates: any) => settingService.updateSettings(user?.supermarket_id || '', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setErrorMessage(null);
      setSuccessMessage('Business store settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to save store settings.');
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      name: storeName,
      phone: storePhone,
      address,
      currency,
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Account & System Settings</h1>
        <p className="text-xs text-gray-500">Manage personal user profile credentials and supermarket business settings</p>
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

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Edit Personal Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'store'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Store Business Profile</span>
        </button>
      </div>

      {/* Tab 1: Personal Profile Editing */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal User Credentials</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Email Address (Login ID)" value={user?.email || ''} disabled readOnly />
                <Input label="Telephone Contact" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="+254 7..." />
              </div>

              <Input label="Profile Avatar Image URL" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Security Password</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Security Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
              />
            </div>
          </Card>

          <Button type="submit" disabled={updateProfileMutation.isPending} className="bg-blue-600 hover:bg-blue-700 font-bold px-6 py-2.5">
            <Save className="w-4 h-4 mr-2" />
            {updateProfileMutation.isPending ? 'Updating Profile...' : 'Save Personal Profile'}
          </Button>
        </form>
      )}

      {/* Tab 2: Store Business Settings */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStore} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supermarket Store Profile</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <Input label="Store Name (Receipt Header)" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Business Telephone" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} required />
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

          <Button type="submit" disabled={updateSettingsMutation.isPending || isLoading} className="bg-blue-600 hover:bg-blue-700 font-bold px-6 py-2.5">
            <Save className="w-4 h-4 mr-2" />
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Business Settings'}
          </Button>
        </form>
      )}
    </div>
  );
}
