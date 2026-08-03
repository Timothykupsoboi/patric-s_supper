'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToCart, setCustomer } from '@/store/cartSlice';
import { productService } from '@/services/productService';
import { customerService } from '@/services/customerService';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { CartPanel } from '@/components/pos/CartPanel';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Product, Sale } from '@/types';
import { Search, Barcode, AlertCircle, Plus, Sparkles, Clock, AlertTriangle, UserCheck, X } from 'lucide-react';
import { formatCurrency, getExpiryStatus, isProductExpired } from '@/lib/utils';

// Dynamic Imports with Lazy Loading
const PaymentModal = dynamic(
  () => import('@/components/pos/PaymentModal').then((mod) => mod.PaymentModal),
  { ssr: false }
);
const ReceiptModal = dynamic(
  () => import('@/components/pos/ReceiptModal').then((mod) => mod.ReceiptModal),
  { ssr: false }
);

export default function POSPage() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [scanNotification, setScanNotification] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Fetch Products
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
  });

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
    staleTime: 1000 * 60 * 15,
  });

  // Fetch Customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    staleTime: 1000 * 60 * 5,
  });

  // Memoized Scan Match Callback
  const handleScanMatch = useCallback(
    (product: Product) => {
      dispatch(addToCart(product));
      setScanNotification(`Scanned: ${product.name}`);
      setTimeout(() => setScanNotification(null), 2500);
    },
    [dispatch]
  );

  // Barcode Scanner Listener Hook
  useBarcodeScanner({
    products,
    onScanMatch: handleScanMatch,
  });

  // Global Keyboard Shortcuts (F1: Search, F2: Customer, F4/Space: Pay, Esc: Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-input');
        if (searchInput) searchInput.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsCustomerOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cartItems.length > 0) setIsPaymentOpen(true);
      } else if (e.key === 'Escape') {
        setIsCustomerOpen(false);
        setIsPaymentOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems]);

  // Filtered Products Memoization
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Paginated Product Grid
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Filtered Customers Memoization
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    return customers.filter(
      (c) => !query || c.name.toLowerCase().includes(query) || c.phone?.includes(query)
    );
  }, [customers, customerSearch]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* Left 2 Columns: Product Catalog & Search */}
      <div className="lg:col-span-2 space-y-4">
        {/* Large Search & Barcode Status Header */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              id="pos-search-input"
              type="text"
              placeholder="Search product by name, SKU, or scan barcode [F1]..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs font-black text-blue-900 bg-blue-50 px-4 py-3 rounded-2xl border border-blue-100 flex-shrink-0">
            <Barcode className="w-5 h-5 text-blue-600 animate-pulse" />
            <span>Scanner Interceptor Active</span>
          </div>
        </div>

        {/* Scan Toast */}
        {scanNotification && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 shadow-md animate-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4" />
            <span>{scanNotification}</span>
          </div>
        )}

        {/* Category Filter Tabs (44px height touch target pills) */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Touch-Friendly Product Grid */}
        {isProductsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-200 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-black text-slate-700">No products match your search query</p>
            <p className="text-xs text-slate-400 mt-1">Try searching by product barcode or selecting another category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {paginatedProducts.map((product) => {
                const stockQty = product.current_stock ?? product.stock_quantity ?? 0;
                const expStatus = getExpiryStatus(product.expiry_date);
                const expired = isProductExpired(product.expiry_date);

                return (
                  <button
                    key={product.id}
                    onClick={() => dispatch(addToCart(product))}
                    className={`p-4 rounded-3xl border shadow-xs transition-all text-left flex flex-col justify-between group h-40 relative cursor-pointer ${
                      expired
                        ? 'bg-red-50/60 border-red-200 hover:border-red-400'
                        : stockQty <= 0
                        ? 'bg-slate-100 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200/90 hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">{product.sku || 'ITEM'}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${stockQty <= 0 ? 'bg-red-600 text-white' : stockQty <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {stockQty <= 0 ? 'Out of Stock' : `${stockQty} left`}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-xs text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    {/* Expiry Warning Badge */}
                    {product.expiry_date && (
                      <div className="mt-1">
                        {expStatus === 'expired' && (
                          <span className="inline-flex items-center text-[9px] font-black text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3 mr-0.5" /> EXPIRED ({product.expiry_date})
                          </span>
                        )}
                        {expStatus === 'expires_today' && (
                          <span className="inline-flex items-center text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 mr-0.5" /> EXPIRES TODAY
                          </span>
                        )}
                        {expStatus === 'within_7_days' && (
                          <span className="inline-flex items-center text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 mr-0.5" /> Exp 7d ({product.expiry_date})
                          </span>
                        )}
                        {expStatus === 'within_30_days' && (
                          <span className="inline-flex items-center text-[9px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 mr-0.5" /> Exp 30d
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-2">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(product.selling_price)}</span>
                      <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200 text-xs font-bold shadow-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl"
                >
                  Previous
                </Button>
                <span className="text-slate-600 font-extrabold">Page {currentPage} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right 1 Column: Cart Panel */}
      <div className="lg:col-span-1">
        <CartPanel onOpenPayment={() => setIsPaymentOpen(true)} onSelectCustomer={() => setIsCustomerOpen(true)} />
      </div>

      {/* Dynamic Payment & Receipt Modals */}
      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onSaleCompleted={(sale: Sale) => {
            setCompletedSale(sale);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['salesMetrics'] });
            queryClient.invalidateQueries({ queryKey: ['recentSales'] });
            queryClient.invalidateQueries({ queryKey: ['lowStock'] });
            queryClient.invalidateQueries({ queryKey: ['stockTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['nearExpiry'] });
            queryClient.invalidateQueries({ queryKey: ['financialReportMetrics'] });
          }}
        />
      )}

      {!!completedSale && (
        <ReceiptModal
          isOpen={!!completedSale}
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* Customer Selector Modal */}
      <Dialog isOpen={isCustomerOpen} onClose={() => setIsCustomerOpen(false)} title="Select Customer Profile [F2]">
        <div className="space-y-4 font-sans">
          <Input
            isFloating
            label="Search Customer by Name or Phone"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="e.g. John Doe or 07..."
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            <button
              onClick={() => {
                dispatch(setCustomer(null));
                setIsCustomerOpen(false);
              }}
              className="w-full p-3.5 text-left border rounded-2xl text-xs font-black bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Walk-in Retail Customer (Default Cash Account)
            </button>
            {filteredCustomers.map((cust) => (
              <button
                key={cust.id}
                onClick={() => {
                  dispatch(setCustomer(cust));
                  setIsCustomerOpen(false);
                }}
                className="w-full p-3.5 text-left border border-slate-200 rounded-2xl text-xs hover:border-blue-500 hover:bg-blue-50/50 transition-all flex justify-between items-center cursor-pointer"
              >
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">{cust.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{cust.phone || 'No phone recorded'}</p>
                </div>
                <div className="text-right text-[11px]">
                  <p className={(cust.balance ?? cust.current_debt ?? 0) > 0 ? 'text-red-600 font-black' : 'text-emerald-600 font-black'}>
                    Debt: KES {(cust.balance ?? cust.current_debt ?? 0).toFixed(2)}
                  </p>
                  <p className="text-slate-400 font-medium">Limit: KES {(cust.credit_limit ?? cust.borrow_limit ?? 5000).toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
