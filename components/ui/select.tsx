import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, AlertCircle, Loader2 } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  isFloating?: boolean;
  options?: SelectOption[];
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      icon,
      isLoading = false,
      isFloating = false,
      options,
      children,
      id,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasValue = value !== undefined && value !== '';

    if (isFloating) {
      return (
        <div className="w-full relative font-sans">
          <div className="relative">
            {icon && (
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                {icon}
              </div>
            )}
            <select
              ref={ref}
              id={selectId}
              value={value}
              disabled={disabled || isLoading}
              className={cn(
                'peer w-full px-3.5 pt-5 pb-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all disabled:opacity-50 disabled:bg-slate-50 shadow-xs cursor-pointer',
                icon && 'pl-10',
                error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
                className
              )}
              {...props}
            >
              {options
                ? options.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ))
                : children}
            </select>
            {label && (
              <label
                htmlFor={selectId}
                className={cn(
                  'absolute text-xs font-bold duration-150 transform top-4 z-10 origin-[0] pointer-events-none transition-all',
                  hasValue ? '-translate-y-2.5 scale-75 text-blue-600' : 'scale-75 -translate-y-2.5 text-slate-400',
                  icon ? 'left-10' : 'left-3.5',
                  error && 'text-red-500'
                )}
              >
                {label}
              </label>
            )}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center space-x-1 z-10">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>
          {error && (
            <p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}
          {helperText && !error && (
            <p className="text-[11px] text-slate-500 font-medium mt-1.5">{helperText}</p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full font-sans">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            value={value}
            disabled={disabled || isLoading}
            className={cn(
              'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all disabled:opacity-50 disabled:bg-slate-50 shadow-xs cursor-pointer pr-10',
              icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center space-x-1 z-10">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
        {error && (
          <p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p className="text-[11px] text-slate-500 font-medium mt-1.5">{helperText}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
