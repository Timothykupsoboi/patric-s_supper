import React from 'react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'default', children, className, size = 'md', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-red-50 text-red-700 border-red-200/80',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-extrabold rounded-full border tracking-wide select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const ROLE_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  platform_owner: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  supermarket_owner: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  super_admin: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  owner: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  branch_manager: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  manager: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  cashier: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  store_keeper: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  inventory_manager: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  accountant: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  procurement_officer: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  customer_service: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  default: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export function RoleBadge({ role, className }: { role: UserRole | string; className?: string }) {
  const formattedRole = (role || 'Staff')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const style = ROLE_BADGE_COLORS[role] || ROLE_BADGE_COLORS.default;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {formattedRole}
    </span>
  );
}
