'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { saleService } from '@/services/saleService';
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

export function RevenueChart() {
  const { data: reportMetrics, isLoading } = useQuery({
    queryKey: ['financialReportMetrics'],
    queryFn: () => saleService.getComprehensiveFinancialReport(),
  });

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
        Loading revenue breakdown...
      </div>
    );
  }

  // Generate structured comparison data from metrics
  const grossSales = reportMetrics?.grossSales || 0;
  const expenses = reportMetrics?.totalExpenses || 0;
  const netProfit = reportMetrics?.netProfit || 0;

  const data = [
    { name: 'Gross Sales', amount: grossSales, fill: '#2563eb' },
    { name: 'Expenses', amount: expenses, fill: '#ef4444' },
    { name: 'Net Profit', amount: Math.max(0, netProfit), fill: '#10b981' },
  ];

  return (
    <div className="w-full h-64 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
            formatter={(val: unknown) => [`KES ${Number(val).toLocaleString()}`, 'Amount']}
          />
          <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
