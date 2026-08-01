'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { saleService } from '@/services/saleService';
import { inventoryService } from '@/services/inventoryService';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, ArrowUpRight, Clock, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['salesMetrics'],
    queryFn: () => saleService.getSalesMetrics(),
  });

  const { data: recentSales = [], isLoading: isSalesLoading } = useQuery({
    queryKey: ['recentSales'],
    queryFn: () => saleService.getRecentSales(5),
  });

  const { data: lowStock = [], isLoading: isStockLoading } = useQuery({
    queryKey: ['lowStock'],
    queryFn: () => inventoryService.getLowStockProducts(),
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time supermarket metrics & cloud performance overview</p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Supabase PostgreSQL Live</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
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
            <span>+14.2% vs yesterday</span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Orders</p>
              {isMetricsLoading ? (
                <Skeleton className="h-8 w-20 mt-2" />
              ) : (
                <h2 className="text-2xl font-black text-slate-900 mt-1">{metrics?.todaySales || 0}</h2>
              )}
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>Active cashier register</span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-600 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Warnings</p>
              {isStockLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <h2 className="text-2xl font-black text-amber-600 mt-1">{lowStock.length}</h2>
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

        <Card className="border-l-4 border-l-purple-600 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cloud Engine</p>
              <h2 className="text-xl font-black text-emerald-600 mt-1">100% Online</h2>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500 font-medium">
            <span>Vercel + Supabase Ready</span>
          </div>
        </Card>
      </div>

      {/* Interactive Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Revenue Performance Trend (Today)</CardTitle>
        </CardHeader>
        <SalesChart />
      </Card>

      {/* Grid: Recent Sales & Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Register Sales</CardTitle>
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
                    <p className="font-extrabold text-slate-900">{sale.invoice_number}</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(sale.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">{formatCurrency(sale.net_amount)}</p>
                    <Badge variant="success" className="uppercase text-[9px] mt-0.5">
                      {sale.payment_method}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Restock Alerts</CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {isStockLoading ? (
              <div className="space-y-3 py-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : lowStock.length === 0 ? (
              <p className="text-xs text-emerald-600 font-semibold py-6 text-center">
                All inventory items are well stocked!
              </p>
            ) : (
              lowStock.map((prod) => (
                <div key={prod.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-extrabold text-slate-900">{prod.name}</p>
                    <p className="text-[10px] text-slate-400">Reorder threshold: {prod.reorder_level}</p>
                  </div>
                  <Badge variant="danger">{prod.stock_quantity} Left</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
