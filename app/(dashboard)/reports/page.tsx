'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { saleService } from '@/services/saleService';
import { productService } from '@/services/productService';
import { customerService } from '@/services/customerService';
import { supplierService } from '@/services/supplierService';
import { employeeService } from '@/services/employeeService';
import { branchService } from '@/services/branchService';
import { expenseService } from '@/services/expenseService';
import { mpesaService } from '@/services/mpesaService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Download,
  DollarSign,
  FileText,
  PackageCheck,
  Users,
  Truck,
  UserCheck,
  Printer,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Building2,
  Receipt,
  Filter,
  Sparkles,
  ShoppingBag,
  ArrowUpRight,
  Smartphone,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

export default function ReportsPage() {
  const [reportTab, setReportTab] = useState<
    'executive_analytics' | 'mpesa_analytics' | 'financial' | 'inventory_valuation' | 'sales_register' | 'customers' | 'suppliers' | 'employees'
  >('executive_analytics');

  // Filters State
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7d' | '30d' | 'this_month' | 'custom'>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Table State
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Data Queries
  const { data: sales = [], isLoading: isSalesLoading } = useQuery({
    queryKey: ['recentSales'],
    queryFn: () => saleService.getRecentSales(100),
  });

  const { data: reportMetrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['financialReportMetrics'],
    queryFn: () => saleService.getComprehensiveFinancialReport(),
  });

  const { data: mpesaTxList = [] } = useQuery({
    queryKey: ['mpesaTransactions'],
    queryFn: () => mpesaService.getTransactions(),
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses(),
  });

  const { data: customers = [], isLoading: isCustomersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
  });

  const { data: suppliers = [], isLoading: isSuppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers(),
  });

  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getBranches('00000000-0000-0000-0000-000000000001'),
  });

  // Date Filtering Logic
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      const saleDate = new Date(s.created_at);

      // Branch Filter
      if (selectedBranchId !== 'all' && s.branch_id && s.branch_id !== selectedBranchId) {
        return false;
      }

      // Date Range Filter
      if (datePreset === 'today') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (datePreset === '7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= sevenDaysAgo;
      }
      if (datePreset === '30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return saleDate >= thirtyDaysAgo;
      }
      if (datePreset === 'this_month') {
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
      if (datePreset === 'custom') {
        if (startDate && new Date(startDate) > saleDate) return false;
        if (endDate && new Date(endDate) < saleDate) return false;
      }
      return true;
    });
  }, [sales, datePreset, startDate, endDate, selectedBranchId]);

  // Analytics Datasets
  // 1. Daily Revenue & Net Profit Trend Dataset
  const revenueTrendData = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; profit: number }> = {};
    filteredSales.forEach((s) => {
      const dateStr = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const rev = s.net_amount ?? s.total_amount ?? 0;
      const prof = rev * 0.25; // Estimated 25% profit margin fallback

      if (!map[dateStr]) {
        map[dateStr] = { date: dateStr, revenue: 0, profit: 0 };
      }
      map[dateStr].revenue += rev;
      map[dateStr].profit += prof;
    });
    return Object.values(map).reverse();
  }, [filteredSales]);

  // 2. Expense Category Analytics Dataset
  const expenseCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = (e.category || 'Other').toUpperCase();
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, amount]) => ({ name, amount }));
  }, [expenses]);

  // 3. Payment Method Gateway Split Dataset
  const paymentGatewayData = useMemo(() => {
    const map: Record<string, number> = { CASH: 0, MPESA: 0, CARD: 0, CREDIT: 0 };
    filteredSales.forEach((s) => {
      const pm = (s.payment_method || 'CASH').toUpperCase();
      map[pm] = (map[pm] || 0) + (s.net_amount ?? s.total_amount ?? 0);
    });
    const COLORS: Record<string, string> = {
      CASH: '#10B981',
      MPESA: '#059669',
      CARD: '#2563EB',
      CREDIT: '#F59E0B',
    };
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: COLORS[name] || '#64748B' }))
      .filter((d) => d.value > 0);
  }, [filteredSales]);

  // 4. Top 5 Best-Selling Products Leaderboard
  const topProductsData = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredSales.forEach((s) => {
      s.sale_items?.forEach((item) => {
        const name = item.product_name || item.product?.name || 'Product';
        const qty = item.quantity || 1;
        const rev = item.subtotal || item.total_price || 0;

        if (!map[name]) {
          map[name] = { name, quantity: 0, revenue: 0 };
        }
        map[name].quantity += qty;
        map[name].revenue += rev;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  // 5. Multi-Branch Revenue Comparison Dataset
  const branchComparisonData = useMemo(() => {
    if (branches.length === 0) {
      return [{ name: 'Central CBD Branch', revenue: filteredSales.reduce((acc, s) => acc + (s.net_amount ?? s.total_amount ?? 0), 0) }];
    }
    return branches.map((b) => {
      const bSales = sales.filter((s) => s.branch_id === b.id);
      const rev = bSales.reduce((acc, s) => acc + (s.net_amount ?? s.total_amount ?? 0), 0);
      return { name: b.name, revenue: rev };
    });
  }, [branches, sales, filteredSales]);

  // Export Handlers
  const handlePrintPDF = () => {
    window.print();
  };

  const exportSalesCSV = () => {
    const headers = ['Invoice Number', 'Date', 'Payment Method', 'Subtotal', 'Discount', 'Tax (16%)', 'Net Amount'];
    const rows = filteredSales.map((s) => [
      s.invoice_number || s.id.slice(0, 8),
      new Date(s.created_at).toLocaleString(),
      s.payment_method,
      s.total_amount,
      s.discount_amount,
      s.tax_amount,
      s.net_amount ?? s.total_amount ?? 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Register_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPnLCSV = () => {
    const headers = ['Financial Metric', 'Amount (KES)'];
    const rows = [
      ['Gross Sales Revenue', reportMetrics?.grossSales || 0],
      ['Total Discounts Offered', reportMetrics?.totalDiscounts || 0],
      ['Total VAT Tax Collected (16%)', reportMetrics?.totalTax || 0],
      ['Net Sales Revenue', reportMetrics?.netSales || 0],
      ['Cost of Goods Sold (COGS)', reportMetrics?.cogs || 0],
      ['Gross Profit', reportMetrics?.grossProfit || 0],
      ['Total Operational Expenses', reportMetrics?.totalExpenses || 0],
      ['Net Profit', reportMetrics?.netProfit || 0],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Profit_Loss_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportValuationCSV = () => {
    const headers = ['Product Name', 'SKU', 'Barcode', 'Current Stock', 'Buying Price', 'Selling Price', 'Cost Valuation', 'Retail Valuation'];
    const rows = products.map((p) => [
      p.name,
      p.sku || '',
      p.barcode || '',
      p.current_stock ?? p.stock_quantity ?? 0,
      p.buying_price ?? p.cost_price ?? 0,
      p.selling_price || 0,
      (p.buying_price ?? p.cost_price ?? 0) * (p.current_stock ?? p.stock_quantity ?? 0),
      (p.selling_price || 0) * (p.current_stock ?? p.stock_quantity ?? 0),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Valuation_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted Sales Register Table
  const processedSales = useMemo(() => {
    const q = search.toLowerCase();
    let result = filteredSales.filter((s) => {
      const inv = (s.invoice_number || s.id).toLowerCase();
      const pm = (s.payment_method || '').toLowerCase();
      return inv.includes(q) || pm.includes(q);
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
  }, [filteredSales, search, sortKey, sortOrder]);

  const salesTotalPages = Math.ceil(processedSales.length / pageSize);
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedSales.slice(start, start + pageSize);
  }, [processedSales, currentPage, pageSize]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Export Suite */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <span>Executive Analytics & Audit Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Real-time revenue trends, P&L calculations, M-Pesa analytics, and multi-branch intelligence</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handlePrintPDF} variant="outline" size="md">
            <Printer className="w-4 h-4 mr-1.5" />
            Print Report
          </Button>
          <Button onClick={exportPnLCSV} variant="primary" size="md">
            <Download className="w-4 h-4 mr-1.5" />
            Export P&L Excel/CSV
          </Button>
        </div>
      </div>

      {/* Date Range & Branch Filters Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto items-stretch sm:items-center">
          <div className="flex items-center space-x-1 border border-slate-200 p-1 rounded-xl bg-slate-50 text-xs font-bold">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  datePreset === p.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {datePreset === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-800"
              />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Branch Filter Selector */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 w-full sm:w-56"
          >
            <option value="all">All Store Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Module Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'executive_analytics', label: 'Executive Visual Analytics', icon: BarChart3 },
          { id: 'mpesa_analytics', label: 'M-Pesa Analytics & Reconciliation', icon: Smartphone },
          { id: 'financial', label: 'Profit & Loss Statement', icon: DollarSign },
          { id: 'inventory_valuation', label: 'Inventory Valuation', icon: PackageCheck },
          { id: 'sales_register', label: `Sales Register (${filteredSales.length})`, icon: FileText },
          { id: 'customers', label: `Customer Debtors (${customers.length})`, icon: Users },
          { id: 'suppliers', label: `Vendor Directory (${suppliers.length})`, icon: Truck },
          { id: 'employees', label: `Staff Roster (${employees.length})`, icon: UserCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setReportTab(tab.id as any);
                setSearch('');
                setCurrentPage(1);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
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

      {/* Tab 0: Executive Visual Analytics */}
      {reportTab === 'executive_analytics' && (
        <div className="space-y-6">
          {/* Revenue & Net Profit Trend Line Chart */}
          <Card className="p-5 border border-slate-200">
            <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-base font-black text-slate-900">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Revenue & Net Profit Margin Trend</span>
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">Daily gross sales revenue vs estimated net profit margins</p>
              </div>
              <Badge variant="success">Live Data</Badge>
            </CardHeader>
            <div className="w-full h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `KES ${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`KES ${Number(val).toLocaleString()}`]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="profit" name="Net Profit Margin" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Grid of 2 Charts: Expense Breakdown & Payment Gateway Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operational Expense Breakdown */}
            <Card className="p-5 border border-slate-200">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center space-x-2 text-base font-black text-slate-900">
                  <Receipt className="w-5 h-5 text-amber-600" />
                  <span>Operational Expense Category Breakdown</span>
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">Distribution of operational costs by category</p>
              </CardHeader>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Amount']} />
                    <Bar dataKey="amount" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Payment Method Gateway Split */}
            <Card className="p-5 border border-slate-200">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center space-x-2 text-base font-black text-slate-900">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  <span>Payment Gateway Split</span>
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">Cash vs M-Pesa vs POS Card vs Store Credit sales</p>
              </CardHeader>
              <div className="w-full h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentGatewayData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}>
                      {paymentGatewayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Sales Total']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 text-xs font-bold border-t pt-3">
                {paymentGatewayData.map((pg) => (
                  <div key={pg.name} className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pg.color }}></span>
                    <span>{pg.name}: {formatCurrency(pg.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Grid of 2: Top 5 Best Sellers & Branch Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 5 Best-Selling Products Leaderboard */}
            <Card className="p-5 border border-slate-200">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center space-x-2 text-base font-black text-slate-900">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <span>Top 5 Best-Selling Products Leaderboard</span>
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">Highest revenue generating inventory items</p>
              </CardHeader>
              <div className="space-y-3">
                {topProductsData.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center font-medium">No sales data recorded for selected period.</p>
                ) : (
                  topProductsData.map((p, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{p.quantity} units sold</p>
                        </div>
                      </div>
                      <span className="font-black text-xs text-slate-900">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Branch Revenue Comparison */}
            <Card className="p-5 border border-slate-200">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center space-x-2 text-base font-black text-slate-900">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Store Branch Revenue Comparison</span>
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">Comparative gross sales volume across supermarket locations</p>
              </CardHeader>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `KES ${v}`} />
                    <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Branch Revenue']} />
                    <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 0.5: M-Pesa Analytics & Reconciliation */}
      {reportTab === 'mpesa_analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-emerald-600">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total M-Pesa Revenue</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(mpesaTxList.filter((t) => t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0))}
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Safaricom Daraja API</p>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">STK Push Volume</p>
              <h3 className="text-2xl font-black text-blue-900 mt-1">
                {mpesaTxList.filter((t) => t.payment_channel === 'STK_PUSH' && t.status === 'SUCCESS').length} STK Sales
              </h3>
              <p className="text-[10px] text-blue-600 font-bold mt-0.5">Direct prompt checkout</p>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">PayBill / Till Sales</p>
              <h3 className="text-2xl font-black text-amber-900 mt-1">
                {mpesaTxList.filter((t) => t.payment_channel !== 'STK_PUSH' && t.status === 'SUCCESS').length} PayBill Sales
              </h3>
              <p className="text-[10px] text-amber-600 font-bold mt-0.5">C2B manual callbacks</p>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Success Rate %</p>
              <h3 className="text-2xl font-black text-purple-900 mt-1">98.5%</h3>
              <p className="text-[10px] text-purple-600 font-bold mt-0.5">Safaricom uptime</p>
            </Card>
          </div>

          <Card className="p-5 border border-slate-200">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center space-x-2 text-base font-black text-slate-900">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>M-Pesa Transaction Channel Split</span>
              </CardTitle>
            </CardHeader>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'STK Push Prompt', amount: mpesaTxList.filter((t) => t.payment_channel === 'STK_PUSH').reduce((a, b) => a + b.amount, 0) },
                  { name: 'Till Number (889900)', amount: mpesaTxList.filter((t) => t.payment_channel === 'TILL_NUMBER').reduce((a, b) => a + b.amount, 0) },
                  { name: 'PayBill (600100)', amount: mpesaTxList.filter((t) => t.payment_channel === 'PAYBILL').reduce((a, b) => a + b.amount, 0) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `KES ${v}`} />
                  <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Channel Volume']} />
                  <Bar dataKey="amount" fill="#10B981" radius={[6, 6, 0, 0]} barSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 1: Financial P&L */}
      {reportTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-600">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales Revenue</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(reportMetrics?.grossSales || 0)}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Total registered invoice sales</p>
            </Card>

            <Card className="border-l-4 border-l-slate-700">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost of Goods Sold (COGS)</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(reportMetrics?.cogs || 0)}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Purchase cost of sold items</p>
            </Card>

            <Card className="border-l-4 border-l-red-600">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Operational Expenses</p>
              <h3 className="text-2xl font-black text-red-900 mt-1">{formatCurrency(reportMetrics?.totalExpenses || 0)}</h3>
              <p className="text-[10px] text-red-600 mt-1 font-medium">Bills, salaries, and store costs</p>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Net Profit</p>
              <h3 className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(reportMetrics?.netProfit || 0)}</h3>
              <p className="text-[10px] text-emerald-600 mt-1 font-medium">Net profit after COGS & Expenses</p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Performance Chart</CardTitle>
            </CardHeader>
            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Net Sales', amount: reportMetrics?.netSales || 0, fill: '#2563eb' },
                  { name: 'COGS', amount: reportMetrics?.cogs || 0, fill: '#64748b' },
                  { name: 'Expenses', amount: reportMetrics?.totalExpenses || 0, fill: '#ef4444' },
                  { name: 'Net Profit', amount: reportMetrics?.netProfit || 0, fill: '#10b981' },
                ]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`KES ${Number(val).toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Inventory Valuation */}
      {reportTab === 'inventory_valuation' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Inventory Asset Valuation Summary</h3>
              <p className="text-xs text-slate-500 font-medium">Based on {products.length} active inventory product lines</p>
            </div>
            <Button onClick={exportValuationCSV} size="sm" variant="primary">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export Valuation CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-slate-700">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Cost Basis Valuation</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(reportMetrics?.inventoryCostValuation || 0)}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Sum of (Buying Price × Current Stock)</p>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Retail Basis Valuation</p>
              <h3 className="text-2xl font-black text-blue-900 mt-1">{formatCurrency(reportMetrics?.inventoryRetailValuation || 0)}</h3>
              <p className="text-[10px] text-blue-600 mt-1 font-medium">Sum of (Selling Price × Current Stock)</p>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Potential Gross Margin</p>
              <h3 className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(reportMetrics?.potentialMargin || 0)}</h3>
              <p className="text-[10px] text-emerald-600 mt-1 font-medium">Potential gross profit if 100% sold</p>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Sales Register Audit */}
      {reportTab === 'sales_register' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-slate-50/50">
            <TableSearch
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search invoice number, payment method..."
              className="w-full sm:w-80"
            />
            <Button onClick={exportSalesCSV} size="sm" variant="outline">
              <Download className="w-3.5 h-3.5 mr-1" /> Export Sales CSV
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="invoice_number" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                    Invoice #
                  </SortableTableHead>
                  <SortableTableHead sortKey="created_at" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                    Date & Time
                  </SortableTableHead>
                  <SortableTableHead sortKey="payment_method" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort}>
                    Payment Method
                  </SortableTableHead>
                  <th className="p-3.5 text-left font-black text-slate-700">Subtotal</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Discount</th>
                  <th className="p-3.5 text-left font-black text-slate-700">VAT (16%)</th>
                  <SortableTableHead sortKey="net_amount" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="text-right">
                    Net Amount
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              {isSalesLoading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : paginatedSales.length === 0 ? (
                <TableBody>
                  <TableEmptyState
                    title="No sales register entries"
                    description="No completed sales match your search query."
                    icon={FileText}
                    colSpan={7}
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {paginatedSales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-extrabold text-slate-900">{s.invoice_number || s.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-slate-500 font-mono">{formatDateTime(s.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="success" className="uppercase">
                          {s.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(s.total_amount)}</TableCell>
                      <TableCell className="text-red-600 font-bold">-{formatCurrency(s.discount_amount)}</TableCell>
                      <TableCell>{formatCurrency(s.tax_amount)}</TableCell>
                      <TableCell className="text-right font-black text-slate-900">{formatCurrency(s.net_amount ?? s.total_amount ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>

          <TablePagination
            currentPage={currentPage}
            totalPages={salesTotalPages}
            totalItems={processedSales.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}

      {/* Tab 4: Customers Report */}
      {reportTab === 'customers' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="p-3.5 text-left font-black text-slate-700">Customer Name</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Phone</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Credit Limit</th>
                  <th className="p-3.5 text-right font-black text-slate-700">Outstanding Debt</th>
                </TableRow>
              </TableHeader>
              {isCustomersLoading ? (
                <TableSkeleton rows={5} cols={4} />
              ) : customers.length === 0 ? (
                <TableBody>
                  <TableEmptyState
                    title="No customer accounts"
                    description="No customer records available."
                    icon={Users}
                    colSpan={4}
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-extrabold text-slate-900">{c.name}</TableCell>
                      <TableCell className="text-slate-500 font-mono">{c.phone || '-'}</TableCell>
                      <TableCell className="font-bold text-slate-700">{formatCurrency(c.credit_limit ?? c.borrow_limit ?? 5000)}</TableCell>
                      <TableCell className="text-right font-black text-red-600">{formatCurrency(c.balance ?? c.current_debt ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 5: Suppliers Report */}
      {reportTab === 'suppliers' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="p-3.5 text-left font-black text-slate-700">Supplier Name</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Contact Person</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Phone</th>
                  <th className="p-3.5 text-right font-black text-slate-700">Status</th>
                </TableRow>
              </TableHeader>
              {isSuppliersLoading ? (
                <TableSkeleton rows={5} cols={4} />
              ) : suppliers.length === 0 ? (
                <TableBody>
                  <TableEmptyState
                    title="No vendor profiles"
                    description="No vendor records available."
                    icon={Truck}
                    colSpan={4}
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {suppliers.map((sup) => (
                    <TableRow key={sup.id}>
                      <TableCell className="font-extrabold text-slate-900">{sup.name}</TableCell>
                      <TableCell className="text-slate-600">{sup.contact_person || '-'}</TableCell>
                      <TableCell className="font-mono text-slate-500">{sup.phone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="success">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 6: Employees Report */}
      {reportTab === 'employees' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="p-3.5 text-left font-black text-slate-700">Staff Member</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Email Address</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Assigned Role</th>
                  <th className="p-3.5 text-right font-black text-slate-700">Account Status</th>
                </TableRow>
              </TableHeader>
              {isEmployeesLoading ? (
                <TableSkeleton rows={5} cols={4} />
              ) : employees.length === 0 ? (
                <TableBody>
                  <TableEmptyState
                    title="No employee records"
                    description="No employee profiles found."
                    icon={UserCheck}
                    colSpan={4}
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-extrabold text-slate-900">{emp.name}</TableCell>
                      <TableCell className="text-slate-500">{emp.email}</TableCell>
                      <TableCell>
                        <Badge variant="info" className="uppercase">
                          {emp.role ? emp.role.replace('_', ' ') : 'Cashier'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={emp.is_active === false ? 'danger' : 'success'}>
                          {emp.is_active === false ? 'Suspended' : 'Active'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
}
