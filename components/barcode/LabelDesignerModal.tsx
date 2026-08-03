'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { useBranding } from '@/context/BrandingContext';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Printer, Download, Eye, Layers, Copy, Check } from 'lucide-react';

interface LabelDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  productsList?: Product[];
}

export function LabelDesignerModal({ isOpen, onClose, product, productsList = [] }: LabelDesignerModalProps) {
  const { branding } = useBranding();

  const [labelPreset, setLabelPreset] = useState<'38x25' | '50x25' | '70x35' | 'custom'>('50x25');
  const [printQuantity, setPrintQuantity] = useState<number>(10);

  const [showLogo, setShowLogo] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showExpiry, setShowExpiry] = useState(false);
  const [showBatch, setShowBatch] = useState(false);

  if (!product && productsList.length === 0) return null;
  const targetProduct = product || productsList[0];

  const handlePrintLabels = () => {
    window.print();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Barcode Label Designer — ${targetProduct?.name || 'Product'}`} className="max-w-4xl font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Controls */}
        <div className="space-y-4 font-sans">
          <div className="p-3 bg-slate-50 border rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Label Format & Dimensions</h4>
            <Select
              isFloating
              label="Sticker Label Size Preset"
              value={labelPreset}
              onChange={(e) => setLabelPreset(e.target.value as any)}
              options={[
                { value: '38x25', label: 'Small Shelf Label (38mm x 25mm)' },
                { value: '50x25', label: 'Medium Standard Barcode (50mm x 25mm)' },
                { value: '70x35', label: 'Large Product Sticker (70mm x 35mm)' },
                { value: 'custom', label: 'Custom Printable Sheet' },
              ]}
            />
            <Input
              isFloating
              label="Print Copy Quantity (Sticker Sheets)"
              type="number"
              value={printQuantity}
              onChange={(e) => setPrintQuantity(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div className="p-3 bg-slate-50 border rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Label Content Fields</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
              {[
                { label: 'Supermarket Logo', state: showLogo, set: setShowLogo },
                { label: 'Product Name', state: showName, set: setShowName },
                { label: 'Selling Price', state: showPrice, set: setShowPrice },
                { label: 'SKU Reference', state: showSku, set: setShowSku },
                { label: 'Expiry Date', state: showExpiry, set: setShowExpiry },
                { label: 'Batch Number', state: showBatch, set: setShowBatch },
              ].map((item, idx) => (
                <label key={idx} className="flex items-center space-x-2 p-2 bg-white border rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => item.set(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button onClick={handlePrintLabels} variant="primary" size="lg" className="flex-1 bg-slate-900 hover:bg-slate-800">
              <Printer className="w-4 h-4 mr-2" /> Print {printQuantity} Labels
            </Button>
            <Button onClick={onClose} variant="outline" size="lg">
              Close
            </Button>
          </div>
        </div>

        {/* Right Side: Live Printable Label Sheet Preview */}
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-start max-h-[500px] overflow-y-auto custom-scrollbar">
          <div className="w-full flex justify-between items-center mb-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Sticker Sheet Live Preview ({printQuantity} Copies)</span>
            </span>
            <Badge variant="success">Print Ready</Badge>
          </div>

          <div id="printable-barcode-labels" className="grid grid-cols-2 gap-3 w-full">
            {[...Array(Math.min(6, printQuantity))].map((_, i) => (
              <div
                key={i}
                className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm text-center text-slate-900 font-mono flex flex-col justify-between"
                style={{
                  minHeight: labelPreset === '38x25' ? '90px' : labelPreset === '70x35' ? '140px' : '110px',
                }}
              >
                <div>
                  {showLogo && (branding.receipt_logo_url || branding.logo_url) && (
                    <img src={branding.receipt_logo_url || branding.logo_url} alt="Logo" className="w-6 h-6 object-contain mx-auto mb-0.5" />
                  )}
                  {showName && <p className="font-extrabold text-[10px] truncate">{targetProduct?.name}</p>}
                  {showPrice && <p className="font-black text-xs text-emerald-700">{formatCurrency(targetProduct?.selling_price || 0)}</p>}
                </div>

                <div className="my-1 text-center font-mono">
                  <div className="tracking-widest font-black text-xs text-slate-900 leading-none">|||| ||||| ||| |||</div>
                  <p className="text-[9px] font-bold text-slate-600 mt-0.5">{targetProduct?.barcode || '6001234567891'}</p>
                </div>

                <div className="text-[8px] text-slate-400 font-sans flex justify-between px-1">
                  {showSku && <span>SKU: {targetProduct?.sku || 'SKU-001'}</span>}
                  {showExpiry && <span>EXP: 2026-12-31</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
