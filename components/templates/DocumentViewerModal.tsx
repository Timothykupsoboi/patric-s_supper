'use client';

import React from 'react';
import { DocumentTemplate, DOCUMENT_TYPE_LABELS } from '@/services/templateService';
import { useBranding } from '@/context/BrandingContext';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer, Download, Share2, Mail, MessageSquare, CheckCircle, FileText, Check } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: DocumentTemplate | null;
  customData?: any;
}

export function DocumentViewerModal({ isOpen, onClose, template, customData }: DocumentViewerModalProps) {
  const { branding } = useBranding();

  if (!template) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Official ${DOCUMENT_TYPE_LABELS[template.type]} from ${branding.business_name || 'Nairobi Supermarket'}.\nDocument Ref: #DOC-${Date.now().toString().slice(-6)}\nAmount: KES 14,500.00`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${DOCUMENT_TYPE_LABELS[template.type]} - ${branding.business_name || 'Supermarket'}`);
    const body = encodeURIComponent(
      `Dear Customer,\n\nPlease find attached your official ${DOCUMENT_TYPE_LABELS[template.type]}.\n\nThank you for doing business with us!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const isThermal = template.paper_size === '58mm' || template.paper_size === '80mm';

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Document Preview — ${template.name}`} className="max-w-4xl">
      <div className="space-y-4 font-sans">
        {/* Export Suite Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <span className="bg-slate-200 px-2 py-0.5 rounded-md uppercase font-mono text-[10px]">{template.paper_size}</span>
            <span>{DOCUMENT_TYPE_LABELS[template.type]}</span>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handlePrint} variant="primary" size="sm" className="bg-slate-900 hover:bg-slate-800">
              <Printer className="w-3.5 h-3.5 mr-1" /> Print
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
            </Button>
            <Button onClick={handleWhatsAppShare} variant="outline" size="sm" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">
              <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" /> WhatsApp
            </Button>
            <Button onClick={handleEmailShare} variant="outline" size="sm" className="text-blue-700 border-blue-300 hover:bg-blue-50">
              <Mail className="w-3.5 h-3.5 mr-1 text-blue-600" /> Email
            </Button>
          </div>
        </div>

        {/* Document Rendering Frame */}
        <div className="bg-slate-200/60 p-6 rounded-2xl flex justify-center overflow-x-auto min-h-[420px]">
          <div
            id="printable-template-doc"
            className="bg-white shadow-xl rounded-xl p-6 border border-slate-300 relative text-slate-900 transition-all"
            style={{
              width: template.paper_size === '58mm' ? '240px' : template.paper_size === '80mm' ? '320px' : '680px',
              fontFamily: template.font_family === 'monospace' ? 'Courier New, monospace' : template.font_family === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif',
              fontSize: template.font_size === 'small' ? '11px' : template.font_size === 'large' ? '14px' : '12px',
            }}
          >
            {/* Watermark Background Overlay */}
            {template.show_watermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none">
                <span className="text-6xl font-black uppercase rotate-[-30deg] tracking-widest text-slate-900">
                  {template.type.replace('_', ' ')}
                </span>
              </div>
            )}

            {/* Header Section */}
            <div className="text-center border-b pb-4 mb-4 space-y-1">
              {template.show_logo && (branding.logo_url || branding.receipt_logo_url) && (
                <img src={branding.receipt_logo_url || branding.logo_url} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-1" />
              )}

              <h2 className="font-black text-base uppercase tracking-tight" style={{ color: template.primary_color }}>
                {branding.business_name || 'Nairobi Supermarket CBD'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">{branding.address || 'Main Branch, Kimathi Street, Nairobi'}</p>
              <p className="text-[11px] text-slate-500 font-medium">TEL: {branding.phone || '+254 700 000 000'} | {branding.email || 'info@nairobisuper.co.ke'}</p>
              {template.pin_vat_number && <p className="text-[10px] text-slate-400 font-mono">KRA PIN: {template.pin_vat_number} | VAT REG: {template.tax_number}</p>}

              {template.header_message && (
                <p className="text-xs font-bold pt-1 text-slate-700 italic border-t border-dashed mt-2">{template.header_message}</p>
              )}
            </div>

            {/* Document Title Banner */}
            <div className="p-2.5 rounded-lg text-center font-black uppercase text-xs tracking-wider mb-4" style={{ backgroundColor: `${template.primary_color}15`, color: template.primary_color }}>
              {DOCUMENT_TYPE_LABELS[template.type]}
            </div>

            {/* Metadata Rows */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-4 pb-3 border-b border-dashed">
              <div>
                <p><span className="font-bold text-slate-900">Ref #:</span> DOC-2026-88192</p>
                <p><span className="font-bold text-slate-900">Date:</span> {new Date().toLocaleDateString()}</p>
                {template.type === 'quotation' && <p><span className="font-bold text-slate-900">Valid Until:</span> {new Date(Date.now() + 30 * 86400000).toLocaleDateString()}</p>}
              </div>
              <div className="text-right">
                <p><span className="font-bold text-slate-900">Cashier:</span> Jane Mwangi</p>
                <p><span className="font-bold text-slate-900">Branch:</span> CBD Main Outlet</p>
              </div>
            </div>

            {/* Sample Table Items */}
            <table className="w-full text-[11px] mb-4 border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-left font-black">
                  <th className="py-1">Description</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-1.5 font-bold">Kenyan Premium Sugar 2Kg</td>
                  <td className="py-1.5 text-center">2</td>
                  <td className="py-1.5 text-right">{formatCurrency(260)}</td>
                  <td className="py-1.5 text-right font-bold">{formatCurrency(520)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Fresh Dairy Milk 1L</td>
                  <td className="py-1.5 text-center">3</td>
                  <td className="py-1.5 text-right">{formatCurrency(120)}</td>
                  <td className="py-1.5 text-right font-bold">{formatCurrency(360)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Refined Cooking Oil 3L</td>
                  <td className="py-1.5 text-center">1</td>
                  <td className="py-1.5 text-right">{formatCurrency(850)}</td>
                  <td className="py-1.5 text-right font-bold">{formatCurrency(850)}</td>
                </tr>
              </tbody>
            </table>

            {/* Total Calculations */}
            <div className="space-y-1 text-right border-t border-slate-900 pt-2 mb-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-bold">{formatCurrency(1730)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-red-600 font-bold">
                <span>Discount:</span>
                <span>-{formatCurrency(100)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>VAT (16%):</span>
                <span>{formatCurrency(224.83)}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300" style={{ color: template.accent_color }}>
                <span>TOTAL PAYABLE:</span>
                <span>{formatCurrency(1630)}</span>
              </div>
            </div>

            {/* Barcode & QR Code Section */}
            <div className="flex items-center justify-between border-t border-b border-dashed py-3 my-4">
              {template.show_qr ? (
                <div className="w-16 h-16 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[9px] font-mono font-black text-center p-1">
                  QR VERIFY
                </div>
              ) : <div />}

              {template.show_barcode ? (
                <div className="text-center font-mono text-[10px] space-y-0.5">
                  <div className="tracking-widest font-black text-base">||| | |||| | ||||| |</div>
                  <span>DOC-99182374</span>
                </div>
              ) : <div />}
            </div>

            {/* Signature & Stamp Areas */}
            {(template.show_signature || template.show_stamp) && (
              <div className="grid grid-cols-2 gap-4 my-6 text-[10px]">
                {template.show_signature && (
                  <div className="border-t border-slate-400 pt-1 text-center font-bold text-slate-600">
                    Authorized Signature
                  </div>
                )}
                {template.show_stamp && (
                  <div className="border border-dashed border-slate-400 p-3 rounded-lg text-center font-bold text-slate-400">
                    Official Stamp
                  </div>
                )}
              </div>
            )}

            {/* Footer Messages */}
            <div className="text-center text-[10px] text-slate-500 space-y-1 pt-2 border-t border-slate-200">
              {template.thank_you_message && <p className="font-bold text-slate-800">{template.thank_you_message}</p>}
              {template.return_policy && <p className="italic">{template.return_policy}</p>}
              {template.footer_message && <p>{template.footer_message}</p>}
              {template.social_links && <p className="font-mono text-slate-400">{template.social_links}</p>}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
