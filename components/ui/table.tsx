import React from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Inbox, Trash2, CheckSquare } from 'lucide-react';
import { Skeleton } from './skeleton';
import { Button } from './button';

export function TableContainer({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs custom-scrollbar relative',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Table({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn('w-full text-left text-xs border-collapse', className)} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-slate-50/90 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 backdrop-blur-xs',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-slate-100 bg-white', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('hover:bg-slate-50/80 transition-colors duration-150 group rounded-xl', className)}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('p-3.5 text-left font-black text-slate-700 select-none', className)} {...props}>
      {children}
    </th>
  );
}

export interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string;
  currentSortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  children: React.ReactNode;
}

export function SortableTableHead({
  sortKey,
  currentSortKey,
  sortOrder,
  onSort,
  children,
  className,
  ...props
}: SortableTableHeadProps) {
  const isSorted = currentSortKey === sortKey;

  return (
    <th
      className={cn(
        'p-3.5 text-left font-black text-slate-700 select-none cursor-pointer hover:text-slate-900 transition-colors group',
        className
      )}
      onClick={() => onSort && onSort(sortKey)}
      {...props}
    >
      <div className="flex items-center space-x-1.5">
        <span>{children}</span>
        {isSorted ? (
          sortOrder === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('p-3.5 text-slate-700 font-medium align-middle', className)} {...props}>
      {children}
    </td>
  );
}

export interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TableSearch({ value, onChange, placeholder = 'Search records...', className }: TableSearchProps) {
  return (
    <div className={cn('relative min-w-[240px]', className)}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all shadow-xs"
      />
    </div>
  );
}

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: TablePaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs font-medium text-slate-500 bg-slate-50/50 rounded-b-2xl', className)}>
      <div>
        Showing <span className="font-extrabold text-slate-900">{startItem}</span> to{' '}
        <span className="font-extrabold text-slate-900">{endItem}</span> of{' '}
        <span className="font-extrabold text-slate-900">{totalItems}</span> entries
      </div>
      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <span className="px-3 py-1 font-bold text-slate-700 bg-white border border-slate-200 rounded-lg">
          {currentPage} / {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody className="divide-y divide-slate-100 bg-white">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="p-3.5">
              <Skeleton className="h-4 w-full rounded-md" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function TableEmptyState({
  title = 'No records found',
  description = 'No items match your search or filter parameters.',
  icon: Icon = Inbox,
  actionButton,
  colSpan = 10,
}: {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  actionButton?: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-12 text-center">
        <div className="max-w-sm mx-auto flex flex-col items-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{description}</p>
          </div>
          {actionButton && <div className="pt-2">{actionButton}</div>}
        </div>
      </td>
    </tr>
  );
}

export function TableBulkActions({
  selectedCount,
  onClear,
  actions,
}: {
  selectedCount: number;
  onClear: () => void;
  actions?: React.ReactNode;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150 mb-3 border border-slate-800">
      <div className="flex items-center space-x-2">
        <CheckSquare className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold">
          <strong className="text-blue-400">{selectedCount}</strong> item{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {actions}
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-slate-300 hover:text-white">
          Clear Selection
        </Button>
      </div>
    </div>
  );
}
