import { useEffect, useRef } from 'react';
import { Product } from '@/types';
import { barcodeService } from '@/services/barcodeService';

interface UseBarcodeScannerProps {
  products: Product[];
  onScanMatch: (product: Product, gs1Data?: any) => void;
}

export function useBarcodeScanner({ products, onScanMatch }: UseBarcodeScannerProps) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1800; // 1800Hz POS barcode beep tone
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is typing inside standard input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (target.id === 'pos-search-input' && e.key === 'Enter') {
          const query = (target as HTMLInputElement).value.trim();
          const parsedGS1 = query.includes('(01)') || query.includes('(17)') ? barcodeService.parseGS1Barcode(query) : undefined;
          const lookupCode = parsedGS1?.gtin || query.toLowerCase();

          const matched = products.find(
            (p) => p.barcode?.toLowerCase() === lookupCode || p.sku?.toLowerCase() === lookupCode
          );
          if (matched) {
            e.preventDefault();
            playBeep();
            onScanMatch(matched, parsedGS1);
            (target as HTMLInputElement).value = '';
          }
        }
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Scanners type keys rapidly (< 50ms between characters)
      if (timeDiff > 100) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length > 2) {
          const scannedCode = bufferRef.current.trim();
          const parsedGS1 = scannedCode.includes('(01)') || scannedCode.includes('(17)') ? barcodeService.parseGS1Barcode(scannedCode) : undefined;
          const lookupCode = (parsedGS1?.gtin || scannedCode).toLowerCase();

          const matchedProduct = products.find(
            (p) => p.barcode?.toLowerCase() === lookupCode || p.sku?.toLowerCase() === lookupCode
          );
          if (matchedProduct) {
            e.preventDefault();
            playBeep();
            onScanMatch(matchedProduct, parsedGS1);
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
