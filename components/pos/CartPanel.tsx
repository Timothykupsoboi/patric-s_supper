'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  updateQuantity,
  removeFromCart,
  setGlobalDiscount,
  holdCurrentCart,
  resumeHeldCart,
  clearCart,
} from '@/store/cartSlice';
import { Trash2, Plus, Minus, User, PauseCircle, CheckCircle, Tag, RotateCcw, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';

interface CartPanelProps {
  onOpenPayment: () => void;
  onSelectCustomer: () => void;
}

export function CartPanel({ onOpenPayment, onSelectCustomer }: CartPanelProps) {
  const dispatch = useAppDispatch();
  const { items, customer, globalDiscount, heldCarts, warningMessage } = useAppSelector((state) => state.cart);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.selling_price * item.quantity - item.discount, 0);
  const taxAmount = items.reduce(
    (sum, item) => sum + ((item.product.selling_price * item.quantity - item.discount) * (item.product.vat_rate || 0)) / 100,
    0
  );
  const netTotal = Math.max(0, subtotal - globalDiscount);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[calc(100vh-6.5rem)] overflow-hidden font-sans">
      {/* Warning Message Bar */}
      {warningMessage && (
        <div className="p-3 bg-red-600 text-white text-xs font-extrabold flex items-center space-x-2 animate-in slide-in-from-top">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Customer & Register Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm font-extrabold">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            {customer ? (
              <div>
                <p className="text-xs font-black text-slate-900 truncate">{customer.name}</p>
                <div className="flex items-center space-x-2 text-[11px] mt-0.5">
                  <span className={(customer.balance ?? customer.current_debt ?? 0) > 0 ? 'text-red-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                    Debt: KES {(customer.balance ?? customer.current_debt ?? 0).toFixed(2)}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-medium">Limit: KES {(customer.credit_limit ?? customer.borrow_limit ?? 5000).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-extrabold text-slate-900">Walk-in Retail Customer</p>
                <p className="text-[11px] text-slate-400 font-medium">Standard POS Cash Sale</p>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectCustomer}
          className="font-extrabold text-xs h-9 px-3.5 border-slate-200 bg-white hover:bg-slate-100 shadow-xs"
        >
          {customer ? 'Change' : '+ Customer [F2]'}
        </Button>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3 border border-slate-200">
              <Tag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p className="text-sm font-black text-slate-800">Register Cart is Empty</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px] font-medium leading-relaxed">
              Scan product barcode, type SKU, or click items on the product grid
            </p>
            {heldCarts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHeldModalOpen(true)}
                className="mt-4 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-extrabold text-xs h-9"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Resume Held Sale ({heldCarts.length})
              </Button>
            )}
          </div>
        ) : (
          items.map((item) => {
            const itemTotal = item.product.selling_price * item.quantity - item.discount;
            return (
              <div key={item.product.id} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate leading-snug">{item.product.name}</h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1 font-medium">
                    <span>{formatCurrency(item.product.selling_price)}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 font-mono">VAT {item.product.vat_rate || 0}%</span>
                  </div>
                </div>

                {/* Touch-Friendly Quantity Stepper (40px x 40px buttons) */}
                <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                  <button
                    onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity - 1 }))}
                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-black text-slate-900 font-mono">{item.quantity}</span>
                  <button
                    onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity + 1 }))}
                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Line Item Total */}
                <div className="text-right min-w-[75px]">
                  <p className="text-xs font-black text-slate-900">{formatCurrency(itemTotal)}</p>
                  <button
                    onClick={() => dispatch(removeFromCart(item.product.id))}
                    className="text-[10px] text-red-500 font-bold hover:underline mt-0.5 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/90 space-y-3">
        {/* Held Carts Notification Banner if items present */}
        {items.length > 0 && heldCarts.length > 0 && (
          <div className="flex justify-between items-center bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="font-extrabold text-amber-900">{heldCarts.length} Sale(s) on Hold</span>
            <button
              onClick={() => setIsHeldModalOpen(true)}
              className="text-amber-800 font-black hover:underline flex items-center"
            >
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        )}

        {/* Totals Breakdown */}
        <div className="space-y-2 text-xs text-slate-600 font-medium">
          <div className="flex justify-between items-center">
            <span>Subtotal Items ({totalItemsCount})</span>
            <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Estimated VAT (16%)</span>
            <span className="font-bold text-slate-900">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-red-600">
            <span className="font-bold">Cart Discount (KES)</span>
            <input
              type="number"
              value={globalDiscount || ''}
              onChange={(e) => dispatch(setGlobalDiscount(parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className="w-24 px-2.5 py-1 border border-slate-300 rounded-lg text-right text-xs bg-white font-extrabold text-red-600 focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          {/* NET TOTAL Banner */}
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex justify-between items-center mt-2 shadow-xs">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">NET PAYABLE</p>
              <p className="text-2xl font-black text-emerald-400 tracking-tight">{formatCurrency(netTotal)}</p>
            </div>
            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              POS SALE
            </span>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(holdCurrentCart('Hold Cart'))}
            disabled={items.length === 0}
            className="h-10 text-xs font-extrabold border-slate-300 hover:bg-slate-100"
          >
            <PauseCircle className="w-4 h-4 mr-1.5 text-slate-600" />
            Hold Cart
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(clearCart())}
            disabled={items.length === 0}
            className="h-10 text-xs font-extrabold text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear Cart
          </Button>
        </div>

        {/* Primary CONFIRM & PAY Button */}
        <Button
          onClick={onOpenPayment}
          disabled={items.length === 0}
          className="w-full h-13 text-base font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md shadow-emerald-900/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <CheckCircle className="w-5 h-5" />
          <span>PAY NOW [F4]</span>
          <span className="text-emerald-200 text-xs font-normal ml-1">({formatCurrency(netTotal)})</span>
        </Button>
      </div>

      {/* Held Carts Resume Modal */}
      <Dialog isOpen={isHeldModalOpen} onClose={() => setIsHeldModalOpen(false)} title="Resume Held Sale Carts">
        <div className="space-y-3 max-h-72 overflow-y-auto font-sans">
          {heldCarts.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium text-center py-4">No held sale carts found.</p>
          ) : (
            heldCarts.map((cart) => (
              <div key={cart.id} className="p-3.5 border rounded-2xl flex justify-between items-center bg-slate-50 hover:bg-slate-100/80 transition-all">
                <div>
                  <p className="font-extrabold text-xs text-slate-900">{cart.name}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{cart.items.length} items • {new Date(cart.date).toLocaleTimeString()}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    dispatch(resumeHeldCart(cart.id));
                    setIsHeldModalOpen(false);
                  }}
                  variant="primary"
                  className="text-xs font-bold"
                >
                  Resume Sale
                </Button>
              </div>
            ))
          )}
        </div>
      </Dialog>
    </div>
  );
}
