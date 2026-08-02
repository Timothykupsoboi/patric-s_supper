'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { saleService } from '@/services/saleService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export function SalesChart() {
  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['hourlySalesChart'],
    queryFn: () => saleService.getHourlySales(),
  });

  if (isLoading) {
    return <div className="w-full h-64 flex items-center justify-center text-xs text-slate-400">Loading sales chart...</div>;
  }

  return (
    <div className="w-full h-64 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
            formatter={(val: unknown) => [`KES ${Number(val).toLocaleString()}`, 'Sales Revenue']}
          />
          <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
