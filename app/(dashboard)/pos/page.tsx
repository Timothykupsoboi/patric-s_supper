'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch } from '@/store';
import { addToCart, setCustomer } from '@/store/cartSlice';
import { productService } from '@/services/productService';
import { customerService } from '@/services/customerService';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { CartPanel } from '@/components/pos/CartPanel';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Product, Sale } from '@/types';
import { Search, Barcode, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [scanNotification, setScanNotification] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Fetch Products with optimized stale time
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
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

  // Keyboard shortcut listener for F1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Product Catalog & Search */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <Input
              id="pos-search-input"
              placeholder="Search product by name, SKU, or scan barcode (F1)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-11 py-2.5 bg-slate-50 border-slate-200 text-sm"
              autoFocus
            />
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-blue-50/80 px-3.5 py-2.5 rounded-xl border border-blue-100 flex-shrink-0">
            <Barcode className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>Scanner Interceptor Active</span>
          </div>
        </div>

        {/* Scan Toast */}
        {scanNotification && (
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-md animate-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4" />
            <span>{scanNotification}</span>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {isProductsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No products found matching criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {paginatedProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => dispatch(addToCart(product))}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group h-32"
                >
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{product.sku || 'ITEM'}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${product.stock_quantity <= 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {product.stock_quantity} left
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xs text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t border-slate-50 pt-2">
                    <span className="text-sm font-black text-slate-900">{formatCurrency(product.selling_price)}</span>
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 text-xs font-bold">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span>Page {currentPage} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
          onSaleCompleted={(sale) => setCompletedSale(sale)}
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
      <Dialog isOpen={isCustomerOpen} onClose={() => setIsCustomerOpen(false)} title="Select Customer Account">
        <div className="space-y-4">
          <Input
            placeholder="Search customer by name or phone..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            <button
              onClick={() => {
                dispatch(setCustomer(null));
                setIsCustomerOpen(false);
              }}
              className="w-full p-3 text-left border rounded-xl text-xs font-bold hover:bg-slate-50"
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
                className="w-full p-3 text-left border rounded-xl text-xs hover:border-blue-500 hover:bg-blue-50/50 flex justify-between items-center"
              >
                <div>
                  <p className="font-extrabold text-slate-900">{cust.name}</p>
                  <p className="text-[10px] text-slate-500">{cust.phone || 'No phone recorded'}</p>
                </div>
                <div className="text-right text-[11px]">
                  <p className={cust.current_debt > 0 ? 'text-red-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                    Debt: KES {cust.current_debt.toFixed(2)}
                  </p>
                  <p className="text-slate-400">Borrow Limit: KES {cust.borrow_limit.toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
