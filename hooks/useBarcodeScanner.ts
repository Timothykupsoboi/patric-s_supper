import { useEffect, useRef } from 'react';
import { Product } from '@/types';

interface UseBarcodeScannerProps {
  products: Product[];
  onScanMatch: (product: Product) => void;
}

export function useBarcodeScanner({ products, onScanMatch }: UseBarcodeScannerProps) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is typing inside input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // If it's the main POS search input and Enter is pressed, check for exact barcode match
        if (target.id === 'pos-search-input' && e.key === 'Enter') {
          const query = (target as HTMLInputElement).value.trim();
          const matched = products.find(
            (p) => p.barcode?.toLowerCase() === query.toLowerCase() || p.sku?.toLowerCase() === query.toLowerCase()
          );
          if (matched) {
            e.preventDefault();
            onScanMatch(matched);
            (target as HTMLInputElement).value = '';
          }
        }
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Scanners type keys rapidly (< 35ms between characters)
      if (timeDiff > 100) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length > 2) {
          const scannedCode = bufferRef.current.trim().toLowerCase();
          const matchedProduct = products.find(
            (p) => p.barcode?.toLowerCase() === scannedCode || p.sku?.toLowerCase() === scannedCode
          );
          if (matchedProduct) {
            e.preventDefault();
            onScanMatch(matchedProduct);
          }
        }
        bufferRef.current = '';
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, onScanMatch]);
}
