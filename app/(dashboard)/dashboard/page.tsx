'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { saleService } from '@/services/saleService';
import { inventoryService } from '@/services/inventoryService';
import { productService } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { formatCurrency, formatDateTime, getExpiryStatus } from '@/lib/utils';
import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  Activity,
  ShoppingCart,
  Package,
  Users,
  BarChart2,
  Receipt,
  Truck,
  UserCheck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  PackageX,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const role = user?.role || 'cashier';
  const roleCategory = user ? authService.getRoleCategory(user.role) : 'Employee';

  // Permission flags
  const canViewReports = hasPermission('reports.view');
  const canCreateSales = hasPermission('sales.create');
  const canManageInventory = hasPermission('inventory.manage') || hasPermission('products.view');
  const canManageExpenses = hasPermission('expenses.manage');
  const canManageCustomers = hasPermission('customers.manage');
  const canManageSuppliers = hasPermission('suppliers.manage');
  const canManageEmployees = hasPermission('employees.manage');

  // Queries
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['salesMetrics'],
    queryFn: () => saleService.getSalesMetrics(),
    enabled: canViewReports || canCreateSales,
  });

  const { data: reportMetrics } = useQuery({
    queryKey: ['financialReportMetrics'],
    queryFn: () => saleService.getComprehensiveFinancialReport(),
    enabled: canViewReports || canManageExpenses,
  });

  const { data: recentSales = [], isLoading: isSalesLoading } = useQuery({
    queryKey: ['recentSales'],
    queryFn: () => saleService.getRecentSales(5),
    enabled: canCreateSales || canViewReports,
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
    enabled: canManageInventory,
  });

  // Calculate Expiry & Stock Metrics
  const expiredProducts = products.filter((p) => {
    const st = getExpiryStatus(p.expiry_date);
    return st === 'expired' || st === 'expires_today';
  });
  const expiring7Days = products.filter((p) => getExpiryStatus(p.expiry_date) === 'within_7_days');
  const expiring30Days = products.filter((p) => getExpiryStatus(p.expiry_date) === 'within_30_days');
  const outOfStockProducts = products.filter((p) => (p.current_stock ?? p.stock_quantity ?? 0) <= 0);
  const lowStockProducts = products.filter((p) => {
    const stock = p.current_stock ?? p.stock_quantity ?? 0;
    const min = p.minimum_stock ?? p.reorder_level ?? 5;
    return stock > 0 && stock <= min;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {role === 'supermarket_owner'
                ? 'Supermarket Executive Dashboard'
                : role === 'cashier'
                ? 'Cashier Terminal Workspace'
                : role === 'store_keeper'
                ? 'Store Keeper Inventory Hub'
                : role === 'accountant'
                ? 'Accountant Financial Ledger'
                : role === 'inventory_manager'
                ? 'Inventory Manager Hub'
                : `${role.replace('_', ' ').toUpperCase()} Dashboard`}
            </h1>
            <Badge variant="info" className="uppercase text-[10px] font-black">
              {roleCategory}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, <span className="font-extrabold text-slate-900">{user?.name}</span> ({user?.role?.replace('_', ' ')})
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>RBAC Permission Guard Active</span>
        </div>
      </div>

      {/* Role-Based Quick Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {canCreateSales && (
          <Link
            href="/pos"
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl shadow-sm transition-all"
          >
            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-extrabold leading-tight">Launch POS</p>
              <p className="text-[10px] text-emerald-100 font-medium">Sales Register</p>
            </div>
          </Link>
        )}

        {canManageInventory && (
          <Link
            href="/inventory"
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-2xl shadow-sm transition-all"
          >
            <Package className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-extrabold leading-tight">Stock Audit</p>
              <p className="text-[10px] text-slate-400 font-medium">Products</p>
            </div>
          </Link>
        )}

        {canManageCustomers && (
          <Link
            href="/customers"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-sm transition-all"
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-extrabold leading-tight">Customers</p>
              <p className="text-[10px] text-blue-100 font-medium">Store Credit</p>
            </div>
          </Link>
        )}

        {canViewReports && (
          <Link
            href="/reports"
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-2xl shadow-sm transition-all"
          >
            <BarChart2 className="w-5 h-5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-extrabold leading-tight">Reports</p>
              <p className="text-[10px] text-purple-100 font-medium">Financial P&L</p>
            </div>
          </Link>
        )}

        {canManageExpenses && (
          <Link
            href="/expenses"
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-2xl shadow-sm transition-all"
          >
            <Receipt className="w-5 h-5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-extrabold leading-tight">Expenses</p>
              <p className="text-[10px] text-amber-100 font-medium">Store Ledger</p>
            </div>
          </Link>
        )}

        {canManageSuppliers && (
          <Link
            href="/suppliers"
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-2xl shadow-sm transition-all"
          >
            <Truck className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-extrabold leading-tight">Suppliers</p>
              <p className="text-[10px] text-slate-400 font-medium">Purchase Orders</p>
            </div>
          </Link>
        )}
      </div>

      {/* Permission Section 1: Revenue Metrics Cards (Visible if reports.view or sales.create) */}
      {(canViewReports || canCreateSales) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-600 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Revenue</p>
                {isMetricsLoading ? (
                  <Skeleton className="h-8 w-32 mt-2" />
                ) : (
                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    {formatCurrency(metrics?.todayRevenue || 0)}
                  </h2>
                )}
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-emerald-600 font-bold">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>Today's active register sales</span>
            </div>
          </Card>

          {canViewReports && (
            <>
              <Card className="border-l-4 border-l-emerald-600 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Revenue (7 Days)</p>
                    {isMetricsLoading ? (
                      <Skeleton className="h-8 w-32 mt-2" />
                    ) : (
                      <h2 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(metrics?.weeklyRevenue || 0)}</h2>
                    )}
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>7-day rolling window</span>
                </div>
              </Card>

              <Card className="border-l-4 border-l-purple-600 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Revenue (30 Days)</p>
                    {isMetricsLoading ? (
                      <Skeleton className="h-8 w-32 mt-2" />
                    ) : (
                      <h2 className="text-2xl font-black text-purple-900 mt-1">{formatCurrency(metrics?.monthlyRevenue || 0)}</h2>
                    )}
                  </div>
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-purple-700 font-semibold">
                  <span>Monthly store performance</span>
                </div>
              </Card>
            </>
          )}

          {canManageInventory && (
            <Card className="border-l-4 border-l-amber-600 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Warnings</p>
                  {isProductsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <h2 className="text-2xl font-black text-amber-600 mt-1">{lowStockProducts.length}</h2>
                  )}
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-amber-700 font-semibold">
                <span>Items below reorder point</span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Inventory & Expiry Health Monitoring Widgets */}
      {canManageInventory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="bg-red-50 border-red-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-extrabold text-red-700 uppercase">Expired Products</p>
                <h3 className="text-2xl font-black text-red-900 mt-1">{expiredProducts.length}</h3>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-[10px] text-red-600 font-bold mt-2">Requires immediate disposal</p>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-extrabold text-amber-800 uppercase">Expires in 7 Days</p>
                <h3 className="text-2xl font-black text-amber-900 mt-1">{expiring7Days.length}</h3>
              </div>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-[10px] text-amber-700 font-bold mt-2">Urgent clearance needed</p>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-extrabold text-blue-800 uppercase">Expires in 30 Days</p>
                <h3 className="text-2xl font-black text-blue-900 mt-1">{expiring30Days.length}</h3>
              </div>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[10px] text-blue-700 font-bold mt-2">Monitor shelf rotation</p>
          </Card>

          <Card className="bg-amber-500 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-extrabold uppercase text-amber-100">Low Stock Products</p>
                <h3 className="text-2xl font-black text-white mt-1">{lowStockProducts.length}</h3>
              </div>
              <AlertCircle className="w-5 h-5 text-amber-200" />
            </div>
            <p className="text-[10px] text-amber-100 font-bold mt-2">Reorder threshold alert</p>
          </Card>

          <Card className="bg-slate-900 text-white border-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-extrabold text-red-400 uppercase">Out of Stock</p>
                <h3 className="text-2xl font-black text-red-400 mt-1">{outOfStockProducts.length}</h3>
              </div>
              <PackageX className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-2">Zero stock quantity</p>
          </Card>
        </div>
      )}

      {/* Permission Section 2: Financial Net Profit Overview (Visible if reports.view or expenses.manage) */}
      {(canViewReports || canManageExpenses) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900 text-white">
            <p className="text-xs font-bold text-slate-400 uppercase">Gross Sales Revenue</p>
            <h3 className="text-2xl font-black text-blue-400 mt-1">{formatCurrency(reportMetrics?.grossSales || 0)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Discounts: -{formatCurrency(reportMetrics?.totalDiscounts || 0)}</p>
          </Card>

          <Card className="bg-slate-900 text-white">
            <p className="text-xs font-bold text-slate-400 uppercase">Operational Expenses</p>
            <h3 className="text-2xl font-black text-red-400 mt-1">{formatCurrency(reportMetrics?.totalExpenses || 0)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Store bills & operational costs</p>
          </Card>

          <Card className="bg-slate-900 text-white border-2 border-emerald-500">
            <p className="text-xs font-bold text-emerald-400 uppercase">Net Profit</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(reportMetrics?.netProfit || 0)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Calculated after COGS & Expenses</p>
          </Card>
        </div>
      )}

      {/* Permission Section 3: Interactive Sales Chart (Visible if reports.view) */}
      {canViewReports && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Revenue Performance Trend</CardTitle>
          </CardHeader>
          <SalesChart />
        </Card>
      )}

      {/* Permission Section 4: Grid (Recent Sales & Low Stock Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions (Visible if sales.create or reports.view) */}
        {(canCreateSales || canViewReports) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Register Sales</CardTitle>
              {canCreateSales && (
                <Link href="/pos">
                  <Button variant="outline" size="sm" className="text-xs font-bold">
                    Open Register <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {isSalesLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recentSales.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No sales recorded yet today.</p>
              ) : (
                recentSales.map((sale) => (
                  <div key={sale.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-slate-900">{sale.invoice_number || sale.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(sale.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{formatCurrency(sale.net_amount ?? sale.total_amount ?? 0)}</p>
                      <Badge variant="success" className="uppercase text-[9px] mt-0.5">
                        {sale.payment_method}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Low Stock Items (Visible if inventory.manage or products.view) */}
        {canManageInventory && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventory Restock Alerts</CardTitle>
              <Link href="/inventory">
                <Button variant="outline" size="sm" className="text-xs font-bold">
                  Manage Products <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {isProductsLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : lowStockProducts.length === 0 ? (
                <p className="text-xs text-emerald-600 font-semibold py-6 text-center">
                  All inventory items are well stocked!
                </p>
              ) : (
                lowStockProducts.map((prod) => (
                  <div key={prod.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-slate-900">{prod.name}</p>
                      <p className="text-[10px] text-slate-400">Reorder threshold: {prod.minimum_stock ?? prod.reorder_level ?? 5}</p>
                    </div>
                    <Badge variant="danger">{prod.current_stock ?? prod.stock_quantity ?? 0} Left</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
