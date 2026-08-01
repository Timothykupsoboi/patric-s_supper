'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { printService } from '@/services/printService';
import { Sale } from '@/types';
import { Printer, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Receipt Preview" className="max-w-sm">
      <div className="space-y-4">
        {/* Printable Receipt Layout */}
        <div id="printable-receipt" className="bg-white border border-gray-200 p-4 rounded-lg font-mono text-xs text-black">
          <div className="text-center mb-3">
            <h3 className="font-bold text-sm text-black">NAIROBI SUPERMARKET</h3>
            <p className="text-[10px]">Main Branch - Nairobi CBD</p>
            <p className="text-[10px]">Tel: +254 700 000 000</p>
            <div className="border-b border-dashed border-black my-2"></div>
            <p className="font-bold text-[11px]">OFFICIAL CASH RECEIPT</p>
            <p className="text-[10px]">Invoice: {sale.invoice_number}</p>
            <p className="text-[10px]">Date: {new Date(sale.created_at || Date.now()).toLocaleString()}</p>
          </div>

          <div className="border-b border-dashed border-black my-2"></div>

          {/* Items */}
          <div className="space-y-1">
            {(sale.sale_items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>
                  {item.product_name}
                  <br />
                  <span className="text-[10px]">{item.quantity} x {formatCurrency(item.unit_price)}</span>
                </span>
                <span className="font-bold">{formatCurrency(item.total_price)}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-black my-2"></div>

          {/* Totals */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.total_amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatCurrency(sale.discount_amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT Tax:</span>
              <span>{formatCurrency(sale.tax_amount || 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs border-t border-black pt-1">
              <span>NET TOTAL:</span>
              <span>{formatCurrency(sale.net_amount || 0)}</span>
            </div>
            <div className="flex justify-between text-[10px] pt-1">
              <span>PAYMENT:</span>
              <span className="uppercase font-bold">{sale.payment_method}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-black my-3"></div>
          <div className="text-center text-[10px]">
            <p>Thank you for shopping with us!</p>
            <p>Goods once sold are non-refundable.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" onClick={onClose} className="w-1/2">
            Close
          </Button>
          <Button onClick={handlePrint} className="w-1/2 font-bold bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-1.5" />
            Print Receipt
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
