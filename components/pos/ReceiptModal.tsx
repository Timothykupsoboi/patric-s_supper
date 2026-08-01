'use client';

import React from 'react';
import { Sale } from '@/types';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer, CheckCircle, Download } from 'lucide-react';
import { printService } from '@/services/printService';

interface ReceiptModalProps {
  isOpen: boolean;
  sale: Sale | null;
  onClose: () => void;
}

export function ReceiptModal({ isOpen, sale, onClose }: ReceiptModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    printService.printReceipt(sale);
  };

  const netPayable = sale.net_amount ?? sale.total_amount ?? 0;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Completed Sale Receipt">
      <div className="space-y-4">
        <div className="text-center py-2 border-b border-dashed border-slate-200">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-1" />
          <h3 className="text-lg font-black text-slate-900">Transaction Successful</h3>
          <p className="text-xs text-slate-500">Invoice #{sale.invoice_number || sale.id.slice(0, 8)}</p>
        </div>

        {/* Printable thermal receipt layout container */}
        <div id="thermal-receipt" className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
          <div className="text-center border-b pb-2">
            <h4 className="font-bold text-sm text-slate-900 uppercase">NAIROBI SUPERMARKET</h4>
            <p className="text-[10px] text-slate-500">Main Branch, Nairobi CBD</p>
            <p className="text-[10px] text-slate-500">TEL: +254 700 000 000</p>
          </div>

          <div className="flex justify-between text-[11px]">
            <span>Date: {formatDateTime(sale.created_at)}</span>
            <span>Pay: {sale.payment_method.toUpperCase()}</span>
          </div>

          <div className="border-t border-b py-2 space-y-1">
            {sale.sale_items?.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.quantity}x {item.product_name || item.product?.name}</span>
                <span>{formatCurrency(item.subtotal || item.total_price || 0)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-right pt-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.total_amount)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Discount:</span>
              <span>-{formatCurrency(sale.discount_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (16%):</span>
              <span>{formatCurrency(sale.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-1">
              <span>TOTAL PAID:</span>
              <span>{formatCurrency(netPayable)}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <Button onClick={handlePrint} className="flex-1 bg-slate-900 hover:bg-slate-800 font-bold text-xs py-2.5">
            <Printer className="w-4 h-4 mr-2" />
            Print Thermal Receipt
          </Button>
          <Button onClick={onClose} variant="outline" className="text-xs font-bold px-4">
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
