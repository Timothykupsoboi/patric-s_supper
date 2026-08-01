'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, Save, Printer } from 'lucide-react';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('NAIROBI SUPERMARKET');
  const [phone, setPhone] = useState('+254 700 000 000');
  const [address, setAddress] = useState('Main Branch, Nairobi CBD');
  const [taxRate, setTaxRate] = useState('16');
  const [currency, setCurrency] = useState('KES');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Business Profile & System Settings</h1>
        <p className="text-xs text-gray-500">Configure supermarket branding, thermal receipt header, tax rate, and currency</p>
      </div>

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
            <CardTitle>Taxation & Currency Rules</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Default VAT Tax Rate (%)" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} required />
            <Input label="Base Currency Symbol" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
          </div>
        </Card>

        <div className="flex items-center space-x-3">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold px-6 py-2.5">
            <Save className="w-4 h-4 mr-2" />
            Save Business Settings
          </Button>
          {saved && <span className="text-xs text-emerald-600 font-bold">Settings saved successfully!</span>}
        </div>
      </form>
    </div>
  );
}
