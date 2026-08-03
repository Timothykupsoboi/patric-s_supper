'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCart } from '@/store/cartSlice';
import { saleService } from '@/services/saleService';
import { customerService } from '@/services/customerService';
import { mpesaService } from '@/services/mpesaService';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { PaymentMethod, Sale } from '@/types';
import { Banknote, CreditCard, Smartphone, UserCheck, AlertTriangle, CheckCircle, Wallet, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted?: (sale: Sale) => void;
  onSuccess?: (receiptData: unknown) => void;
}

export function PaymentModal({ isOpen, onClose, onSaleCompleted, onSuccess }: PaymentModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { branding } = useBranding();
  const { items, customer, globalDiscount } = useAppSelector((state) => state.cart);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [mpesaPhone, setMpesaPhone] = useState<string>('');
  const [mpesaRef, setMpesaRef] = useState<string>('');
  const [stkStatus, setStkStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [stkMessage, setStkMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.product.selling_price * item.quantity - item.discount, 0);
  const discountVal = globalDiscount || 0;
  const taxAmount = Math.max(0, subtotal - discountVal) * 0.16;
  const netTotal = Math.max(0, subtotal - discountVal + taxAmount);

  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashNum - netTotal);

  const setPresetCash = (amt: number) => {
    setCashTendered(amt.toString());
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMpesaPhone(raw);
  };

  const handleTriggerStkPush = async () => {
    setError(null);
    if (!mpesaPhone) {
      setError('Please enter customer M-Pesa phone number.');
      return;
    }
    if (!mpesaService.validatePhone(mpesaPhone)) {
      setError('Invalid Kenyan phone number format. Must be e.g. 0712345678 or 254712345678.');
      return;
    }

    setStkStatus('PENDING');
    setStkMessage(`Sending STK Push prompt for ${formatCurrency(netTotal)} to +${mpesaService.formatPhoneNumber(mpesaPhone)}...`);

    try {
      const response = await mpesaService.triggerStkPush(mpesaPhone, netTotal, `POS_${branding.short_name || 'STORE'}`);
      if (!response.success || !response.checkoutRequestId) {
        setStkStatus('FAILED');
        setError(response.message);
        return;
      }

      setStkMessage(response.message);
      if (response.referenceNumber) {
        setMpesaRef(response.referenceNumber);
      }

      // Simulate polling Safaricom STK Push callback response
      const pollRes = await mpesaService.pollStkStatus(response.checkoutRequestId);
      if (pollRes.status === 'SUCCESS') {
        setStkStatus('SUCCESS');
        setStkMessage(`Payment confirmed! Ref: ${pollRes.referenceNumber}`);
        if (pollRes.referenceNumber) setMpesaRef(pollRes.referenceNumber);
        // Automatically complete sale upon successful STK Push callback
        await finalizeCheckout(pollRes.referenceNumber || response.referenceNumber);
      } else {
        setStkStatus('FAILED');
        setError('STK Push request was cancelled or timed out on customer device.');
      }
    } catch (err: any) {
      setStkStatus('FAILED');
      setError(err.message || 'STK Push trigger failed.');
    }
  };

  const finalizeCheckout = async (finalMpesaRef?: string) => {
    if (!user?.id) {
      throw new Error('No active cashier user session found. Please log in first.');
    }

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
      mpesaRef: paymentMethod === 'mpesa' ? finalMpesaRef || mpesaRef : undefined,
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
  };

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

      // 3. Validation for manual M-Pesa entry
      if (paymentMethod === 'mpesa' && stkStatus !== 'SUCCESS') {
        if (!mpesaRef) {
          throw new Error('Please click "Send STK Push" or enter valid M-Pesa transaction reference code.');
        }
      }

      await finalizeCheckout();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Checkout failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="POS Checkout Gateway" className="max-w-xl">
      <div className="space-y-5 font-sans">
        {/* Payable Total Card */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl text-center shadow-sm">
          <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Total Amount Payable</p>
          <h2 className="text-3xl font-black text-emerald-400 mt-1 tracking-tight">{formatCurrency(netTotal)}</h2>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Includes KES {taxAmount.toFixed(2)} (16% VAT)</p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center shadow-xs">
            <AlertTriangle className="w-4.5 h-4.5 mr-2 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Gateway Selection Cards */}
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Select Payment Method</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-emerald-600', activeBg: 'bg-emerald-50 border-emerald-500 text-emerald-900' },
              { id: 'mpesa', label: 'M-Pesa STK', icon: Smartphone, color: 'text-green-600', activeBg: 'bg-green-50 border-green-500 text-green-900' },
              { id: 'card', label: 'Card/POS', icon: CreditCard, color: 'text-blue-600', activeBg: 'bg-blue-50 border-blue-500 text-blue-900' },
              { id: 'credit', label: 'Store Credit', icon: UserCheck, color: 'text-amber-600', activeBg: 'bg-amber-50 border-amber-500 text-amber-900' },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                    isSelected
                      ? `${method.activeBg} shadow-sm font-extrabold`
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${method.color}`} />
                  <span className="text-xs">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Fields per Gateway */}
        {paymentMethod === 'cash' && (
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <Input
              isFloating
              label="Cash Tendered Amount (KES)"
              type="number"
              value={cashTendered}
              onChange={(e) => setCashTendered(e.target.value)}
              icon={<Wallet className="w-4 h-4" />}
              placeholder="e.g. 1000"
              autoFocus
            />

            {/* Quick Tender Cash Preset Buttons */}
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Quick Cash Presets</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { label: 'Exact', val: netTotal },
                  { label: '100', val: 100 },
                  { label: '200', val: 200 },
                  { label: '500', val: 500 },
                  { label: '1k', val: 1000 },
                  { label: '2k', val: 2000 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPresetCash(preset.val)}
                    className="py-2 px-1 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer shadow-xs"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Large Change Due Banner */}
            <div className="flex justify-between items-center text-xs p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="font-extrabold text-emerald-900">Change Due to Customer:</span>
              <span className="font-black text-emerald-700 text-lg">{formatCurrency(changeDue)}</span>
            </div>
          </div>
        )}

        {paymentMethod === 'mpesa' && (
          <div className="space-y-3 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-emerald-900 uppercase">Safaricom M-Pesa STK Push Express</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Automated</span>
            </div>

            <Input
              isFloating
              label="Customer Phone (07XX / 01XX / 2547XX)"
              type="text"
              value={mpesaPhone}
              onChange={handlePhoneChange}
              placeholder="e.g. 0712345678"
            />

            {mpesaPhone && (
              <p className="text-[11px] font-mono text-emerald-800 font-bold">
                International Format: +{mpesaService.formatPhoneNumber(mpesaPhone)}
              </p>
            )}

            {stkStatus === 'PENDING' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2.5 text-xs text-amber-900 font-bold animate-pulse">
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                <span>{stkMessage || 'Prompting customer for M-Pesa PIN...'}</span>
              </div>
            )}

            {stkStatus === 'SUCCESS' && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-900 font-bold">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                <span>{stkMessage}</span>
              </div>
            )}

            <div className="flex space-x-2 pt-1">
              <Button
                type="button"
                onClick={handleTriggerStkPush}
                isLoading={stkStatus === 'PENDING'}
                disabled={stkStatus === 'PENDING'}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 rounded-xl"
              >
                <Smartphone className="w-4 h-4 mr-1.5" />
                {stkStatus === 'PENDING' ? 'Waiting for PIN...' : 'Send STK Push Prompt'}
              </Button>
            </div>

            <div className="pt-2 border-t border-emerald-200">
              <Input
                isFloating
                label="Manual M-Pesa Receipt Code (Optional Fallback)"
                type="text"
                value={mpesaRef}
                onChange={(e) => setMpesaRef(e.target.value)}
                placeholder="e.g. QKH789XYZ"
                className="bg-white"
              />
            </div>
          </div>
        )}

        {paymentMethod === 'credit' && (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1.5">
            <p className="font-black text-amber-900 uppercase tracking-wider text-[10px]">Customer Credit Debt Account:</p>
            {customer ? (
              <div>
                <p className="font-extrabold text-slate-900 text-sm">{customer.name} ({customer.phone || 'No phone'})</p>
                <p className="text-xs text-amber-800 font-bold mt-0.5">
                  Current Debt: KES {(customer.balance ?? customer.current_debt ?? 0).toFixed(2)} | Borrow Limit: KES {(customer.credit_limit ?? customer.borrow_limit ?? 5000).toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-red-600 font-bold">No customer selected! Close this modal and select a customer first.</p>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleCheckout}
          isLoading={loading}
          disabled={loading || (paymentMethod === 'credit' && !customer)}
          className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-md shadow-emerald-900/20 flex items-center justify-center space-x-2"
        >
          <span>{paymentMethod === 'mpesa' && stkStatus === 'PENDING' ? 'Processing STK...' : 'Complete Sale'}</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </Dialog>
  );
}
