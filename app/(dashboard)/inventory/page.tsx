'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { inventoryService } from '@/services/inventoryService';
import { supplierService } from '@/services/supplierService';
import { productSchema } from '@/lib/validations';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime, getExpiryStatus, ExpiryStatus } from '@/lib/utils';
import { Package, Plus, Search, Calendar, Truck, ArrowRightLeft, Sparkles, AlertCircle, Edit3, Trash2, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Product, PurchaseOrder } from '@/types';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'products' | 'movements' | 'purchase_orders' | 'expiry'>('products');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Toast / Error Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPOOpen, setIsPOOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<Product | null>(null);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjustment_add' | 'adjustment_sub' | 'transfer_in' | 'transfer_out' | 'damaged' | 'expired'>('in');
  const [adjustReason, setAdjustReason] = useState('');

  // Form State for New Product
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minimumStock, setMinimumStock] = useState('5');
  const [expiryDate, setExpiryDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Form State for Purchase Order
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poAmount, setPoAmount] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['stockTransactions'],
    queryFn: () => inventoryService.getStockTransactions(50),
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => inventoryService.getPurchaseOrders(),
  });

  const { data: expiryProducts = [] } = useQuery({
    queryKey: ['nearExpiry'],
    queryFn: () => inventoryService.getNearExpiryProducts(30),
  });

  // Supabase Realtime Sync for live indicators & counters without page refresh
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('inventory_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => {
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['nearExpiry'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['stockTransactions'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Live Indicator Calculations
  const activePOCount = purchaseOrders.filter((po) => po.status === 'ordered').length;

  const expiryWarningProducts = products.filter(
    (p) => p.expiry_date && getExpiryStatus(p.expiry_date) !== 'safe'
  );
  const expiryWarningCount = expiryWarningProducts.length;

  const createProductMutation = useMutation({
    mutationFn: (newProd: any) => productService.createProduct(newProd),
    onSuccess: (savedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddOpen(false);
      setName('');
      setBarcode('');
      setSku('');
      setBuyingPrice('');
      setSellingPrice('');
      setCurrentStock('');
      setExpiryDate('');
      setImageUrl('');
      setErrorMessage(null);
      setSuccessMessage(`Product "${savedProduct.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to save product to Supabase.');
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      productService.updateProduct(id, updates),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditItem(null);
      setSuccessMessage(`Product "${updatedProduct.name}" updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to update product.');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSuccessMessage('Product deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
  });

  const createPOMutation = useMutation({
    mutationFn: (newPO: any) => inventoryService.createPurchaseOrder(newPO),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setIsPOOpen(false);
      setPoSupplierId('');
      setPoAmount('');
    },
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawData = {
      name: name.trim(),
      barcode: barcode.trim() || `BC-${Date.now()}`,
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      unit: 'Pcs',
      buying_price: parseFloat(buyingPrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      current_stock: parseFloat(currentStock) || 0,
      minimum_stock: parseFloat(minimumStock) || 5,
      expiry_date: expiryDate.trim() || undefined,
      category_id: categoryId.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
    };

    const validation = productSchema.safeParse(rawData);
    if (!validation.success) {
      setErrorMessage(validation.error.errors[0]?.message || 'Invalid product data');
      return;
    }

    createProductMutation.mutate(validation.data);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    updateProductMutation.mutate({
      id: editItem.id,
      updates: {
        name: editItem.name,
        barcode: editItem.barcode,
        sku: editItem.sku,
        selling_price: editItem.selling_price,
        cost_price: editItem.buying_price ?? editItem.cost_price,
        stock_quantity: editItem.current_stock ?? editItem.stock_quantity,
        reorder_level: editItem.minimum_stock ?? editItem.reorder_level,
        expiry_date: editItem.expiry_date,
      },
    });
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    createPOMutation.mutate({
      supplier_id: poSupplierId,
      total_amount: parseFloat(poAmount) || 0,
    });
  };

  const handleAdjustStock = async () => {
    if (!adjustItem || !adjustQty) return;
    const qtyNum = Math.abs(parseFloat(adjustQty));

    await inventoryService.adjustStock(
      adjustItem.id,
      qtyNum,
      adjustType,
      adjustReason || `Manual ${adjustType} movement`
    );
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['stockTransactions'] });
    setAdjustItem(null);
    setAdjustQty('');
    setAdjustReason('');
  };

  const handlePOStatusUpdate = async (poId: string, status: 'ordered' | 'received' | 'returned') => {
    await inventoryService.updatePOStatus(poId, status);
    queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-md animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-md animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory & Stock Audit</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track products, stock in/out, purchase orders, reorder alerts, and expiry dates</p>
        </div>
        <div className="flex space-x-2 mt-3 sm:mt-0">
          <Button onClick={() => setIsPOOpen(true)} variant="outline" className="text-xs font-bold border-slate-300">
            <Truck className="w-4 h-4 mr-1.5 text-slate-600" />
            + New Purchase Order
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 font-bold text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            + Add Product
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'products', label: `Product Catalog (${products.length})`, icon: Package },
          { id: 'movements', label: 'Stock Movements', icon: ArrowRightLeft },
          { id: 'purchase_orders', label: `Purchase Orders (${activePOCount})`, icon: Truck },
          { id: 'expiry', label: `Expiry Warnings (${expiryWarningCount})`, icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Product Catalog */}
      {activeTab === 'products' && (
        <Card>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
              <Input
                placeholder="Search products by name, SKU, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 text-xs"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-xl text-xs font-bold bg-white text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU / Barcode</th>
                  <th className="p-3">Buying Price</th>
                  <th className="p-3">Selling Price</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900 flex items-center space-x-2">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                          IMG
                        </div>
                      )}
                      <span>{p.name}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">
                      <span>{p.sku || 'N/A'}</span>
                      <br />
                      <span className="text-[10px] text-slate-400">{p.barcode}</span>
                    </td>
                    <td className="p-3">{formatCurrency(p.buying_price ?? p.cost_price ?? 0)}</td>
                    <td className="p-3 font-bold text-slate-900">{formatCurrency(p.selling_price)}</td>
                    <td className="p-3 font-black">{p.current_stock ?? p.stock_quantity ?? 0}</td>
                    <td className="p-3 font-mono text-slate-500">{p.expiry_date || '-'}</td>
                    <td className="p-3">
                      {(p.current_stock ?? p.stock_quantity ?? 0) <= (p.minimum_stock ?? p.reorder_level ?? 5) ? (
                        <Badge variant="danger">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button variant="outline" size="sm" onClick={() => setAdjustItem(p)} className="font-bold text-[11px] py-1">
                        Adjust
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditItem(p)} className="font-bold text-[11px] py-1">
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete product "${p.name}"?`)) {
                            deleteProductMutation.mutate(p.id);
                          }
                        }}
                        className="font-bold text-[11px] py-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Stock Movements */}
      {activeTab === 'movements' && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Audit Movement Log</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Movement Type</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400">{formatDateTime(tx.created_at)}</td>
                    <td className="p-3 font-bold text-slate-900">{tx.product?.name || 'Product'}</td>
                    <td className="p-3 uppercase font-extrabold text-blue-600">{tx.type}</td>
                    <td className="p-3 font-black text-slate-900">{tx.quantity}</td>
                    <td className="p-3 text-slate-500">{tx.notes || tx.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Purchase Orders */}
      {activeTab === 'purchase_orders' && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Purchase Orders Lifecycle</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Order Date</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900">{po.order_number || po.id.slice(0, 8)}</td>
                    <td className="p-3 font-bold text-slate-700">{po.supplier?.name || 'Vendor'}</td>
                    <td className="p-3 text-slate-400">{formatDateTime(po.created_at)}</td>
                    <td className="p-3 font-black text-slate-900">{formatCurrency(po.total_amount)}</td>
                    <td className="p-3 uppercase font-bold text-blue-600">{po.status}</td>
                    <td className="p-3 text-right space-x-1">
                      {po.status === 'ordered' && (
                        <Button size="sm" onClick={() => handlePOStatusUpdate(po.id, 'received')} className="text-[10px] py-1 bg-emerald-600">
                          Mark Received
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Expiry Warnings */}
      {activeTab === 'expiry' && (
        <ExpiryWatchlistSection products={products} />
      )}

      {/* Create Product Modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Inventory Product">
        <form onSubmit={handleCreateProduct} className="space-y-3">
          <Input label="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Auto-generated if empty" />
            <Input label="SKU Code" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Auto-generated if empty" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Buying Price (KES)" type="number" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} required />
            <Input label="Selling Price (KES)" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Initial Stock Qty" type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} required />
            <Input label="Minimum Reorder Stock" type="number" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} />
          </div>
          <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />

          {errorMessage && (
            <p className="text-xs text-red-600 font-bold text-center bg-red-50 p-2 rounded-lg border border-red-200">
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={createProductMutation.isPending}>
            {createProductMutation.isPending ? 'Saving to Supabase...' : 'Save Product'}
          </Button>
        </form>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog isOpen={!!editItem} onClose={() => setEditItem(null)} title={`Edit Product: ${editItem?.name}`}>
        {editItem && (
          <form onSubmit={handleUpdateProduct} className="space-y-3">
            <Input label="Product Name" value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} required />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Barcode" value={editItem.barcode} onChange={(e) => setEditItem({ ...editItem, barcode: e.target.value })} required />
              <Input label="SKU Code" value={editItem.sku || ''} onChange={(e) => setEditItem({ ...editItem, sku: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Buying Price (KES)"
                type="number"
                value={(editItem.buying_price ?? editItem.cost_price ?? 0).toString()}
                onChange={(e) => setEditItem({ ...editItem, buying_price: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="Selling Price (KES)"
                type="number"
                value={editItem.selling_price.toString()}
                onChange={(e) => setEditItem({ ...editItem, selling_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <Input label="Expiry Date" type="date" value={editItem.expiry_date || ''} onChange={(e) => setEditItem({ ...editItem, expiry_date: e.target.value })} />

            <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={updateProductMutation.isPending}>
              {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
            </Button>
          </form>
        )}
      </Dialog>

      {/* Stock Adjustment Modal */}
      <Dialog isOpen={!!adjustItem} onClose={() => setAdjustItem(null)} title={`Stock Movement: ${adjustItem?.name}`}>
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Current Stock: <strong>{adjustItem?.current_stock ?? adjustItem?.stock_quantity ?? 0}</strong></p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Movement Type</label>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
            >
              <option value="in">Stock In (Purchase/Restock)</option>
              <option value="out">Stock Out (Sale/Usage)</option>
              <option value="adjustment_add">Stock Adjustment (+)</option>
              <option value="adjustment_sub">Stock Adjustment (-)</option>
              <option value="transfer_in">Transfer In</option>
              <option value="transfer_out">Transfer Out</option>
              <option value="damaged">Damaged Stock</option>
              <option value="expired">Expired Stock</option>
            </select>
          </div>

          <Input
            label="Quantity Adjustment Qty"
            type="number"
            value={adjustQty}
            onChange={(e) => setAdjustQty(e.target.value)}
            placeholder="e.g. 50"
            required
          />

          <Input
            label="Reason / Reference Note"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="e.g. Received shipment PO-102"
          />

          <Button onClick={handleAdjustStock} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold">
            Record Stock Movement
          </Button>
        </div>
      </Dialog>

      {/* Create Purchase Order Modal */}
      <Dialog isOpen={isPOOpen} onClose={() => setIsPOOpen(false)} title="Create Vendor Purchase Order">
        <form onSubmit={handleCreatePO} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Supplier</label>
            <select
              value={poSupplierId}
              onChange={(e) => setPoSupplierId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
              required
            >
              <option value="">-- Choose Vendor --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Input label="Estimated Order Amount (KES)" type="number" value={poAmount} onChange={(e) => setPoAmount(e.target.value)} required />

          <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={createPOMutation.isPending}>
            {createPOMutation.isPending ? 'Generating PO...' : 'Create Purchase Order'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}

function ExpiryWatchlistSection({ products }: { products: Product[] }) {
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | 'soon' | 'safe'>('all');

  const productsWithExpiry = products.filter((p) => p.expiry_date && p.expiry_date.trim() !== '');

  const filteredProducts = productsWithExpiry.filter((p) => {
    const st = getExpiryStatus(p.expiry_date);
    if (expiryFilter === 'expired') return st === 'expired' || st === 'expires_today';
    if (expiryFilter === 'soon') return st === 'within_7_days' || st === 'within_30_days';
    if (expiryFilter === 'safe') return st === 'safe';
    return true;
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-4">
        <div>
          <CardTitle>Product Expiry Monitoring & Risk Watchlist</CardTitle>
          <p className="text-xs text-slate-500">Automatically tracking shelf-life, expiration dates, and disposal warnings</p>
        </div>
        <div className="flex space-x-1 border p-1 rounded-xl bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setExpiryFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${expiryFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            All Monitored ({productsWithExpiry.length})
          </button>
          <button
            onClick={() => setExpiryFilter('expired')}
            className={`px-3 py-1.5 rounded-lg transition-all ${expiryFilter === 'expired' ? 'bg-red-600 text-white shadow-sm' : 'text-red-700 hover:bg-red-100'}`}
          >
            Expired
          </button>
          <button
            onClick={() => setExpiryFilter('soon')}
            className={`px-3 py-1.5 rounded-lg transition-all ${expiryFilter === 'soon' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-100'}`}
          >
            Expiring Soon
          </button>
          <button
            onClick={() => setExpiryFilter('safe')}
            className={`px-3 py-1.5 rounded-lg transition-all ${expiryFilter === 'safe' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-100'}`}
          >
            Safe Stock
          </button>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
            <tr>
              <th className="p-3">Product Name</th>
              <th className="p-3">Barcode / SKU</th>
              <th className="p-3">Expiry Date</th>
              <th className="p-3">Current Stock</th>
              <th className="p-3">Monitoring Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500 font-bold">
                  No products matching selected expiry filter.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const status = getExpiryStatus(p.expiry_date);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900">{p.name}</td>
                    <td className="p-3 font-mono text-slate-500">{p.barcode || p.sku}</td>
                    <td className="p-3 font-bold text-slate-800">{p.expiry_date}</td>
                    <td className="p-3 font-black">{p.current_stock ?? p.stock_quantity ?? 0} Pcs</td>
                    <td className="p-3">
                      {status === 'expired' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
                          <AlertTriangle className="w-3 h-3 mr-1" /> EXPIRED - REMOVE FROM SHELF
                        </span>
                      )}
                      {status === 'expires_today' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 mr-1" /> EXPIRES TODAY
                        </span>
                      )}
                      {status === 'within_7_days' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 mr-1" /> EXPIRES WITHIN 7 DAYS
                        </span>
                      )}
                      {status === 'within_30_days' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <Clock className="w-3 h-3 mr-1" /> EXPIRES WITHIN 30 DAYS
                        </span>
                      )}
                      {status === 'safe' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 mr-1" /> SAFE (&gt;30 DAYS)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
