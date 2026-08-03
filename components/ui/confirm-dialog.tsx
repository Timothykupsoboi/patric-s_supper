'use client';

import React from 'react';
import { Dialog } from './dialog';
import { Button } from './button';
import { AlertTriangle, Info, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
      onClose();
    }
  };

  const isPending = isLoading || internalLoading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-50 text-red-600 border-red-200',
          icon: Trash2,
          btnVariant: 'danger' as const,
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          icon: AlertTriangle,
          btnVariant: 'primary' as const,
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
          icon: Info,
          btnVariant: 'primary' as const,
        };
    }
  };

  const config = getVariantStyles();
  const Icon = config.icon;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-2 space-y-4 font-sans">
        <div className="flex items-start space-x-3.5">
          <div className={cn('p-3 rounded-2xl border flex-shrink-0', config.iconBg)}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={config.btnVariant}
            size="sm"
            onClick={handleConfirm}
            disabled={isPending}
            isLoading={isPending}
          >
            {isPending ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
