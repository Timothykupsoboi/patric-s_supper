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
        const projectedDebt = customer.current_debt + netTotal;
        if (projectedDebt > customer.borrow_limit) {
          setError(
            `Borrow limit exceeded! Customer limit is KES ${customer.borrow_limit.toFixed(
              2
            )}, current debt is KES ${customer.current_debt.toFixed(
              2
            )}. Adding KES ${netTotal.toFixed(2)} exceeds limit by KES ${(
              projectedDebt - customer.borrow_limit
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

        {/* Cash Tendered Field */}
        {paymentMethod === 'cash' && (
          <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <Input
              type="number"
              label="Cash Tendered (KES)"
              placeholder="e.g. 1000"
              value={cashTendered}
              onChange={(e) => setCashTendered(e.target.value)}
              className="text-lg font-bold"
              autoFocus
            />
            {parseFloat(cashTendered) > 0 && (
              <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>CHANGE DUE:</span>
                <span className="text-blue-600 text-sm">{formatCurrency(changeDue)}</span>
              </div>
            )}
          </div>
        )}

        {/* M-Pesa Phone Input */}
        {paymentMethod === 'mpesa' && (
          <div className="space-y-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
            <Input
              label="Customer M-Pesa Phone Number"
              placeholder="0712345678"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
            />
            {mpesaStatus && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {mpesaStatus}
              </p>
            )}
          </div>
        )}

        {/* Debtors Credit Warning */}
        {paymentMethod === 'credit' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" />
              Customer Debt Account Sale
            </p>
            {customer ? (
              <p>
                Customer: <strong>{customer.name}</strong> | Limit: KES {customer.borrow_limit.toFixed(2)} | Current Debt: KES{' '}
                {customer.current_debt.toFixed(2)}
              </p>
            ) : (
              <p className="text-red-600 font-bold">Select a customer profile first to enable credit borrowing.</p>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button variant="outline" onClick={onClose} className="w-1/3">
            Cancel
          </Button>
          <Button
            onClick={handleProcessPayment}
            disabled={loading}
            className="w-2/3 py-3 font-bold bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
