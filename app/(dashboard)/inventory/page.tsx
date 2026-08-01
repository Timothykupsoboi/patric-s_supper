'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { inventoryService } from '@/services/inventoryService';
import { supplierService } from '@/services/supplierService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Package, Plus, Search, AlertTriangle, Calendar, Truck, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Product, Supplier, PurchaseOrder } from '@/types';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'products' | 'movements' | 'purchase_orders' | 'expiry'>('products');
  const [search, setSearch] = useState('');

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPOOpen, setIsPOOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'purchase' | 'adjustment' | 'damage' | 'transfer'>('purchase');
  const [adjustReason, setAdjustReason] = useState('');

  // Form State for New Product
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [expiryDate, setExpiryDate] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Form State for Purchase Order
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poAmount, setPoAmount] = useState('');

  // Data Queries
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

  const createProductMutation = useMutation({
    mutationFn: (newProd: any) => productService.createProduct(newProd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddOpen(false);
      setName('');
      setBarcode('');
      setSku('');
      setCostPrice('');
      setSellingPrice('');
      setStockQuantity('');
      setExpiryDate('');
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
    createProductMutation.mutate({
      supermarket_id: '00000000-0000-0000-0000-000000000001',
      category_id: categoryId || undefined,
      name,
      barcode: barcode || `BC-${Date.now()}`,
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      cost_price: parseFloat(costPrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      stock_quantity: parseInt(stockQuantity, 10) || 0,
      reorder_level: parseInt(reorderLevel, 10) || 5,
      expiry_date: expiryDate || undefined,
      is_active: true,
    });
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    createPOMutation.mutate({
      supermarket_id: '00000000-0000-0000-0000-000000000001',
      supplier_id: poSupplierId,
      total_amount: parseFloat(poAmount) || 0,
    });
  };

  const handleAdjustStock = async () => {
    if (!adjustItem || !adjustQty) return;
    const qtyNum = parseInt(adjustQty, 10);
    const finalQty = adjustType === 'damage' ? -Math.abs(qtyNum) : qtyNum;

    await inventoryService.adjustStock(
      adjustItem.id,
      finalQty,
      adjustType,
      adjustReason || `Manual ${adjustType} adjustment`
    );
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['stockTransactions'] });
    setAdjustItem(null);
    setAdjustQty('');
    setAdjustReason('');
  };

  const handlePOStatusUpdate = async (poId: string, status: 'ordered' | 'received' | 'cancelled') => {
    await inventoryService.updatePOStatus(poId, status);
    queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory & Stock Management</h1>
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

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'products', label: `Product Catalog (${products.length})`, icon: Package },
          { id: 'movements', label: 'Stock Movements', icon: ArrowRightLeft },
          { id: 'purchase_orders', label: `Purchase Orders (${purchaseOrders.length})`, icon: Truck },
          { id: 'expiry', label: `Expiry Warnings (${expiryProducts.length})`, icon: Calendar },
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
          <div className="mb-4 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
            <Input
              placeholder="Search products by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 text-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU / Barcode</th>
                  <th className="p-3">Cost Price</th>
                  <th className="p-3">Selling Price</th>
                  <th className="p-3">In Stock</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900">{p.name}</td>
                    <td className="p-3 font-mono text-slate-500">
                      <span>{p.sku || 'N/A'}</span>
                      <br />
                      <span className="text-[10px] text-slate-400">{p.barcode}</span>
                    </td>
                    <td className="p-3">{formatCurrency(p.cost_price)}</td>
                    <td className="p-3 font-bold text-slate-900">{formatCurrency(p.selling_price)}</td>
                    <td className="p-3 font-black">{p.stock_quantity}</td>
                    <td className="p-3 font-mono text-slate-500">{p.expiry_date || '-'}</td>
                    <td className="p-3">
                      {p.stock_quantity <= p.reorder_level ? (
                        <Badge variant="danger">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setAdjustItem(p)} className="font-bold text-[11px]">
                        Adjust Stock
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
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400">{formatDateTime(tx.created_at)}</td>
                    <td className="p-3 font-bold text-slate-900">{tx.product?.name || 'Product'}</td>
                    <td className="p-3 uppercase font-extrabold text-blue-600">{tx.type}</td>
                    <td className={`p-3 font-black ${tx.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                    </td>
                    <td className="p-3 text-slate-500">{tx.reason || '-'}</td>
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
                    <td className="p-3 font-extrabold text-slate-900">{po.order_number}</td>
                    <td className="p-3 font-bold text-slate-700">{po.supplier?.name || 'Vendor'}</td>
                    <td className="p-3 text-slate-400">{formatDateTime(po.created_at)}</td>
                    <td className="p-3 font-black text-slate-900">{formatCurrency(po.total_amount)}</td>
                    <td className="p-3 uppercase font-bold text-blue-600">{po.status}</td>
                    <td className="p-3 text-right space-x-1">
                      {po.status === 'draft' && (
                        <Button size="sm" onClick={() => handlePOStatusUpdate(po.id, 'ordered')} className="text-[10px] py-1 bg-blue-600">
                          Mark Ordered
                        </Button>
                      )}
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
        <Card>
          <CardHeader>
            <CardTitle>Near-Expiry & Expired Stock Watchlist (&lt;30 Days)</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Barcode</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Risk Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiryProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-emerald-600 font-bold">
                      No stock expiring within 30 days!
                    </td>
                  </tr>
                ) : (
                  expiryProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-extrabold text-slate-900">{p.name}</td>
                      <td className="p-3 font-mono text-slate-500">{p.barcode}</td>
                      <td className="p-3 font-bold text-red-600">{p.expiry_date}</td>
                      <td className="p-3 font-black">{p.stock_quantity}</td>
                      <td className="p-3">
                        <Badge variant="danger">Near Expiry</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
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
            <Input label="Cost Price (KES)" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required />
            <Input label="Selling Price (KES)" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Initial Stock Qty" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required />
            <Input label="Reorder Threshold" type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
          </div>
          <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold" disabled={createProductMutation.isPending}>
            {createProductMutation.isPending ? 'Saving...' : 'Save Product'}
          </Button>
        </form>
      </Dialog>

      {/* Stock Adjustment Modal */}
      <Dialog isOpen={!!adjustItem} onClose={() => setAdjustItem(null)} title={`Stock Movement: ${adjustItem?.name}`}>
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Current Stock: <strong>{adjustItem?.stock_quantity}</strong></p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Movement Type</label>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
            >
              <option value="purchase">Stock In (Purchase/Restock)</option>
              <option value="adjustment">Stock Count Adjustment</option>
              <option value="damage">Stock Out (Damage/Spill)</option>
              <option value="transfer">Branch Transfer</option>
            </select>
          </div>

          <Input
            label="Quantity Adjustment (+/-)"
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
