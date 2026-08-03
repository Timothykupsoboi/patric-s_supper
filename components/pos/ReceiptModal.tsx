'use client';

import React, { useState, useEffect } from 'react';
import { Sale } from '@/types';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer, CheckCircle, Receipt, ArrowRight, Share2, Download, MessageSquare, Mail } from 'lucide-react';
import { printService } from '@/services/printService';
import { useBranding } from '@/context/BrandingContext';
import { templateService, DocumentTemplate } from '@/services/templateService';
import { whatsappService } from '@/services/whatsappService';

interface ReceiptModalProps {
  isOpen: boolean;
  sale: Sale | null;
  onClose: () => void;
}

export function ReceiptModal({ isOpen, sale, onClose }: ReceiptModalProps) {
  const { branding } = useBranding();
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);

  useEffect(() => {
    templateService.getDefaultTemplate('sales_receipt').then(setTemplate);
  }, []);

  if (!sale) return null;

  const handlePrint = () => {
    printService.printReceipt(sale);
  };

  const handleWhatsAppShare = () => {
    const rawMsg = `Official Receipt from ${branding.business_name || 'Supermarket'}.\nInvoice: #${sale.invoice_number || sale.id.slice(0, 8)}\nTotal Paid: KES ${(sale.net_amount ?? sale.total_amount ?? 0).toFixed(2)}\nPayment: ${sale.payment_method.toUpperCase()}`;
    const text = encodeURIComponent(rawMsg);
    whatsappService.sendNotification('254700000000', 'digital_receipt', rawMsg, 'Customer');
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Receipt ${sale.invoice_number || sale.id.slice(0, 8)} - ${branding.business_name || 'Supermarket'}`);
    const body = encodeURIComponent(
      `Dear Customer,\n\nThank you for shopping with us! Here is your purchase receipt:\nInvoice: #${sale.invoice_number || sale.id.slice(0, 8)}\nAmount Paid: KES ${(sale.net_amount ?? sale.total_amount ?? 0).toFixed(2)}\nPayment Method: ${sale.payment_method.toUpperCase()}\n\nPlease retain this receipt.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const netPayable = sale.net_amount ?? sale.total_amount ?? 0;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Completed Sale Thermal Receipt" className="max-w-xl">
      <div className="space-y-4 font-sans">
        <div className="text-center py-3 border-b border-slate-200 bg-emerald-50/50 rounded-2xl p-4">
          <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-1.5" />
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Transaction Successful</h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Invoice #{sale.invoice_number || sale.id.slice(0, 8)}</p>
        </div>

        {/* Printable thermal receipt layout container */}
        <div
          id="thermal-receipt"
          className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 shadow-xs"
          style={{
            fontFamily: template?.font_family === 'monospace' ? 'Courier New, monospace' : template?.font_family === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif',
          }}
        >
          <div className="text-center border-b border-slate-300 pb-3 space-y-1">
            {template?.show_logo && (branding.receipt_logo_url || branding.logo_url) ? (
              <img src={branding.receipt_logo_url || branding.logo_url} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-1" />
            ) : null}
            <h4 className="font-black text-sm uppercase tracking-wide" style={{ color: template?.primary_color || '#0f172a' }}>
              {branding.business_name || 'SUPERMARKET NAME'}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">{branding.address || 'Store Location CBD'}</p>
            <p className="text-[10px] text-slate-500 font-medium">TEL: {branding.phone || '+254 700 000 000'}</p>
            {template?.pin_vat_number && <p className="text-[10px] text-slate-400 font-mono">KRA PIN: {template.pin_vat_number}</p>}
            {template?.header_message && <p className="text-[10px] text-slate-700 italic border-t pt-1 mt-1">{template.header_message}</p>}
          </div>

          <div className="flex justify-between text-[11px] text-slate-600 py-1">
            <span>Date: {formatDateTime(sale.created_at)}</span>
            <span className="font-extrabold text-slate-900">PAY: {sale.payment_method.toUpperCase()}</span>
          </div>

          <div className="border-t border-b border-slate-300 py-2.5 space-y-1.5">
            {sale.sale_items?.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <span className="font-bold text-slate-900">{item.quantity}x {item.product_name || item.product?.name}</span>
                <span className="font-extrabold text-slate-900">{formatCurrency(item.subtotal || item.total_price || 0)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-right pt-1.5 text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">{formatCurrency(sale.total_amount)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>Discount:</span>
                <span>-{formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>VAT (16%):</span>
              <span>{formatCurrency(sale.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-2">
              <span>TOTAL PAID:</span>
              <span className="text-emerald-700 text-base">{formatCurrency(netPayable)}</span>
            </div>
          </div>

          {/* QR & Barcode Section */}
          {template?.show_qr && (
            <div className="border-t border-dashed pt-2 flex justify-center">
              <div className="text-center font-mono text-[9px] text-slate-400">
                <span>[ QR VERIFICATION ENCRYPTED CODE ]</span>
              </div>
            </div>
          )}

          {/* Receipt Footer Message */}
          <div className="border-t border-dashed border-slate-300 pt-2.5 text-center text-[10px] text-slate-500 font-sans italic space-y-1">
            {template?.thank_you_message && <p className="font-bold text-slate-800">{template.thank_you_message}</p>}
            {template?.return_policy && <p>{template.return_policy}</p>}
            <p>{template?.footer_message || branding.receipt_footer || 'Thank you for shopping with us! Please retain receipt.'}</p>
          </div>
        </div>

        {/* Action Suite */}
        <div className="space-y-2 pt-2">
          <div className="flex space-x-2">
            <Button onClick={handlePrint} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs h-11 rounded-xl flex items-center justify-center">
              <Printer className="w-4 h-4 mr-2" />
              Print Thermal Receipt
            </Button>
            <Button onClick={onClose} variant="outline" className="text-xs font-black h-11 px-5 rounded-xl border-slate-200">
              Done
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleWhatsAppShare} variant="outline" size="sm" className="flex-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs">
              <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Share via WhatsApp
            </Button>
            <Button onClick={handleEmailShare} variant="outline" size="sm" className="flex-1 text-blue-700 border-blue-300 hover:bg-blue-50 text-xs">
              <Mail className="w-3.5 h-3.5 mr-1 text-blue-600" /> Share via Email
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
