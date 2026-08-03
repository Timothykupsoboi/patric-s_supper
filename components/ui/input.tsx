import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Loader2 } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  isFloating?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      icon,
      isLoading = false,
      isFloating = false,
      id,
      placeholder,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    if (isFloating) {
      return (
        <div className="w-full relative">
          <div className="relative">
            {icon && (
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                {icon}
              </div>
            )}
            <input
              ref={ref}
              id={inputId}
              placeholder={placeholder || ' '}
              value={value}
              disabled={disabled || isLoading}
              className={cn(
                'peer w-full px-3.5 pt-5 pb-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all disabled:opacity-50 disabled:bg-slate-50',
                icon && 'pl-10',
                error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
                className
              )}
              {...props}
            />
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'absolute text-xs font-bold text-slate-400 duration-150 transform -translate-y-2.5 scale-75 top-4 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-blue-600 pointer-events-none transition-all',
                  icon ? 'left-10' : 'left-3.5',
                  error && 'peer-focus:text-red-500'
                )}
              >
                {label}
              </label>
            )}
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>
          {error && (
            <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}
          {helperText && !error && (
            <p className="text-[11px] text-slate-500 font-medium mt-1">{helperText}</p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            placeholder={placeholder}
            value={value}
            disabled={disabled || isLoading}
            className={cn(
              'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all disabled:opacity-50 disabled:bg-slate-50 shadow-xs',
              icon && 'pl-10',
              isLoading && 'pr-10',
              error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
              className
            )}
            {...props}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            </div>
          )}
        </div>
        {error && (
          <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p className="text-[11px] text-slate-500 font-medium mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
