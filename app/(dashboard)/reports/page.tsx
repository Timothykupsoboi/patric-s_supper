'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { saleService, FinancialReportMetrics } from '@/services/saleService';
import { expenseService } from '@/services/expenseService';
import { productService } from '@/services/productService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Download, FileText, TrendingUp, DollarSign, PieChart as PieIcon, BarChart3, Tag, PackageCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function ReportsPage() {
  const [reportTab, setReportTab] = useState<'financial' | 'inventory_valuation' | 'sales_register'>('financial');

  const { data: sales = [], isLoading: isSalesLoading } = useQuery({
    queryKey: ['recentSales'],
    queryFn: () => saleService.getRecentSales(50),
  });

  const { data: reportMetrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['financialReportMetrics'],
    queryFn: () => saleService.getComprehensiveFinancialReport(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
  });

  // Chart dataset
  const chartData = [
    { name: 'Net Sales', amount: reportMetrics?.netSales || 0, fill: '#2563eb' },
    { name: 'COGS', amount: reportMetrics?.cogs || 0, fill: '#64748b' },
    { name: 'Expenses', amount: reportMetrics?.totalExpenses || 0, fill: '#ef4444' },
    { name: 'Net Profit', amount: reportMetrics?.netProfit || 0, fill: '#10b981' },
  ];

  // CSV Export Handlers
  const exportSalesCSV = () => {
    const headers = ['Invoice Number', 'Date', 'Payment Method', 'Subtotal', 'Discount', 'Tax (16%)', 'Net Amount'];
    const rows = sales.map((s) => [
      s.invoice_number,
      new Date(s.created_at).toLocaleString(),
      s.payment_method,
      s.total_amount,
      s.discount_amount,
      s.tax_amount,
      s.net_amount,
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
    const headers = ['Product Name', 'SKU', 'Stock Qty', 'Cost Price', 'Selling Price', 'Total Cost Valuation', 'Total Retail Valuation'];
    const rows = products.map((p) => [
      p.name,
      p.sku || '',
      p.stock_quantity,
      p.cost_price,
      p.selling_price,
      p.cost_price * p.stock_quantity,
      p.selling_price * p.stock_quantity,
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial & Valuation Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Audit gross revenue, COGS, tax calculations, net profit, and inventory valuation</p>
        </div>
        <div className="flex space-x-2 mt-3 sm:mt-0">
          <Button onClick={exportPnLCSV} variant="outline" className="text-xs font-bold border-slate-300">
            <Download className="w-4 h-4 mr-1.5 text-slate-600" />
            Export P&L CSV
          </Button>
          <Button onClick={exportSalesCSV} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs">
            <Download className="w-4 h-4 mr-1.5" />
            Export Sales CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: 'financial', label: 'Profit & Loss (P&L)', icon: DollarSign },
          { id: 'inventory_valuation', label: 'Inventory Valuation', icon: PackageCheck },
          { id: 'sales_register', label: 'Sales Register Audit', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportTab(tab.id as any)}
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

      {/* Tab 1: Financial P&L */}
      {reportTab === 'financial' && (
        <div className="space-y-6">
          {/* Top 4 Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50/70 border-blue-200">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Gross Sales Revenue</p>
              {isMetricsLoading ? (
                <Skeleton className="h-8 w-32 mt-2" />
              ) : (
                <h2 className="text-2xl font-black text-blue-900 mt-1">{formatCurrency(reportMetrics?.grossSales || 0)}</h2>
              )}
              <p className="text-[10px] text-blue-600 mt-1">Discounts: -{formatCurrency(reportMetrics?.totalDiscounts || 0)}</p>
            </Card>

            <Card className="bg-slate-50 border-slate-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cost of Goods (COGS)</p>
              {isMetricsLoading ? (
                <Skeleton className="h-8 w-32 mt-2" />
              ) : (
                <h2 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(reportMetrics?.cogs || 0)}</h2>
              )}
              <p className="text-[10px] text-slate-500 mt-1">Direct product acquisition cost</p>
            </Card>

            <Card className="bg-red-50/70 border-red-200">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Operational Expenses</p>
              {isMetricsLoading ? (
                <Skeleton className="h-8 w-32 mt-2" />
              ) : (
                <h2 className="text-2xl font-black text-red-900 mt-1">{formatCurrency(reportMetrics?.totalExpenses || 0)}</h2>
              )}
              <p className="text-[10px] text-red-600 mt-1">Store bills & operational costs</p>
            </Card>

            <Card className="bg-emerald-50/70 border-emerald-200">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Net Profit</p>
              {isMetricsLoading ? (
                <Skeleton className="h-8 w-32 mt-2" />
              ) : (
                <h2 className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(reportMetrics?.netProfit || 0)}</h2>
              )}
              <p className="text-[10px] text-emerald-600 mt-1">Calculated after COGS & Expenses</p>
            </Card>
          </div>

          {/* Recharts Financial Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary Breakdown (KES)</CardTitle>
            </CardHeader>
            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`KES ${Number(val).toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Inventory Valuation */}
      {reportTab === 'inventory_valuation' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Inventory Asset Valuation Summary</h3>
              <p className="text-xs text-slate-500">Based on {products.length} active inventory product lines</p>
            </div>
            <Button onClick={exportValuationCSV} size="sm" className="bg-slate-900 hover:bg-slate-800 text-xs font-bold">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export Valuation CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-slate-700">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Cost Basis Valuation</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(reportMetrics?.inventoryCostValuation || 0)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Sum of (Cost Price × Stock Qty)</p>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <p className="text-xs font-bold text-blue-700 uppercase">Total Retail Basis Valuation</p>
              <h3 className="text-2xl font-black text-blue-900 mt-1">{formatCurrency(reportMetrics?.inventoryRetailValuation || 0)}</h3>
              <p className="text-[10px] text-blue-600 mt-1">Sum of (Selling Price × Stock Qty)</p>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <p className="text-xs font-bold text-emerald-700 uppercase">Potential Gross Margin</p>
              <h3 className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(reportMetrics?.potentialMargin || 0)}</h3>
              <p className="text-[10px] text-emerald-600 mt-1">Potential gross profit if 100% sold</p>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Sales Register Audit */}
      {reportTab === 'sales_register' && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Sales Register</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold uppercase border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">VAT (16%)</th>
                  <th className="p-3 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900">{s.invoice_number}</td>
                    <td className="p-3 text-slate-500">{formatDateTime(s.created_at)}</td>
                    <td className="p-3 uppercase font-extrabold text-blue-600">{s.payment_method}</td>
                    <td className="p-3">{formatCurrency(s.total_amount)}</td>
                    <td className="p-3 text-red-600">-{formatCurrency(s.discount_amount)}</td>
                    <td className="p-3">{formatCurrency(s.tax_amount)}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatCurrency(s.net_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
