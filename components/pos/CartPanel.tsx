'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  updateQuantity,
  removeFromCart,
  updateItemDiscount,
  setCustomer,
  setGlobalDiscount,
  holdCurrentCart,
  resumeHeldCart,
  clearCart,
} from '@/store/cartSlice';
import { Trash2, Plus, Minus, User, PauseCircle, CheckCircle, Tag, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

  const subtotal = items.reduce((sum, item) => sum + item.product.selling_price * item.quantity - item.discount, 0);
  const taxAmount = items.reduce(
    (sum, item) => sum + ((item.product.selling_price * item.quantity - item.discount) * (item.product.vat_rate || 0)) / 100,
    0
  );
  const netTotal = Math.max(0, subtotal - globalDiscount);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-6.5rem)]">
      {warningMessage && (
        <div className="p-3 bg-red-600 text-white text-xs font-extrabold flex items-center space-x-2 rounded-t-2xl animate-in slide-in-from-top">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}
      {/* Customer & Register Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            {customer ? (
              <div>
                <p className="text-xs font-extrabold text-slate-900 truncate">{customer.name}</p>
                <div className="flex items-center space-x-2 text-[10px]">
                  <span className={(customer.balance ?? customer.current_debt ?? 0) > 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                    Debt: KES {(customer.balance ?? customer.current_debt ?? 0).toFixed(2)}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">Limit: KES {(customer.credit_limit ?? customer.borrow_limit ?? 5000).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-800">Walk-in Retail Customer</p>
                <p className="text-[10px] text-slate-400">Standard Cash Register Sale</p>
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onSelectCustomer} className="font-semibold text-xs">
          {customer ? 'Change' : '+ Customer'}
        </Button>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
            <Tag className="w-12 h-12 mb-2 stroke-[1.5] text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Register Cart is Empty</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Scan item barcode, type SKU, or click catalog cards to add items
            </p>
            {heldCarts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHeldModalOpen(true)}
                className="mt-4 border-amber-300 text-amber-700 bg-amber-50"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Resume Held Cart ({heldCarts.length})
              </Button>
            )}
          </div>
        ) : (
          items.map((item) => {
            const itemTotal = item.product.selling_price * item.quantity - item.discount;
            return (
              <div key={item.product.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{item.product.name}</h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{formatCurrency(item.product.selling_price)}</span>
                    <span>•</span>
                    <span className="text-slate-400">VAT {item.product.vat_rate}%</span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                  <button
                    onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity - 1 }))}
                    className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity + 1 }))}
                    className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right pl-4 min-w-[80px]">
                  <p className="text-xs font-black text-slate-900">{formatCurrency(itemTotal)}</p>
                  <button
                    onClick={() => dispatch(removeFromCart(item.product.id))}
                    className="text-[10px] text-red-500 font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Action Buttons */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/90 rounded-b-2xl space-y-3">
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal Items ({items.reduce((sum, i) => sum + i.quantity, 0)})</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT Tax (16%)</span>
            <span className="font-semibold">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-red-600">
            <span>Cart Discount (KES)</span>
            <input
              type="number"
              value={globalDiscount || ''}
              onChange={(e) => dispatch(setGlobalDiscount(parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right text-xs bg-white font-bold"
            />
          </div>
          <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-200 pt-2">
            <span>NET TOTAL</span>
            <span className="text-blue-600">{formatCurrency(netTotal)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(holdCurrentCart('Hold Cart'))}
            disabled={items.length === 0}
            className="text-xs font-bold border-slate-300"
          >
            <PauseCircle className="w-4 h-4 mr-1 text-slate-500" />
            Hold Cart
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(clearCart())}
            disabled={items.length === 0}
            className="text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        <Button
          onClick={onOpenPayment}
          disabled={items.length === 0}
          className="w-full py-3.5 text-base font-extrabold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          CONFIRM & PAY ({formatCurrency(netTotal)})
        </Button>
      </div>

      {/* Held Carts Resume Modal */}
      <Dialog isOpen={isHeldModalOpen} onClose={() => setIsHeldModalOpen(false)} title="Resume Held Sale Carts">
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {heldCarts.map((cart) => (
            <div key={cart.id} className="p-3 border rounded-xl flex justify-between items-center bg-slate-50">
              <div>
                <p className="font-extrabold text-xs text-slate-900">{cart.name}</p>
                <p className="text-[10px] text-slate-500">{cart.items.length} items • {new Date(cart.date).toLocaleTimeString()}</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  dispatch(resumeHeldCart(cart.id));
                  setIsHeldModalOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-xs font-bold"
              >
                Resume Sale
              </Button>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
