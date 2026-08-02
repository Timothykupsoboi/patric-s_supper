'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCart } from '@/store/cartSlice';
import { saleService } from '@/services/saleService';
import { mpesaService } from '@/services/mpesaService';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentMethod, Sale } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Banknote, CreditCard, Smartphone, UserX, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted: (sale: Sale) => void;
}

export function PaymentModal({ isOpen, onClose, onSaleCompleted }: PaymentModalProps) {
  const dispatch = useAppDispatch();
  const { items, customer, globalDiscount } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [mpesaPhone, setMpesaPhone] = useState<string>(customer?.phone || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [mpesaStatus, setMpesaStatus] = useState<string>('');

  const subtotal = items.reduce((sum, item) => sum + item.product.selling_price * item.quantity - item.discount, 0);
  const taxAmount = items.reduce(
    (sum, item) => sum + ((item.product.selling_price * item.quantity - item.discount) * (item.product.vat_rate || 0)) / 100,
    0
  );
  const netTotal = Math.max(0, subtotal - globalDiscount);
  const changeDue = Math.max(0, (parseFloat(cashTendered) || 0) - netTotal);

  const handleProcessPayment = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Borrow limit validation if credit sale
      if (paymentMethod === 'credit') {
        if (!customer) {
          setError('A customer profile must be selected for store account credit sales.');
          setLoading(false);
          return;
        }
        const currentDebt = customer.balance ?? customer.current_debt ?? 0;
        const creditLimit = customer.credit_limit ?? customer.borrow_limit ?? 5000;
        const projectedDebt = currentDebt + netTotal;

        if (projectedDebt > creditLimit) {
          setError(
            `Borrow limit exceeded! Customer limit is KES ${creditLimit.toFixed(
              2
            )}, current debt is KES ${currentDebt.toFixed(
              2
            )}. Adding KES ${netTotal.toFixed(2)} exceeds limit by KES ${(
              projectedDebt - creditLimit
            ).toFixed(2)}.`
          );
          setLoading(false);
          return;
        }
      }

      // 2. M-Pesa STK Push simulation if M-Pesa
      let mpesaRef = '';
      if (paymentMethod === 'mpesa') {
        setMpesaStatus('Sending STK Push prompt to customer phone...');
        const res = await mpesaService.triggerStkPush(mpesaPhone, netTotal);
        if (!res.success) {
          setError(res.message);
          setLoading(false);
          return;
        }
        mpesaRef = res.referenceNumber || '';
        setMpesaStatus(`PIN prompt received. Transaction verified (${mpesaRef}).`);
      }

      // 3. Complete Sale in Supabase Cloud
      const sale = await saleService.completeSale({
        supermarket_id: user?.supermarket_id || '00000000-0000-0000-0000-000000000001',
        cashier_id: user?.id || 'demo-cashier-id',
        customer: customer || undefined,
        cartItems: items,
        paymentMethod,
        discountAmount: globalDiscount,
        taxAmount,
        netAmount: netTotal,
        totalAmount: subtotal,
        mpesaRef,
      });

      dispatch(clearCart());
      onClose();
      onSaleCompleted(sale);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Complete Sale Payment" className="max-w-md">
      <div className="space-y-5">
        {/* Total Header */}
        <div className="bg-slate-900 text-white p-4 rounded-xl text-center">
          <p className="text-xs text-slate-400 font-medium">TOTAL AMOUNT DUE</p>
          <p className="text-3xl font-black text-emerald-400">{formatCurrency(netTotal)}</p>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">Select Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'card', label: 'Card / POS', icon: CreditCard },
              { id: 'mpesa', label: 'M-Pesa STK', icon: Smartphone },
              { id: 'credit', label: 'Store Credit (Debtor)', icon: UserX },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`p-3 rounded-lg border text-left flex items-center space-x-2.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Payment Input Details */}
        {paymentMethod === 'cash' && (
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <Input
              label="Cash Tendered (KES)"
              type="number"
              placeholder="e.g. 1000"
              value={cashTendered}
              onChange={(e) => setCashTendered(e.target.value)}
              required
            />
            <div className="flex justify-between items-center text-xs font-bold pt-1">
              <span className="text-slate-600">Change Due to Customer:</span>
              <span className="text-emerald-700 font-black text-sm">{formatCurrency(changeDue)}</span>
            </div>
          </div>
        )}

        {paymentMethod === 'mpesa' && (
          <div className="space-y-2 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
            <Input
              label="Customer M-Pesa Phone Number"
              placeholder="0712345678"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              required
            />
            {mpesaStatus && (
              <p className="text-[11px] font-bold text-emerald-800 flex items-center mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 animate-pulse" />
                {mpesaStatus}
              </p>
            )}
          </div>
        )}

        {paymentMethod === 'credit' && (
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 space-y-1">
            <div className="flex items-center text-amber-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" />
              <span>Store Credit Debt Transaction</span>
            </div>
            <p className="text-[11px] text-amber-700">
              Amount will be charged to <strong>{customer?.name || 'Customer Profile'}</strong> debtor balance.
            </p>
          </div>
        )}

        {error && <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

        <Button
          type="button"
          onClick={handleProcessPayment}
          className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold py-3 text-sm"
          disabled={loading}
        >
          {loading ? 'Processing Sale...' : `Confirm & Pay ${formatCurrency(netTotal)}`}
        </Button>
      </div>
    </Dialog>
  );
}
