'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCart } from '@/store/cartSlice';
import { saleService } from '@/services/saleService';
import { customerService } from '@/services/customerService';
import { useAuth } from '@/context/AuthContext';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { PaymentMethod, Sale } from '@/types';
import { Banknote, CreditCard, Smartphone, UserCheck, AlertTriangle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted?: (sale: Sale) => void;
  onSuccess?: (receiptData: unknown) => void;
}

export function PaymentModal({ isOpen, onClose, onSaleCompleted, onSuccess }: PaymentModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { items, customer, globalDiscount } = useAppSelector((state) => state.cart);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [mpesaPhone, setMpesaPhone] = useState<string>('');
  const [mpesaRef, setMpesaRef] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.product.selling_price * item.quantity - item.discount, 0);
  const discountVal = globalDiscount || 0;
  const taxAmount = (Math.max(0, subtotal - discountVal) * 0.16);
  const netTotal = Math.max(0, subtotal - discountVal + taxAmount);

  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashNum - netTotal);

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error('No active cashier user session found. Please log in first.');
      }

      // 1. Validation for Cash Payment
      if (paymentMethod === 'cash' && cashNum < netTotal) {
        throw new Error(`Insufficient cash tendered. Total is KES ${netTotal.toFixed(2)}.`);
      }

      // 2. Validation for Customer Credit Payment
      if (paymentMethod === 'credit') {
        if (!customer) {
          throw new Error('Please select a customer profile to process a store credit debt sale.');
        }

        const limitCheck = await customerService.checkBorrowLimit(customer.id, netTotal);
        if (!limitCheck.allowed) {
          throw new Error(limitCheck.message || 'Customer borrowing limit reached!');
        }
      }

      // 3. Complete Sale in Supabase Cloud
      const sale = await saleService.completeSale({
        supermarket_id: user?.supermarket_id || '00000000-0000-0000-0000-000000000001',
        cashier_id: user.id,
        customer: customer || undefined,
        cartItems: items,
        paymentMethod,
        discountAmount: globalDiscount,
        taxAmount,
        netAmount: netTotal,
        totalAmount: subtotal,
        mpesaRef: paymentMethod === 'mpesa' ? mpesaRef : undefined,
      });

      const receiptData = {
        saleId: sale.id,
        invoiceNumber: sale.invoice_number || `INV-${sale.id.slice(0, 8)}`,
        date: new Date().toISOString(),
        cashierName: user?.name || 'Cashier',
        customerName: customer?.name || 'Walk-in Customer',
        items,
        subtotal,
        discount: globalDiscount,
        tax: taxAmount,
        total: netTotal,
        paymentMethod,
        cashTendered: paymentMethod === 'cash' ? cashNum : undefined,
        changeDue: paymentMethod === 'cash' ? changeDue : undefined,
      };

      dispatch(clearCart());
      if (onSaleCompleted) onSaleCompleted(sale);
      if (onSuccess) onSuccess(receiptData);
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Checkout failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Select Checkout Payment Gateway" className="max-w-xl">
      <div className="space-y-6">
        {/* Payable Total Card */}
        <div className="bg-slate-900 text-white p-4 rounded-xl text-center">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Amount Payable</p>
          <h2 className="text-3xl font-black text-emerald-400 mt-1">{formatCurrency(netTotal)}</h2>
          <p className="text-[10px] text-slate-400 mt-1">Includes KES {taxAmount.toFixed(2)} (16% VAT)</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Gateway Selection Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Payment Method</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-emerald-600' },
              { id: 'mpesa', label: 'M-Pesa STK', icon: Smartphone, color: 'text-green-600' },
              { id: 'card', label: 'Card/POS', icon: CreditCard, color: 'text-blue-600' },
              { id: 'credit', label: 'Store Credit', icon: UserCheck, color: 'text-amber-600' },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${method.color}`} />
                  <span className="text-xs">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Fields per Gateway */}
        {paymentMethod === 'cash' && (
          <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Input
              label="Cash Tendered Amount (KES)"
              type="number"
              value={cashTendered}
              onChange={(e) => setCashTendered(e.target.value)}
              placeholder="Enter amount given by customer"
              autoFocus
            />
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
              <span className="font-bold text-slate-600">Change Due to Customer:</span>
              <span className="font-black text-emerald-600 text-sm">{formatCurrency(changeDue)}</span>
            </div>
          </div>
        )}

        {paymentMethod === 'mpesa' && (
          <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Input
              label="M-Pesa Phone Number"
              type="text"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              placeholder="e.g. 0712345678"
            />
            <Input
              label="M-Pesa Transaction Reference Code"
              type="text"
              value={mpesaRef}
              onChange={(e) => setMpesaRef(e.target.value)}
              placeholder="e.g. QKH789XYZ"
            />
          </div>
        )}

        {paymentMethod === 'credit' && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
            <p className="font-bold text-amber-900">Selected Customer Profile:</p>
            {customer ? (
              <div>
                <p className="font-extrabold text-slate-900">{customer.name} ({customer.phone})</p>
                <p className="text-[11px] text-amber-800">
                  Current Balance: KES {(customer.balance ?? customer.current_debt ?? 0).toFixed(2)} / Borrow Limit: KES {(customer.credit_limit ?? customer.borrow_limit ?? 5000).toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-red-600 font-bold">No customer selected! Please close this modal and attach a customer to the cart.</p>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleCheckout}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl"
          disabled={loading || (paymentMethod === 'credit' && !customer)}
        >
          {loading ? 'Processing Sale...' : `Confirm & Finish Sale (${formatCurrency(netTotal)})`}
        </Button>
      </div>
    </Dialog>
  );
}
