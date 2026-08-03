import React from 'react';
import { cn } from '@/lib/utils';

export function PageTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={cn('text-2xl font-black text-slate-900 tracking-tight leading-tight', className)} {...props}>
      {children}
    </h1>
  );
}

export function SectionTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-lg font-extrabold text-slate-900 tracking-tight leading-snug', className)} {...props}>
      {children}
    </h2>
  );
}

export function CardTitleText({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-extrabold text-slate-900 leading-snug', className)} {...props}>
      {children}
    </h3>
  );
}

export function BodyText({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-slate-600 font-medium leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CaptionText({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-slate-500 font-medium leading-normal', className)} {...props}>
      {children}
    </p>
  );
}

export function SmallLabel({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('text-[10px] font-black uppercase tracking-wider text-slate-500', className)} {...props}>
      {children}
    </span>
  );
}
