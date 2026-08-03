'use client';

import React, { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { inventoryService } from '@/services/inventoryService';
import { supplierService } from '@/services/supplierService';
import { productSchema } from '@/lib/validations';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SortableTableHead,
  TableSearch,
  TablePagination,
  TableSkeleton,
  TableEmptyState,
  TableBulkActions,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime, getExpiryStatus, ExpiryStatus } from '@/lib/utils';
import {
  Package,
  Plus,
  Calendar,
  Truck,
  ArrowRightLeft,
  Sparkles,
  AlertCircle,
  Edit3,
  Trash2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  PackageCheck,
  Barcode,
  DollarSign,
  Tag,
  FileText,
  LayoutGrid,
  List,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Boxes,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Product, PurchaseOrder } from '@/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'movements' | 'purchase_orders' | 'expiry'>('products');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Table Sorting & Pagination State
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Bulk Selection & Confirmation Dialog State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
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

  const { data: transactions = [], isLoading: isTxLoading } = useQuery({
    queryKey: ['stockTransactions'],
    queryFn: () => inventoryService.getStockTransactions(50),
  });

  const { data: purchaseOrders = [], isLoading: isPOLoading } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => inventoryService.getPurchaseOrders(),
  });

  const { data: expiryProducts = [] } = useQuery({
    queryKey: ['nearExpiry'],
    queryFn: () => inventoryService.getNearExpiryProducts(30),
  });

  // Dynamic Options
  const categoryOptions = useMemo(
    () => [{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories]
  );

  const supplierOptions = useMemo(
    () => [{ value: '', label: '-- Choose Vendor --' }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))],
    [suppliers]
  );

  // Supabase Realtime Sync
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

  // Executive Metric Calculations
  const metrics = useMemo(() => {
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const stock = p.current_stock ?? p.stock_quantity ?? 0;
      const minStock = p.minimum_stock ?? p.reorder_level ?? 5;
      const buying = p.buying_price ?? p.cost_price ?? 0;

      totalValuation += buying * stock;

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= minStock) {
        lowStockCount++;
      }
    });

    return {
      totalValuation,
      totalSKUs: products.length,
      lowStockCount,
      outOfStockCount,
      expiringCount: expiryProducts.length,
    };
  }, [products, expiryProducts]);

  // Analytics Chart Data
  const categoryValuationData = useMemo(() => {
    const map: Record<string, number> = {};
    categories.forEach((c) => (map[c.name] = 0));
    map['Uncategorized'] = 0;

    products.forEach((p) => {
      const cat = categories.find((c) => c.id === p.category_id)?.name || 'Uncategorized';
      const stock = p.current_stock ?? p.stock_quantity ?? 0;
      const buying = p.buying_price ?? p.cost_price ?? 0;
      map[cat] = (map[cat] || 0) + buying * stock;
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [products, categories]);

  const stockDistributionData = useMemo(() => {
    const inStock = products.length - metrics.lowStockCount - metrics.outOfStockCount;
    return [
      { name: 'Normal Stock', value: Math.max(0, inStock), color: '#10B981' },
      { name: 'Low Stock', value: metrics.lowStockCount, color: '#F59E0B' },
      { name: 'Out of Stock', value: metrics.outOfStockCount, color: '#EF4444' },
    ];
  }, [products, metrics]);

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: (newProd: any) => productService.createProduct(newProd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['nearExpiry'] });
      setIsAddOpen(false);
      resetAddForm();
      toast.success('Product Registered', 'New product line added to inventory.');
    },
    onError: (err: Error) => {
      toast.error('Creation Failed', err.message || 'Failed to create product.');
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => productService.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['nearExpiry'] });
      queryClient.invalidateQueries({ queryKey: ['stockTransactions'] });
      setEditItem(null);
      toast.success('Product Updated', 'Inventory changes saved successfully.');
    },
    onError: (err: Error) => {
      toast.error('Update Failed', err.message || 'Failed to update product.');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['nearExpiry'] });
      toast.success('Product Deleted', 'Item removed from inventory catalog.');
    },
    onError: (err: Error) => {
      toast.error('Deletion Failed', err.message || 'Could not delete product.');
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ productId, type, quantity, reason }: any) =>
      inventoryService.adjustStock(productId, quantity, type, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockTransactions'] });
      setAdjustItem(null);
      setAdjustQty('');
      setAdjustReason('');
      toast.success('Stock Adjusted', 'Inventory stock movement logged.');
    },
    onError: (err: Error) => {
      toast.error('Adjustment Failed', err.message || 'Could not record stock movement.');
    },
  });

  const createPOMutation = useMutation({
    mutationFn: ({ supplierId, amount }: { supplierId: string; amount: number }) =>
      inventoryService.createPurchaseOrder({ supplier_id: supplierId, total_amount: amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setIsPOOpen(false);
      setPoSupplierId('');
      setPoAmount('');
      toast.success('Purchase Order Generated', 'Vendor purchase order created.');
    },
    onError: (err: Error) => {
      toast.error('PO Creation Failed', err.message || 'Could not generate purchase order.');
    },
  });

  const resetAddForm = () => {
    setName('');
    setBarcode('');
    setSku('');
    setBuyingPrice('');
    setSellingPrice('');
    setCurrentStock('');
    setMinimumStock('5');
    setExpiryDate('');
    setCategoryId('');
    setImageUrl('');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      barcode: barcode || undefined,
      sku: sku || undefined,
      buying_price: parseFloat(buyingPrice) || 0,
      cost_price: parseFloat(buyingPrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      current_stock: parseInt(currentStock, 10) || 0,
      stock_quantity: parseInt(currentStock, 10) || 0,
      minimum_stock: parseInt(minimumStock, 10) || 5,
      reorder_level: parseInt(minimumStock, 10) || 5,
      expiry_date: expiryDate || null,
      category_id: categoryId || null,
      image_url: imageUrl || null,
    };

    const result = productSchema.safeParse(payload);
    if (!result.success) {
      const issue = result.error.issues[0];
      toast.error('Validation Error', `${issue.path.join('.')} - ${issue.message}`);
      return;
    }

    createProductMutation.mutate(payload);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    const updates = {
      name: editItem.name,
      barcode: editItem.barcode || undefined,
      sku: editItem.sku || undefined,
      buying_price: editItem.buying_price !== undefined ? parseFloat(String(editItem.buying_price)) : undefined,
      selling_price: editItem.selling_price !== undefined ? parseFloat(String(editItem.selling_price)) : undefined,
      current_stock: editItem.current_stock !== undefined ? parseInt(String(editItem.current_stock), 10) : undefined,
      minimum_stock: editItem.minimum_stock !== undefined ? parseInt(String(editItem.minimum_stock), 10) : undefined,
      tax_rate: editItem.tax_rate !== undefined ? parseFloat(String(editItem.tax_rate)) : undefined,
      expiry_date: editItem.expiry_date || null,
      category_id: editItem.category_id || null,
      supplier_id: editItem.supplier_id || null,
      unit: editItem.unit || 'pcs',
      image_url: editItem.image_url || null,
    };

    updateProductMutation.mutate({ id: editItem.id, updates });
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || !adjustQty) return;
    adjustStockMutation.mutate({
      productId: adjustItem.id,
      type: adjustType,
      quantity: parseInt(adjustQty, 10),
      reason: adjustReason,
    });
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || !poAmount) return;
    createPOMutation.mutate({
      supplierId: poSupplierId,
      amount: parseFloat(poAmount),
    });
  };

  const handlePOStatusUpdate = async (id: string, status: 'ordered' | 'received' | 'returned') => {
    await inventoryService.updatePOStatus(id, status);
    queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    toast.success('Status Updated', `Purchase Order marked as ${status}.`);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filter, Sort, Paginate Products
  const processedProducts = useMemo(() => {
    const q = search.toLowerCase();
    let result = products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));

      const matchCat = !selectedCategory || p.category_id === selectedCategory;

      const stock = p.current_stock ?? p.stock_quantity ?? 0;
      const minStock = p.minimum_stock ?? p.reorder_level ?? 5;

      let matchStock = true;
      if (stockStatusFilter === 'in_stock') matchStock = stock > minStock;
      if (stockStatusFilter === 'low_stock') matchStock = stock > 0 && stock <= minStock;
      if (stockStatusFilter === 'out_of_stock') matchStock = stock <= 0;

      return matchSearch && matchCat && matchStock;
    });

    result.sort((a: any, b: any) => {
      let aVal = a[sortKey] ?? '';
      let bVal = b[sortKey] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, search, selectedCategory, stockStatusFilter, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedProducts.length / pageSize);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedProducts.slice(start, start + pageSize);
  }, [processedProducts, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    for (const id of selectedIds) {
      await productService.deleteProduct(id);
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['nearExpiry'] });
    toast.success('Bulk Delete Complete', `Deleted ${selectedIds.length} products.`);
    setSelectedIds([]);
    setIsBulkDeleting(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            <span>Inventory & Asset Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Real-time stock valuation, reorder alerts, shelf-life monitoring, and purchase orders</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsPOOpen(true)} variant="outline" size="md">
            <Truck className="w-4 h-4 mr-1.5" />
            New Purchase Order
          </Button>
          <Button onClick={() => { resetAddForm(); setIsAddOpen(true); }} variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Metric Cards Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Stock Valuation</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(metrics.totalValuation)}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active SKU Catalog</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.totalSKUs} Items</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Low Stock Alerts</p>
              <h3 className="text-2xl font-black text-amber-900 mt-1">{metrics.lowStockCount} Products</h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Shelf Expiry Watchlist</p>
              <h3 className="text-2xl font-black text-red-900 mt-1">{metrics.expiringCount} Products</h3>
            </div>
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: 'products', label: `Product Catalog (${products.length})`, icon: Package },
          { id: 'analytics', label: 'Inventory Analytics & Charts', icon: BarChart3 },
          { id: 'movements', label: 'Stock Movement Logs', icon: ArrowRightLeft },
          { id: 'purchase_orders', label: `Purchase Orders (${purchaseOrders.length})`, icon: Truck },
          { id: 'expiry', label: `Expiry Watchlist (${expiryProducts.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
        <div className="space-y-4">
          {/* Professional Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
              <TableSearch
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                placeholder="Search product, SKU, barcode..."
                className="w-full sm:w-72"
              />

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock Normal</option>
                <option value="low_stock">Low Stock Warning</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Layout View Switcher */}
            <div className="flex space-x-1 border border-slate-200 p-1 rounded-xl bg-slate-50 self-end md:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table View Mode */}
          {viewMode === 'table' ? (
            <Card className="p-0 overflow-hidden border border-slate-200">
              <TableBulkActions
                selectedCount={selectedIds.length}
                onClear={() => setSelectedIds([])}
                actions={
                  <Button variant="danger" size="sm" onClick={() => setIsBulkDeleting(true)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete Selected
                  </Button>
                }
              />

              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <th className="p-3.5 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === paginatedProducts.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <SortableTableHead sortKey="name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Product Name
                      </SortableTableHead>
                      <SortableTableHead sortKey="sku" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        SKU / Barcode
                      </SortableTableHead>
                      <SortableTableHead sortKey="buying_price" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Buying Price
                      </SortableTableHead>
                      <SortableTableHead sortKey="selling_price" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Selling Price
                      </SortableTableHead>
                      <SortableTableHead sortKey="current_stock" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Current Stock & Gauge
                      </SortableTableHead>
                      <SortableTableHead sortKey="expiry_date" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                        Expiry Status
                      </SortableTableHead>
                      <th className="p-3.5 text-right font-black text-slate-700">Actions</th>
                    </TableRow>
                  </TableHeader>
                  {isProductsLoading ? (
                    <TableSkeleton rows={5} cols={8} />
                  ) : paginatedProducts.length === 0 ? (
                    <TableBody>
                      <TableEmptyState
                        title="No inventory products found"
                        description="No product records match your search or filter selection."
                        icon={Package}
                        actionButton={
                          <Button variant="outline" size="sm" onClick={() => { resetAddForm(); setIsAddOpen(true); }}>
                            <Plus className="w-4 h-4 mr-1" /> Add Product
                          </Button>
                        }
                        colSpan={8}
                      />
                    </TableBody>
                  ) : (
                    <TableBody>
                      {paginatedProducts.map((p) => {
                        const isSelected = selectedIds.includes(p.id);
                        const stock = p.current_stock ?? p.stock_quantity ?? 0;
                        const minStock = p.minimum_stock ?? p.reorder_level ?? 5;
                        const buying = p.buying_price ?? p.cost_price ?? 0;
                        const expStatus = getExpiryStatus(p.expiry_date);

                        return (
                          <TableRow key={p.id} className={isSelected ? 'bg-blue-50/50' : ''}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOne(p.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-extrabold text-slate-900">{p.name}</TableCell>
                            <TableCell className="font-mono text-slate-500">
                              <div>{p.sku || 'N/A'}</div>
                              <div className="text-[10px] text-slate-400">{p.barcode}</div>
                            </TableCell>
                            <TableCell>{formatCurrency(buying)}</TableCell>
                            <TableCell className="font-bold text-slate-900">{formatCurrency(p.selling_price)}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-black">
                                  <span>{stock} Pcs</span>
                                  {stock <= 0 ? (
                                    <span className="text-red-600 text-[10px]">OUT OF STOCK</span>
                                  ) : stock <= minStock ? (
                                    <span className="text-amber-600 text-[10px]">LOW STOCK</span>
                                  ) : (
                                    <span className="text-emerald-600 text-[10px]">NORMAL</span>
                                  )}
                                </div>
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      stock <= 0 ? 'bg-red-500' : stock <= minStock ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, (stock / (minStock * 3)) * 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {expStatus === 'expired' && <Badge variant="danger">EXPIRED</Badge>}
                              {expStatus === 'expires_today' && <Badge variant="warning">EXPIRES TODAY</Badge>}
                              {expStatus === 'within_7_days' && <Badge variant="warning">EXP 7 DAYS</Badge>}
                              {expStatus === 'within_30_days' && <Badge variant="info">EXP 30 DAYS</Badge>}
                              {expStatus === 'safe' && <Badge variant="success">SAFE</Badge>}
                              {!p.expiry_date && <span className="text-slate-400 text-xs">-</span>}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="outline" size="sm" onClick={() => setAdjustItem(p)}>
                                Adjust
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setEditItem(p)}>
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteTarget(p)}
                                className="text-red-600 hover:bg-red-50 hover:border-red-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  )}
                </Table>
              </TableContainer>

              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={processedProducts.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </Card>
          ) : (
            /* Modern Grid Cards View Mode */
            <div className="space-y-4">
              {isProductsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-56 bg-slate-200 rounded-3xl animate-pulse"></div>
                  ))}
                </div>
              ) : paginatedProducts.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-black text-slate-700">No inventory products found</p>
                  <p className="text-xs text-slate-400 mt-1">No product records match your filter criteria.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {paginatedProducts.map((p) => {
                    const stock = p.current_stock ?? p.stock_quantity ?? 0;
                    const minStock = p.minimum_stock ?? p.reorder_level ?? 5;
                    const buying = p.buying_price ?? p.cost_price ?? 0;
                    const expStatus = getExpiryStatus(p.expiry_date);
                    const margin = p.selling_price > 0 ? (((p.selling_price - buying) / p.selling_price) * 100).toFixed(0) : '0';

                    return (
                      <Card key={p.id} className="p-4 border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between space-y-3">
                        <div>
                          {/* Card Header & Badges */}
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="flex items-center space-x-2">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-xl object-cover border" />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-black text-sm text-slate-900 line-clamp-1">{p.name}</h3>
                                <p className="text-[10px] text-slate-400 font-mono">{p.sku || p.barcode || 'NO SKU'}</p>
                              </div>
                            </div>
                            {stock <= 0 ? (
                              <Badge variant="danger">OUT OF STOCK</Badge>
                            ) : stock <= minStock ? (
                              <Badge variant="warning">LOW STOCK</Badge>
                            ) : (
                              <Badge variant="success">IN STOCK</Badge>
                            )}
                          </div>

                          {/* Price & Margin Breakdown */}
                          <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100 text-xs">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Cost</p>
                              <p className="font-extrabold text-slate-700">{formatCurrency(buying)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Selling</p>
                              <p className="font-black text-slate-900">{formatCurrency(p.selling_price)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Margin</p>
                              <p className="font-extrabold text-emerald-600">{margin}%</p>
                            </div>
                          </div>

                          {/* Stock Level Progress Bar */}
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs font-black">
                              <span className="text-slate-600">Stock Qty:</span>
                              <span className="text-slate-900">{stock} Pcs</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  stock <= 0 ? 'bg-red-500' : stock <= minStock ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, (stock / (minStock * 3)) * 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Expiry Warning */}
                          {p.expiry_date && (
                            <div className="mt-2 text-xs">
                              {expStatus === 'expired' && <span className="text-red-600 font-extrabold flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Expired ({p.expiry_date})</span>}
                              {expStatus === 'expires_today' && <span className="text-amber-600 font-extrabold flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Expires Today</span>}
                              {expStatus === 'within_7_days' && <span className="text-amber-600 font-bold flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Exp 7d ({p.expiry_date})</span>}
                              {expStatus === 'within_30_days' && <span className="text-blue-600 font-bold flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Exp 30d ({p.expiry_date})</span>}
                            </div>
                          )}
                        </div>

                        {/* Card Touch Actions */}
                        <div className="flex space-x-1.5 pt-3 border-t border-slate-100">
                          <Button variant="outline" size="sm" onClick={() => setAdjustItem(p)} className="flex-1 text-xs">
                            Adjust
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditItem(p)} className="text-xs">
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(p)}
                            className="text-red-600 hover:bg-red-50 hover:border-red-200 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Grid Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200 text-xs font-bold shadow-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-slate-600 font-extrabold">Page {currentPage} of {totalPages}</span>
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
      )}

      {/* Tab 2: Analytics & Charts */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stock Valuation by Category Chart */}
          <Card className="p-5 border border-slate-200">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center space-x-2 text-base font-black text-slate-900">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Stock Valuation by Category (KES)</span>
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium">Asset value allocation across store product categories</p>
            </CardHeader>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryValuationData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `KES ${v}`} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Stock Status Health Distribution */}
          <Card className="p-5 border border-slate-200">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center space-x-2 text-base font-black text-slate-900">
                <PieChartIcon className="w-5 h-5 text-emerald-600" />
                <span>Inventory Health Distribution</span>
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium">Breakdown of active catalog stock statuses</p>
            </CardHeader>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}>
                    {stockDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 text-xs font-bold border-t pt-3">
              {stockDistributionData.map((st) => (
                <div key={st.name} className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }}></span>
                  <span>{st.name} ({st.value})</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Stock Movement Logs */}
      {activeTab === 'movements' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="p-3.5 text-left font-black text-slate-700">Date & Time</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Product</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Movement Type</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Quantity</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Notes / Reason</th>
                </TableRow>
              </TableHeader>
              {isTxLoading ? (
                <TableSkeleton rows={5} cols={5} />
              ) : transactions.length === 0 ? (
                <TableBody>
                  <TableEmptyState
                    title="No stock movements recorded"
                    description="Movement transactions will automatically record during sales or stock adjustments."
                    icon={ArrowRightLeft}
                    colSpan={5}
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-slate-500 font-mono">{formatDateTime(tx.created_at)}</TableCell>
                      <TableCell className="font-bold text-slate-900">{tx.product?.name || 'Product'}</TableCell>
                      <TableCell>
                        <Badge variant="info" className="uppercase">
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-slate-900">{tx.quantity}</TableCell>
                      <TableCell className="text-slate-500 font-medium">{tx.notes || tx.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 4: Purchase Orders */}
      {activeTab === 'purchase_orders' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="p-3.5 text-left font-black text-slate-700">PO Number</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Supplier</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Order Date</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Total Amount</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Status</th>
                  <th className="p-3.5 text-right font-black text-slate-700">Actions</th>
                </TableRow>
              </TableHeader>
              {isPOLoading ? (
                <TableSkeleton rows={5} cols={6} />
              ) : purchaseOrders.length === 0 ? (
                <TableBody>
                  <TableEmptyState
                    title="No purchase orders found"
                    description="Click 'New Purchase Order' button above to generate a PO."
                    icon={PackageCheck}
                    colSpan={6}
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-extrabold text-slate-900">{po.order_number || po.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-bold text-slate-700">{po.supplier?.name || 'Vendor'}</TableCell>
                      <TableCell className="text-slate-500 font-mono">{formatDateTime(po.created_at)}</TableCell>
                      <TableCell className="font-black text-slate-900">{formatCurrency(po.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === 'received' ? 'success' : 'info'} className="uppercase">
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {po.status === 'ordered' && (
                          <Button size="sm" variant="primary" onClick={() => handlePOStatusUpdate(po.id, 'received')}>
                            Mark Received
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 5: Expiry Warnings */}
      {activeTab === 'expiry' && <ExpiryWatchlistSection products={products} />}

      {/* Create Product Modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Inventory Product">
        <form onSubmit={handleCreateProduct} className="space-y-4 font-sans">
          <Input isFloating label="Product Name" value={name} onChange={(e) => setName(e.target.value)} icon={<Package className="w-4 h-4" />} required />
          <div className="grid grid-cols-2 gap-3">
            <Input isFloating label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} icon={<Barcode className="w-4 h-4" />} placeholder="Auto-generated" />
            <Input isFloating label="SKU Code" value={sku} onChange={(e) => setSku(e.target.value)} icon={<Tag className="w-4 h-4" />} placeholder="Auto-generated" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input isFloating label="Buying Price (KES)" type="number" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} icon={<DollarSign className="w-4 h-4" />} required />
            <Input isFloating label="Selling Price (KES)" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} icon={<DollarSign className="w-4 h-4" />} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input isFloating label="Initial Stock Qty" type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} required />
            <Input isFloating label="Minimum Reorder Stock" type="number" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} />
          </div>
          <Input isFloating label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} icon={<Calendar className="w-4 h-4" />} />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createProductMutation.isPending}>
              {createProductMutation.isPending ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Product Modal */}
      {editItem && (
        <Dialog isOpen={!!editItem} onClose={() => setEditItem(null)} title={`Edit Product — ${editItem.name}`}>
          <form onSubmit={handleUpdateProduct} className="space-y-4 font-sans">
            <Input
              isFloating
              label="Product Name"
              value={editItem.name}
              onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
              icon={<Package className="w-4 h-4" />}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                isFloating
                label="Barcode"
                value={editItem.barcode || ''}
                onChange={(e) => setEditItem({ ...editItem, barcode: e.target.value })}
                icon={<Barcode className="w-4 h-4" />}
              />
              <Input
                isFloating
                label="SKU Code"
                value={editItem.sku || ''}
                onChange={(e) => setEditItem({ ...editItem, sku: e.target.value })}
                icon={<Tag className="w-4 h-4" />}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                isFloating
                label="Buying Price (KES)"
                type="number"
                value={editItem.buying_price ?? editItem.cost_price ?? ''}
                onChange={(e) => setEditItem({ ...editItem, buying_price: parseFloat(e.target.value) || 0 })}
                icon={<DollarSign className="w-4 h-4" />}
                required
              />
              <Input
                isFloating
                label="Selling Price (KES)"
                type="number"
                value={editItem.selling_price ?? ''}
                onChange={(e) => setEditItem({ ...editItem, selling_price: parseFloat(e.target.value) || 0 })}
                icon={<DollarSign className="w-4 h-4" />}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                isFloating
                label="Current Stock"
                type="number"
                value={editItem.current_stock ?? editItem.stock_quantity ?? ''}
                onChange={(e) => setEditItem({ ...editItem, current_stock: parseInt(e.target.value, 10) || 0 })}
                required
              />
              <Input
                isFloating
                label="Minimum Reorder Stock"
                type="number"
                value={editItem.minimum_stock ?? editItem.reorder_level ?? ''}
                onChange={(e) => setEditItem({ ...editItem, minimum_stock: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <Input
              isFloating
              label="Expiry Date"
              type="date"
              value={editItem.expiry_date || ''}
              onChange={(e) => setEditItem({ ...editItem, expiry_date: e.target.value })}
              icon={<Calendar className="w-4 h-4" />}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={updateProductMutation.isPending}>
                {updateProductMutation.isPending ? 'Updating...' : 'Save Product Updates'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <Dialog isOpen={!!adjustItem} onClose={() => setAdjustItem(null)} title={`Stock Adjustment — ${adjustItem.name}`}>
          <form onSubmit={handleAdjustStock} className="space-y-4 font-sans">
            <Select
              isFloating
              label="Adjustment Movement Type"
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as any)}
              options={[
                { value: 'in', label: 'Stock Addition (+ Qty)' },
                { value: 'out', label: 'Stock Deduction (- Qty)' },
                { value: 'damaged', label: 'Damaged Goods (- Qty)' },
                { value: 'expired', label: 'Expired Goods (- Qty)' },
              ]}
            />

            <Input
              isFloating
              label="Quantity Adjustment Qty"
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="e.g. 50"
              required
            />

            <Input
              isFloating
              label="Reason / Reference Note"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              icon={<FileText className="w-4 h-4" />}
              placeholder="e.g. Received shipment PO-102"
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setAdjustItem(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={adjustStockMutation.isPending}>
                {adjustStockMutation.isPending ? 'Recording...' : 'Record Movement'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Create Purchase Order Modal */}
      <Dialog isOpen={isPOOpen} onClose={() => setIsPOOpen(false)} title="Create Vendor Purchase Order">
        <form onSubmit={handleCreatePO} className="space-y-4 font-sans">
          <Select
            isFloating
            label="Select Supplier"
            value={poSupplierId}
            onChange={(e) => setPoSupplierId(e.target.value)}
            icon={<Truck className="w-4 h-4" />}
            options={supplierOptions}
            required
          />

          <Input isFloating label="Estimated Order Amount (KES)" type="number" value={poAmount} onChange={(e) => setPoAmount(e.target.value)} icon={<DollarSign className="w-4 h-4" />} required />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsPOOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createPOMutation.isPending}>
              {createPOMutation.isPending ? 'Generating PO...' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteProductMutation.mutateAsync(deleteTarget.id);
          }
        }}
        title="Delete Product Line"
        message={`Are you sure you want to delete product "${deleteTarget?.name}"? Stock inventory metrics and transactions will be affected.`}
        confirmText="Delete Product"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        onConfirm={confirmBulkDelete}
        title="Bulk Delete Inventory Products"
        message={`Are you sure you want to delete all ${selectedIds.length} selected inventory products? This operation cannot be undone.`}
        confirmText="Delete Selected"
        variant="danger"
      />
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
    <Card className="p-0 overflow-hidden border border-slate-200 font-sans">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <CardTitle>Product Expiry Monitoring & Risk Watchlist</CardTitle>
          <p className="text-xs text-slate-500 font-medium">Automatically tracking shelf-life, expiration dates, and disposal warnings</p>
        </div>
        <div className="flex space-x-1 border p-1 rounded-xl bg-white text-xs font-bold">
          <button
            onClick={() => setExpiryFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${expiryFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            All ({productsWithExpiry.length})
          </button>
          <button
            onClick={() => setExpiryFilter('expired')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${expiryFilter === 'expired' ? 'bg-red-600 text-white shadow-xs' : 'text-red-700 hover:bg-red-50'}`}
          >
            Expired
          </button>
          <button
            onClick={() => setExpiryFilter('soon')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${expiryFilter === 'soon' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'}`}
          >
            Expiring Soon
          </button>
          <button
            onClick={() => setExpiryFilter('safe')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${expiryFilter === 'safe' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'}`}
          >
            Safe
          </button>
        </div>
      </div>

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <th className="p-3.5 text-left font-black text-slate-700">Product Name</th>
              <th className="p-3.5 text-left font-black text-slate-700">Barcode / SKU</th>
              <th className="p-3.5 text-left font-black text-slate-700">Expiry Date</th>
              <th className="p-3.5 text-left font-black text-slate-700">Current Stock</th>
              <th className="p-3.5 text-left font-black text-slate-700">Monitoring Status</th>
            </TableRow>
          </TableHeader>
          {filteredProducts.length === 0 ? (
            <TableBody>
              <TableEmptyState
                title="No items match expiry watchlist filter"
                description="Selected shelf expiry filter returned zero products."
                icon={Clock}
                colSpan={5}
              />
            </TableBody>
          ) : (
            <TableBody>
              {filteredProducts.map((p) => {
                const status = getExpiryStatus(p.expiry_date);

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-extrabold text-slate-900">{p.name}</TableCell>
                    <TableCell className="font-mono text-slate-500">{p.barcode || p.sku}</TableCell>
                    <TableCell className="font-bold text-slate-800">{p.expiry_date}</TableCell>
                    <TableCell className="font-black text-slate-900">{p.current_stock ?? p.stock_quantity ?? 0} Pcs</TableCell>
                    <TableCell>
                      {status === 'expired' && <Badge variant="danger">EXPIRED - REMOVE</Badge>}
                      {status === 'expires_today' && <Badge variant="warning">EXPIRES TODAY</Badge>}
                      {status === 'within_7_days' && <Badge variant="warning">EXPIRES IN 7 DAYS</Badge>}
                      {status === 'within_30_days' && <Badge variant="info">EXPIRES IN 30 DAYS</Badge>}
                      {status === 'safe' && <Badge variant="success">SAFE (&gt;30 DAYS)</Badge>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          )}
        </Table>
      </TableContainer>
    </Card>
  );
}
