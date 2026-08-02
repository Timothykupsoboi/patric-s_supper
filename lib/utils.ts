import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'KES'): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type ExpiryStatus = 'expired' | 'expires_today' | 'within_7_days' | 'within_30_days' | 'safe';

export function getExpiryStatus(expiryDateStr?: string | null): ExpiryStatus {
  if (!expiryDateStr || expiryDateStr.trim() === '') return 'safe';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expiryDateStr);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays === 0) return 'expires_today';
  if (diffDays <= 7) return 'within_7_days';
  if (diffDays <= 30) return 'within_30_days';
  return 'safe';
}

export function isProductExpired(expiryDateStr?: string | null): boolean {
  const status = getExpiryStatus(expiryDateStr);
  return status === 'expired' || status === 'expires_today';
}
