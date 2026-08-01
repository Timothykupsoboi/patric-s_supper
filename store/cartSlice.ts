import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, CartItem, Customer, PaymentMethod } from '@/types';

export interface CartState {
  items: CartItem[];
  customer: Customer | null;
  paymentMethod: PaymentMethod;
  globalDiscount: number;
  notes: string;
  heldCarts: { id: string; name: string; items: CartItem[]; customer: Customer | null; date: string }[];
}

const initialState: CartState = {
  items: [],
  customer: null,
  paymentMethod: 'cash',
  globalDiscount: 0,
  notes: '',
  heldCarts: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const existing = state.items.find((i) => i.product.id === action.payload.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ product: action.payload, quantity: 1, discount: 0 });
      }
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.items.find((i) => i.product.id === action.payload.productId);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((i) => i.product.id !== action.payload.productId);
        } else {
          item.quantity = action.payload.quantity;
        }
      }
    },
    updateItemDiscount: (state, action: PayloadAction<{ productId: string; discount: number }>) => {
      const item = state.items.find((i) => i.product.id === action.payload.productId);
      if (item) {
        item.discount = Math.max(0, action.payload.discount);
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.product.id !== action.payload);
    },
    setCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.customer = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethod = action.payload;
    },
    setGlobalDiscount: (state, action: PayloadAction<number>) => {
      state.globalDiscount = Math.max(0, action.payload);
    },
    setNotes: (state, action: PayloadAction<string>) => {
      state.notes = action.payload;
    },
    holdCurrentCart: (state, action: PayloadAction<string>) => {
      if (state.items.length === 0) return;
      state.heldCarts.push({
        id: `HOLD-${Date.now()}`,
        name: action.payload || `Held Cart ${state.heldCarts.length + 1}`,
        items: [...state.items],
        customer: state.customer,
        date: new Date().toISOString(),
      });
      state.items = [];
      state.customer = null;
      state.globalDiscount = 0;
      state.notes = '';
    },
    resumeHeldCart: (state, action: PayloadAction<string>) => {
      const cartToResume = state.heldCarts.find((c) => c.id === action.payload);
      if (cartToResume) {
        state.items = cartToResume.items;
        state.customer = cartToResume.customer;
        state.heldCarts = state.heldCarts.filter((c) => c.id !== action.payload);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.customer = null;
      state.globalDiscount = 0;
      state.notes = '';
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  updateItemDiscount,
  removeFromCart,
  setCustomer,
  setPaymentMethod,
  setGlobalDiscount,
  setNotes,
  holdCurrentCart,
  resumeHeldCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
