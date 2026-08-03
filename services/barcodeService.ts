import { Product } from '@/types';
import { productService } from './productService';
import { authService } from './authService';

export type BarcodeFormat =
  | 'EAN13'
  | 'EAN8'
  | 'UPCA'
  | 'UPCE'
  | 'CODE128'
  | 'CODE39'
  | 'ITF14'
  | 'QR_CODE'
  | 'GS1_128';

export interface GS1ParsedData {
  raw: string;
  gtin?: string;
  batchLot?: string;
  expiryDate?: string; // YYYY-MM-DD
  manufacturingDate?: string;
  serialNumber?: string;
  netWeightKg?: number;
  quantity?: number;
}

export interface BarcodeScanLog {
  id: string;
  supermarket_id: string;
  barcode: string;
  scanned_at: string;
  scanner_type: 'USB_KEYBOARD' | 'BLUETOOTH' | 'CAMERA_MOBILE';
  product_id?: string;
  product_name?: string;
  is_found: boolean;
  gs1_data?: GS1ParsedData;
}

export interface BarcodeAuditMetrics {
  totalProducts: number;
  productsWithBarcodes: number;
  productsWithoutBarcodes: number;
  duplicateBarcodesCount: number;
  invalidChecksumCount: number;
  mostScannedProducts: { name: string; barcode: string; count: number }[];
}

let mockScanLogs: BarcodeScanLog[] = [
  {
    id: 'log-1',
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    barcode: '6001234567891',
    scanned_at: new Date(Date.now() - 1800000).toISOString(),
    scanner_type: 'USB_KEYBOARD',
    product_name: 'Kenyan Premium Sugar 2Kg',
    is_found: true,
  },
  {
    id: 'log-2',
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    barcode: '(01)06164000000000(17)261231(10)LOT9988',
    scanned_at: new Date(Date.now() - 3600000).toISOString(),
    scanner_type: 'BLUETOOTH',
    product_name: 'Refined Cooking Oil 3L',
    is_found: true,
    gs1_data: {
      raw: '(01)06164000000000(17)261231(10)LOT9988',
      gtin: '06164000000000',
      expiryDate: '2026-12-31',
      batchLot: 'LOT9988',
    },
  },
];

export const barcodeService = {
  // EAN-13 & Modulo 10 Checksum Validation
  validateChecksum(barcode: string, format: BarcodeFormat = 'EAN13'): boolean {
    const clean = barcode.replace(/[^0-9]/g, '');
    if (format === 'EAN13' && clean.length === 13) {
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const digit = parseInt(clean[i], 10);
        sum += i % 2 === 0 ? digit : digit * 3;
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === parseInt(clean[12], 10);
    }

    if (format === 'EAN8' && clean.length === 8) {
      let sum = 0;
      for (let i = 0; i < 7; i++) {
        const digit = parseInt(clean[i], 10);
        sum += i % 2 === 0 ? digit * 3 : digit;
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === parseInt(clean[7], 10);
    }

    return clean.length >= 6;
  },

  // Parse GS1 Application Identifiers (AIs)
  parseGS1Barcode(rawInput: string): GS1ParsedData {
    const result: GS1ParsedData = { raw: rawInput };

    // Format e.g. (01)06164000000000(17)261231(10)LOT9988 or 01061640000000001726123110LOT9988
    const clean = rawInput.replace(/\s+/g, '');

    // Extract GTIN (AI 01)
    const gtinMatch = clean.match(/(?:\(01\)|01)(\d{14})/);
    if (gtinMatch) {
      result.gtin = gtinMatch[1];
    }

    // Extract Expiry Date (AI 17: YYMMDD)
    const expiryMatch = clean.match(/(?:\(17\)|17)(\d{6})/);
    if (expiryMatch) {
      const yy = parseInt(expiryMatch[1].substring(0, 2), 10);
      const mm = expiryMatch[1].substring(2, 4);
      const dd = expiryMatch[1].substring(4, 6);
      const fullYear = 2000 + yy;
      result.expiryDate = `${fullYear}-${mm}-${dd}`;
    }

    // Extract Batch / Lot (AI 10)
    const batchMatch = clean.match(/(?:\(10\)|10)([A-Z0-9]{3,20})/i);
    if (batchMatch) {
      result.batchLot = batchMatch[1];
    }

    // Extract Serial Number (AI 21)
    const serialMatch = clean.match(/(?:\(21\)|21)([A-Z0-9]{3,20})/i);
    if (serialMatch) {
      result.serialNumber = serialMatch[1];
    }

    // Extract Net Weight in KG (AI 310x: x = decimal places)
    const weightMatch = clean.match(/(?:\(310\d\)|310\d)(\d{6})/);
    if (weightMatch) {
      const rawWeight = parseInt(weightMatch[1], 10);
      result.netWeightKg = rawWeight / 1000;
    }

    return result;
  },

  // Auto-generate standard EAN-13 barcode number
  generateEAN13(): string {
    const prefix = '600'; // East Africa retail prefix code
    let body = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const first12 = prefix + body;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(first12[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return first12 + checkDigit;
  },

  // Auto-generate Code128 barcode
  generateCode128(prefix = 'SKU'): string {
    return `${prefix}-${Date.now().toString().slice(-8)}`;
  },

  // Record scan log
  recordScanLog(barcode: string, scannerType: 'USB_KEYBOARD' | 'BLUETOOTH' | 'CAMERA_MOBILE', product?: Product): void {
    const isFound = !!product;
    const gs1Data = barcode.includes('(01)') || barcode.includes('(17)') ? this.parseGS1Barcode(barcode) : undefined;

    const log: BarcodeScanLog = {
      id: `log-${Date.now()}`,
      supermarket_id: '00000000-0000-0000-0000-000000000001',
      barcode,
      scanned_at: new Date().toISOString(),
      scanner_type: scannerType,
      product_id: product?.id,
      product_name: product?.name,
      is_found: isFound,
      gs1_data: gs1Data,
    };

    mockScanLogs.unshift(log);
  },

  getScanLogs(): BarcodeScanLog[] {
    return mockScanLogs;
  },

  async getAuditMetrics(products: Product[]): Promise<BarcodeAuditMetrics> {
    const totalProducts = products.length;
    const withBarcodes = products.filter((p) => p.barcode && p.barcode.trim() !== '').length;
    const withoutBarcodes = totalProducts - withBarcodes;

    // Check duplicate barcodes
    const map: Record<string, number> = {};
    products.forEach((p) => {
      if (p.barcode) {
        map[p.barcode] = (map[p.barcode] || 0) + 1;
      }
    });

    const duplicateBarcodesCount = Object.values(map).filter((cnt) => cnt > 1).length;

    // Invalid checksums
    const invalidChecksumCount = products.filter(
      (p) => p.barcode && p.barcode.length === 13 && !this.validateChecksum(p.barcode, 'EAN13')
    ).length;

    return {
      totalProducts,
      productsWithBarcodes: withBarcodes,
      productsWithoutBarcodes: withoutBarcodes,
      duplicateBarcodesCount,
      invalidChecksumCount,
      mostScannedProducts: [
        { name: 'Kenyan Premium Sugar 2Kg', barcode: '6001234567891', count: 142 },
        { name: 'Refined Cooking Oil 3L', barcode: '6009876543210', count: 98 },
        { name: 'Fresh Dairy Milk 1L', barcode: '6001122334455', count: 85 },
      ],
    };
  },
};
