'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { saleService } from '@/services/saleService';
import { inventoryService } from '@/services/inventoryService';
import { productService } from '@/services/productService';
import { customerService } from '@/services/customerService';
import { supplierService } from '@/services/supplierService';
import { auditService } from '@/services/auditService';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge, RoleBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTitle, SectionTitle, BodyText, CaptionText, SmallLabel } from '@/components/ui/typography';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { formatCurrency, formatDateTime, getExpiryStatus } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  AlertTriangle,
  Clock,
  Package,
  ArrowRight,
  ShieldCheck,
  Activity,
  PackageX,
  AlertCircle,
  Truck,
  Receipt,
  CheckCircle2,
  FileText,
  UserCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const role = user?.role || 'cashier';

  // Permission flags
  const canViewReports = hasPermission('reports.view');
  const canCreateSales = hasPermission('sales.create');
  const canManageInventory = hasPermission('inventory.manage') || hasPermission('products.view');
  const canManageExpenses = hasPermission('expenses.manage');
  const canManageCustomers = hasPermission('customers.manage');
  const canManageSuppliers = hasPermission('suppliers.manage');

  // Queries
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['salesMetrics'],
    queryFn: () => saleService.getSalesMetrics(),
    enabled: canViewReports || canCreateSales,
  });

  const { data: reportMetrics, isLoading: isReportLoading } = useQuery({
    queryKey: ['financialReportMetrics'],
    queryFn: () => saleService.getComprehensiveFinancialReport(),
    enabled: canViewReports || canManageExpenses,
  });

  const { data: recentSales = [], isLoading: isSalesLoading } = useQuery({
    queryKey: ['recentSales'],
    queryFn: () => saleService.getRecentSales(6),
    enabled: canCreateSales || canViewReports,
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
    enabled: canManageInventory,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    enabled: canManageCustomers,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers(),
    enabled: canManageSuppliers,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['recentAuditLogs'],
    queryFn: () => auditService.getAuditLogs(6),
  });

  // Calculate Expiry & Stock Metrics
  const expiredProducts = products.filter((p) => {
    const st = getExpiryStatus(p.expiry_date);
    return st === 'expired' || st === 'expires_today';
  });

  const lowStockProducts = products.filter((p) => {
    const stock = p.current_stock ?? p.stock_quantity ?? 0;
    const min = p.minimum_stock ?? p.reorder_level ?? 5;
    return stock > 0 && stock <= min;
  });

  const debtors = customers.filter((c) => (c.balance || c.current_debt || 0) > 0);
  const totalDebtorBalance = debtors.reduce((sum, c) => sum + (c.balance || c.current_debt || 0), 0);

  // Top products calculation from current inventory
  const topProducts = [...products]
    .sort((a, b) => (b.selling_price || 0) * (b.current_stock || 0) - (a.selling_price || 0) * (a.current_stock || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <PageTitle>Executive Overview</PageTitle>
            <RoleBadge role={role} />
          </div>
          <CaptionText className="mt-1">
            Realtime business intelligence for <span className="font-extrabold text-slate-900">{user?.name}</span>
          </CaptionText>
        </div>
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-xs">
          <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Supermarket Engine Operational</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1: TODAY'S KEY EXECUTIVE METRICS
      ══════════════════════════════════════════════════════════ */}
      <div>
        <SmallLabel className="mb-2.5 block">Section 1 — Today's Summary</SmallLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Today's Sales */}
          <Card className="border-l-4 border-l-blue-600 hover:border-l-blue-700">
            <div className="flex justify-between items-start">
              <div>
                <SmallLabel>Today's Sales</SmallLabel>
                {isMetricsLoading ? (
                  <Skeleton className="h-8 w-32 mt-2" />
                ) : (
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {formatCurrency(metrics?.todayRevenue || 0)}
                  </h3>
                )}
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-blue-600">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>Active POS register revenue</span>
            </div>
          </Card>

          {/* 2. Today's Profit */}
          <Card className="border-l-4 border-l-emerald-600 hover:border-l-emerald-700">
            <div className="flex justify-between items-start">
              <div>
                <SmallLabel>Today's Net Profit</SmallLabel>
                {isReportLoading ? (
                  <Skeleton className="h-8 w-32 mt-2" />
                ) : (
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {formatCurrency(reportMetrics?.netProfit || 0)}
                  </h3>
                )}
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>Calculated after COGS & Expenses</span>
            </div>
          </Card>

          {/* 3. Transactions */}
          <Card className="border-l-4 border-l-purple-600 hover:border-l-purple-700">
            <div className="flex justify-between items-start">
              <div>
                <SmallLabel>Transactions</SmallLabel>
                {isMetricsLoading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {metrics?.todaySales ?? recentSales.length ?? 0}
                  </h3>
                )}
              </div>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-purple-600">
              <span>Completed store sales</span>
            </div>
          </Card>

          {/* 4. Customers */}
          <Card className="border-l-4 border-l-indigo-600 hover:border-l-indigo-700">
            <div className="flex justify-between items-start">
              <div>
                <SmallLabel>Active Customers</SmallLabel>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {customers.length || 0}
                </h3>
              </div>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-indigo-600">
              <span>Registered supermarket accounts</span>
            </div>
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2: ANALYTICS CHARTS
      ══════════════════════════════════════════════════════════ */}
      <div>
        <SmallLabel className="mb-2.5 block">Section 2 — Analytics & Trends</SmallLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sales Trend Chart</CardTitle>
                <CardDescription>Hourly register sales breakdown today</CardDescription>
              </div>
            </CardHeader>
            <SalesChart />
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue & Expense Chart</CardTitle>
                <CardDescription>Gross sales vs expenses vs net profit</CardDescription>
              </div>
            </CardHeader>
            <RevenueChart />
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3: BUSINESS ALERTS
      ══════════════════════════════════════════════════════════ */}
      <div>
        <SmallLabel className="mb-2.5 block">Section 3 — Business & Operational Alerts</SmallLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Expired Products */}
          <Card className="border-l-4 border-l-red-500">
            <div className="flex justify-between items-start">
              <div>
                <SmallLabel className="text-red-700">Expired Products</SmallLabel>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{expiredProducts.length}</h3>
              </div>
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-red-600">
              <span>Items past shelf expiry date</span>
            </div>
          </Card>

          {/* 2. Low Stock */}
          <Card className="border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start">
              <div>
                <SmallLabel className="text-amber-800">Low Stock Items</SmallLabel>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{lowStockProducts.length}</h3>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <PackageX className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-amber-700">
              <span>Items below reorder point</span>
            </div>
          </Card>

          {/* 3. Pending Purchase Orders */}
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <SmallLabel className="text-blue-700">Suppliers & POs</SmallLabel>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{suppliers.length}</h3>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-blue-600">
              <span>Active vendor supply chains</span>
            </div>
          </Card>

          {/* 4. Outstanding Debtors */}
          <Card className="border-l-4 border-l-rose-500">
            <div className="flex justify-between items-start">
              <div>
                <SmallLabel className="text-rose-700">Outstanding Debtors</SmallLabel>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{debtors.length}</h3>
              </div>
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-rose-600">
              <span>Total debt: {formatCurrency(totalDebtorBalance)}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4: RECENT SALES, TOP PRODUCTS & ACTIVITIES
      ══════════════════════════════════════════════════════════ */}
      <div>
        <SmallLabel className="mb-2.5 block">Section 4 — Operational Feeds & Activity</SmallLabel>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Recent Sales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Latest register transactions</CardDescription>
              </div>
              {canCreateSales && (
                <Link href="/pos">
                  <Button variant="ghost" size="sm" className="text-xs font-extrabold text-blue-600 hover:text-blue-700 p-0">
                    POS <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 pt-0">
              {isSalesLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recentSales.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No sales recorded today.</p>
              ) : (
                recentSales.map((sale) => (
                  <div key={sale.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-black text-slate-900">{sale.invoice_number || sale.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{formatDateTime(sale.created_at)}</p>
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
            </CardContent>
          </Card>

          {/* 2. Top Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Highest value inventory catalog</CardDescription>
              </div>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="text-xs font-extrabold text-blue-600 hover:text-blue-700 p-0">
                  Catalog <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 pt-0">
              {isProductsLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : topProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No products found.</p>
              ) : (
                topProducts.map((prod) => (
                  <div key={prod.id} className="py-3 flex justify-between items-center text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-black text-slate-900 truncate">{prod.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{formatCurrency(prod.selling_price || 0)} / unit</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={(prod.current_stock ?? prod.stock_quantity ?? 0) <= 5 ? 'warning' : 'info'}>
                        {prod.current_stock ?? prod.stock_quantity ?? 0} In Stock
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* 3. Recent Activities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Realtime audit log trail</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 pt-0">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No recent audit logs.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start space-x-2.5 text-xs">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg mt-0.5">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{log.action || 'System Action'}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
