'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingService } from '@/services/settingService';
import { employeeService } from '@/services/employeeService';
import { authService } from '@/services/authService';
import { storageService } from '@/services/storageService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Save, AlertCircle, Sparkles, UserCheck, Store, Lock, Timer,
  Upload, X, Camera, Loader2, CheckCircle2,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Avatar Uploader Component ───────────────────────────────────────────────

interface AvatarUploaderProps {
  currentUrl: string;
  userName: string;
  userId: string;
  onUploaded: (url: string) => void;
}

function AvatarUploader({ currentUrl, userName, userId, onUploaded }: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Keep preview in sync when the profile refreshes
  useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and WEBP images are allowed.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File too large. Maximum size is 5 MB (selected: ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploadSuccess(false);

      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      // Immediate local preview
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      setUploading(true);
      setProgress(10);

      try {
        // Simulate progress steps
        const progressTimer = setInterval(() => {
          setProgress((p) => Math.min(p + 15, 85));
        }, 200);

        const uploadedUrl = await storageService.uploadProfilePhoto(file, userId);

        clearInterval(progressTimer);
        setProgress(100);

        onUploaded(uploadedUrl);
        setPreview(uploadedUrl);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (err: any) {
        setUploadError(err.message || 'Upload failed. Please try again.');
        setPreview(currentUrl); // revert on error
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 800);
      }
    },
    [userId, currentUrl, onUploaded]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be picked again
    e.target.value = '';
  };

  const handleRemove = () => {
    setPreview('');
    onUploaded('');
    setUploadError(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-extrabold text-slate-700">Profile Photo</label>

      <div className="flex items-start space-x-5">
        {/* Avatar Preview Circle */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-24 h-24 rounded-full overflow-hidden border-2 transition-all ${
              dragging ? 'border-blue-500 scale-105' : 'border-slate-200'
            } bg-slate-100 flex items-center justify-center`}
            onDragEnter={() => setDragging(true)}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <img
                src={preview}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-black text-slate-400">{initials}</span>
            )}

            {/* Overlay while uploading */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
                <span className="text-white text-[10px] font-bold mt-1">{progress}%</span>
              </div>
            )}

            {/* Success flash */}
            {uploadSuccess && !uploading && (
              <div className="absolute inset-0 bg-emerald-600/80 rounded-full flex items-center justify-center animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Camera icon shortcut */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md border-2 border-white transition-colors disabled:opacity-50"
            title="Change photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Controls + Info */}
        <div className="flex-1 space-y-2 pt-1">
          {/* Drag-and-drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              dragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={() => setDragging(true)}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-600">
              {dragging ? 'Drop to upload' : 'Click or drag-and-drop'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP — max 5 MB</p>
          </div>

          {/* Progress bar */}
          {uploading && progress > 0 && (
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-1.5 text-xs font-extrabold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload className="w-3 h-3" />
              <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
            </button>

            {preview && !uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center space-x-1.5 text-xs font-extrabold px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Error message */}
          {uploadError && (
            <div className="flex items-start space-x-1.5 text-xs text-red-600 font-bold bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Success message */}
          {uploadSuccess && (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Photo uploaded successfully!</span>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user, refreshProfile, autoLockTimeoutMinutes, updateAutoLockTimeout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'terminal'>('profile');

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
      // photo_url is not stored in the DB — load from localStorage
      const stored = typeof window !== 'undefined'
        ? localStorage.getItem(`profile_photo_${user.id}`) || ''
        : '';
      setPhotoUrl(stored);
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

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      // photo_url does NOT exist in the users DB table — it is stored in localStorage.
      // Only pass DB-safe fields to updateEmployee.
      await employeeService.updateEmployee(user.id, {
        name: fullName,
        phone: userPhone,
      });

      // Persist photo URL to localStorage so it survives refresh
      if (typeof window !== 'undefined') {
        if (photoUrl) {
          localStorage.setItem(`profile_photo_${user.id}`, photoUrl);
        } else {
          localStorage.removeItem(`profile_photo_${user.id}`);
        }
      }

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
    updateSettingsMutation.mutate({ name: storeName, phone: storePhone, address, currency });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Account &amp; System Settings</h1>
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
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
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

        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'terminal'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Terminal Security</span>
        </button>
      </div>

      {/* ── Tab 1: Personal Profile ── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal User Credentials</CardTitle>
            </CardHeader>
            <div className="space-y-5 p-1">
              {/* Profile Photo Uploader */}
              {user && (
                <AvatarUploader
                  currentUrl={photoUrl}
                  userName={fullName || user.name}
                  userId={user.id}
                  onUploaded={(url) => {
                    setPhotoUrl(url);
                    // photo_url is NOT in the DB — persist to localStorage, then refresh context
                    if (typeof window !== 'undefined') {
                      if (url) {
                        localStorage.setItem(`profile_photo_${user.id}`, url);
                      } else {
                        localStorage.removeItem(`profile_photo_${user.id}`);
                      }
                    }
                    refreshProfile();
                  }}
                />
              )}

              <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Email Address (Login ID)" value={user?.email || ''} disabled readOnly />
                <Input label="Telephone Contact" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="+254 7..." />
              </div>
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

      {/* ── Tab 2: Store Business Settings ── */}
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
              <CardTitle>Currency &amp; Regional Settings</CardTitle>
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

      {/* ── Tab 3: Terminal Security ── */}
      {activeTab === 'terminal' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Lock Inactivity Timeout</CardTitle>
            </CardHeader>
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-500">
                The terminal automatically locks after a period of inactivity. The user must re-enter their 4-digit PIN to resume.
                The Supabase session remains active — only the terminal screen is locked.
              </p>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-2">
                  <Timer className="w-4 h-4 inline mr-1.5" />
                  Inactivity Timeout Duration
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: '5 Minutes', value: 5 },
                    { label: '10 Minutes (Default)', value: 10 },
                    { label: '15 Minutes', value: 15 },
                    { label: '30 Minutes', value: 30 },
                    { label: '60 Minutes', value: 60 },
                    { label: 'Never (Disabled)', value: 0 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateAutoLockTimeout(opt.value)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                        autoLockTimeoutMinutes === opt.value
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400 mt-3">
                  Current setting:{' '}
                  <strong className="text-slate-700">
                    {autoLockTimeoutMinutes === 0
                      ? 'Never (Auto-lock disabled)'
                      : `${autoLockTimeoutMinutes} minutes of inactivity`}
                  </strong>
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Counts as Activity</CardTitle>
            </CardHeader>
            <div className="p-4">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                {[
                  'Mouse movement',
                  'Mouse click or button press',
                  'Touch screen interaction',
                  'Keyboard key press',
                  'Barcode scanner input',
                  'Completing a sale',
                  'Creating or editing data',
                  'Scrolling the page',
                ].map((item) => (
                  <li key={item} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
