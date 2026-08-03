'use client';

import React, { useState, useEffect } from 'react';
import { DocumentTemplate, DOCUMENT_TYPE_LABELS, DocumentType, PaperSize, FontFamily } from '@/services/templateService';
import { useBranding } from '@/context/BrandingContext';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Save, Eye, Palette, Layout, FileText, CheckCircle2, Sliders } from 'lucide-react';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: DocumentTemplate | null;
  onSave: (updated: Partial<DocumentTemplate>) => Promise<void>;
}

export function TemplateEditorModal({ isOpen, onClose, template, onSave }: TemplateEditorModalProps) {
  const { branding } = useBranding();

  const [activeTab, setActiveTab] = useState<'info' | 'layout' | 'colors' | 'messages' | 'elements'>('info');

  const [name, setName] = useState('');
  const [type, setType] = useState<DocumentType>('sales_receipt');
  const [paperSize, setPaperSize] = useState<PaperSize>('80mm');
  const [fontFamily, setFontFamily] = useState<FontFamily>('monospace');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [accentColor, setAccentColor] = useState('#10b981');

  const [showLogo, setShowLogo] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showStamp, setShowStamp] = useState(false);

  const [headerMessage, setHeaderMessage] = useState('');
  const [footerMessage, setFooterMessage] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [pinVatNumber, setPinVatNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setType(template.type);
      setPaperSize(template.paper_size);
      setFontFamily(template.font_family);
      setFontSize(template.font_size);
      setPrimaryColor(template.primary_color || '#0f172a');
      setAccentColor(template.accent_color || '#10b981');
      setShowLogo(template.show_logo);
      setShowQr(template.show_qr);
      setShowBarcode(template.show_barcode);
      setShowWatermark(template.show_watermark);
      setShowSignature(template.show_signature);
      setShowStamp(template.show_stamp);
      setHeaderMessage(template.header_message || '');
      setFooterMessage(template.footer_message || '');
      setThankYouMessage(template.thank_you_message || '');
      setReturnPolicy(template.return_policy || '');
      setPinVatNumber(template.pin_vat_number || '');
      setTaxNumber(template.tax_number || '');
    }
  }, [template]);

  if (!template) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        id: template.id,
        name,
        type,
        paper_size: paperSize,
        font_family: fontFamily,
        font_size: fontSize,
        primary_color: primaryColor,
        accent_color: accentColor,
        show_logo: showLogo,
        show_qr: showQr,
        show_barcode: showBarcode,
        show_watermark: showWatermark,
        show_signature: showSignature,
        show_stamp: showStamp,
        header_message: headerMessage,
        footer_message: footerMessage,
        thank_you_message: thankYouMessage,
        return_policy: returnPolicy,
        pin_vat_number: pinVatNumber,
        tax_number: taxNumber,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Template Editor — ${template.name}`} className="max-w-5xl">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
        {/* Left Side: Controls & Form */}
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex space-x-1 border-b pb-2 overflow-x-auto">
            {[
              { id: 'info', label: 'Basic Info', icon: FileText },
              { id: 'layout', label: 'Layout & Paper', icon: Layout },
              { id: 'colors', label: 'Branding & Colors', icon: Palette },
              { id: 'messages', label: 'Custom Text', icon: Sliders },
              { id: 'elements', label: 'Toggles & Stamps', icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    isActive ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'info' && (
            <div className="space-y-3">
              <Input isFloating label="Template Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Select
                isFloating
                label="Document Type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                options={Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                disabled={template.is_system}
              />
              <Input isFloating label="KRA PIN / VAT Registration Number" value={pinVatNumber} onChange={(e) => setPinVatNumber(e.target.value)} />
              <Input isFloating label="Tax Number / ETR Serial" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-3">
              <Select
                isFloating
                label="Paper Size Format"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as any)}
                options={[
                  { value: '80mm', label: '80mm Thermal Receipt Paper' },
                  { value: '58mm', label: '58mm Mini Thermal Receipt Paper' },
                  { value: 'A4', label: 'A4 Full Page Document' },
                ]}
              />
              <Select
                isFloating
                label="Typography Font Family"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as any)}
                options={[
                  { value: 'monospace', label: 'Monospace (Receipt Printer Default)' },
                  { value: 'sans-serif', label: 'Sans-Serif (Modern Clean)' },
                  { value: 'serif', label: 'Serif (Formal Invoice)' },
                ]}
              />
              <Select
                isFloating
                label="Base Font Size"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as any)}
                options={[
                  { value: 'small', label: 'Small (11px)' },
                  { value: 'medium', label: 'Medium (12px Standard)' },
                  { value: 'large', label: 'Large (14px Readable)' },
                ]}
              />
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border cursor-pointer"
                  />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Accent Highlight Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border cursor-pointer"
                  />
                  <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-3">
              <Input isFloating label="Header Greeting Message" value={headerMessage} onChange={(e) => setHeaderMessage(e.target.value)} />
              <Input isFloating label="Thank You Message" value={thankYouMessage} onChange={(e) => setThankYouMessage(e.target.value)} />
              <Input isFloating label="Return Policy Note" value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} />
              <Input isFloating label="Footer Note" value={footerMessage} onChange={(e) => setFooterMessage(e.target.value)} />
            </div>
          )}

          {activeTab === 'elements' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {[
                { label: 'Business Logo', state: showLogo, set: setShowLogo },
                { label: 'QR Verification Code', state: showQr, set: setShowQr },
                { label: 'Barcode Stamp', state: showBarcode, set: setShowBarcode },
                { label: 'Watermark Background', state: showWatermark, set: setShowWatermark },
                { label: 'Signature Area', state: showSignature, set: setShowSignature },
                { label: 'Official Stamp Area', state: showStamp, set: setShowStamp },
              ].map((item, idx) => (
                <label key={idx} className="flex items-center space-x-2 p-3 bg-slate-50 border rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => item.set(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-800">{item.label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              <Save className="w-4 h-4 mr-1.5" /> Save Template
            </Button>
          </div>
        </div>

        {/* Right Side: Realtime Live Preview Panel */}
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-start max-h-[500px] overflow-y-auto custom-scrollbar">
          <div className="w-full flex justify-between items-center mb-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Realtime Live Preview ({paperSize})</span>
            </span>
            <Badge variant="success">Live Updating</Badge>
          </div>

          <div
            className="bg-white shadow-xl rounded-xl p-5 border border-slate-300 relative text-slate-900 text-xs transition-all w-full"
            style={{
              maxWidth: paperSize === '58mm' ? '240px' : paperSize === '80mm' ? '300px' : '420px',
              fontFamily: fontFamily === 'monospace' ? 'Courier New, monospace' : fontFamily === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif',
              fontSize: fontSize === 'small' ? '10px' : fontSize === 'large' ? '13px' : '11px',
            }}
          >
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none">
                <span className="text-4xl font-black uppercase rotate-[-30deg] tracking-widest">{type.replace('_', ' ')}</span>
              </div>
            )}

            <div className="text-center border-b pb-3 mb-3 space-y-1">
              {showLogo && (branding.logo_url || branding.receipt_logo_url) && (
                <img src={branding.receipt_logo_url || branding.logo_url} alt="Logo" className="w-10 h-10 object-contain mx-auto mb-1" />
              )}
              <h3 className="font-black text-sm uppercase" style={{ color: primaryColor }}>{branding.business_name || 'Nairobi Supermarket'}</h3>
              <p className="text-[10px] text-slate-500">{branding.address || 'CBD Outlet Main'}</p>
              {pinVatNumber && <p className="text-[9px] text-slate-400 font-mono">PIN: {pinVatNumber}</p>}
              {headerMessage && <p className="text-[10px] text-slate-700 italic border-t pt-1 mt-1">{headerMessage}</p>}
            </div>

            <div className="p-2 rounded text-center font-black uppercase text-[10px] mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              {DOCUMENT_TYPE_LABELS[type]}
            </div>

            <div className="space-y-1 my-3 text-[10px] border-t border-b py-2">
              <div className="flex justify-between"><span className="font-bold">2x Kenyan Sugar 2Kg</span><span>KES 520.00</span></div>
              <div className="flex justify-between"><span className="font-bold">1x Cooking Oil 3L</span><span>KES 850.00</span></div>
              <div className="flex justify-between font-black text-xs pt-1 border-t mt-1" style={{ color: accentColor }}>
                <span>TOTAL:</span><span>KES 1,370.00</span>
              </div>
            </div>

            {(showQr || showBarcode) && (
              <div className="flex items-center justify-between border-t border-b border-dashed py-2 my-2 text-[9px] font-mono">
                {showQr && <div className="p-1 bg-slate-900 text-white rounded">QR</div>}
                {showBarcode && <div>|||| ||| ||||| |||</div>}
              </div>
            )}

            {(showSignature || showStamp) && (
              <div className="grid grid-cols-2 gap-2 my-3 text-[9px]">
                {showSignature && <div className="border-t pt-1 text-center font-bold">Signature</div>}
                {showStamp && <div className="border border-dashed p-1.5 text-center font-bold text-slate-400">Stamp</div>}
              </div>
            )}

            <div className="text-center text-[9px] text-slate-500 space-y-0.5 pt-2 border-t">
              {thankYouMessage && <p className="font-bold">{thankYouMessage}</p>}
              {returnPolicy && <p className="italic">{returnPolicy}</p>}
              {footerMessage && <p>{footerMessage}</p>}
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
