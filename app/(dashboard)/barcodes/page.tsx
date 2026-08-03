'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { barcodeService, GS1ParsedData, BarcodeScanLog } from '@/services/barcodeService';
import { useBranding } from '@/context/BrandingContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { LabelDesignerModal } from '@/components/barcode/LabelDesignerModal';
import { CameraScannerModal } from '@/components/barcode/CameraScannerModal';
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SortableTableHead,
  TableSearch,
  TablePagination,
  TableSkeleton,
  TableEmptyState,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Scan, Barcode, Printer, CheckCircle2, AlertTriangle, RefreshCw, Plus, Search, Sparkles, HelpCircle, FileText, Layers, Smartphone, Volume2, HardDrive,
} from 'lucide-react';
import { Product } from '@/types';

export default function BarcodesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOwner } = useBranding();

  const [activeTab, setActiveTab] = useState<'scanner' | 'generator' | 'audit'>('scanner');
  const [search, setSearch] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [parsedGS1, setParsedGS1] = useState<GS1ParsedData | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);

  // Modals
  const [designerProduct, setDesignerProduct] = useState<Product | null>(null);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
  });

  const { data: auditMetrics } = useQuery({
    queryKey: ['barcodeAudit', products.length],
    queryFn: () => barcodeService.getAuditMetrics(products),
    enabled: products.length > 0,
  });

  const handleScanBarcode = (barcode: string) => {
    setScanInput(barcode);
    const parsed = barcodeService.parseGS1Barcode(barcode);
    setParsedGS1(parsed);

    const lookupCode = parsed.gtin || barcode;
    const found = products.find(
      (p) => p.barcode === lookupCode || p.barcode === barcode || p.sku === barcode
    );

    setMatchedProduct(found || null);
    barcodeService.recordScanLog(barcode, 'USB_KEYBOARD', found || undefined);

    if (found) {
      toast.success('Product Located', `Matched "${found.name}" (${formatCurrency(found.selling_price)}).`);
    } else {
      toast.error('Barcode Not Found', `No product registered for code "${barcode}".`);
    }
  };

  const handleGenerateEAN13 = async (prod: Product) => {
    const newBarcode = barcodeService.generateEAN13();
    try {
      await productService.updateProduct(prod.id, { barcode: newBarcode });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('EAN-13 Barcode Generated', `Assigned "${newBarcode}" to ${prod.name}.`);
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not assign generated barcode.');
    }
  };

  const scanLogs = barcodeService.getScanLogs();

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Barcode className="w-6 h-6 text-blue-600" />
            <span>Enterprise Barcode Management & Scanning</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            GS1 AI parser, EAN-13 checksum validation, USB/Bluetooth wedge scanning, and label printing
          </p>
        </div>

        <div className="flex space-x-2">
          <Button onClick={() => setIsScannerOpen(true)} variant="outline" size="md">
            <Scan className="w-4 h-4 mr-1.5 text-blue-600" /> Live Scanner
          </Button>
          {isOwner && (
            <Button
              onClick={() => {
                setDesignerProduct(products[0] || null);
                setIsDesignerOpen(true);
              }}
              variant="primary"
              size="md"
            >
              <Printer className="w-4 h-4 mr-1.5" /> Barcode Label Designer
            </Button>
          )}
        </div>
      </div>

      {/* Audit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Product Lines</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{products.length} Products</h3>
          <p className="text-[10px] text-blue-600 font-bold mt-0.5">{auditMetrics?.productsWithBarcodes || 0} with valid barcodes</p>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Missing Barcodes</p>
          <h3 className="text-2xl font-black text-amber-900 mt-1">{auditMetrics?.productsWithoutBarcodes || 0} Products</h3>
          <p className="text-[10px] text-amber-600 font-bold mt-0.5">Need auto-generation</p>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Duplicate Barcodes</p>
          <h3 className="text-2xl font-black text-red-900 mt-1">{auditMetrics?.duplicateBarcodesCount || 0} Duplicates</h3>
          <p className="text-[10px] text-red-600 font-bold mt-0.5">Conflicting barcode tags</p>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">GS1 Parser Status</p>
          <h3 className="text-2xl font-black text-emerald-900 mt-1">GS1-128 / GTIN</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Auto-extracts Expiry & Lot</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'scanner', label: 'Scanner & GS1 Test Lookup', icon: Scan },
          { id: 'generator', label: 'Barcode Generator & Printing', icon: Barcode },
          { id: 'audit', label: 'Health Audit & Scan History', icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Live Scanner & GS1 AI Parser */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
          <Card className="p-5 border border-slate-200 space-y-4">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-sm font-extrabold flex items-center space-x-2 text-slate-900">
                <Scan className="w-4.5 h-4.5 text-blue-600" />
                <span>Barcode Scanner Test Engine</span>
              </CardTitle>
            </CardHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (scanInput) handleScanBarcode(scanInput);
              }}
              className="space-y-3"
            >
              <Input
                isFloating
                label="Scan Barcode Code or GS1 AI String"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="e.g. 6001234567891 or (01)06164000000000(17)261231(10)LOT9988"
                autoFocus
              />

              <div className="flex space-x-2">
                <Button type="submit" variant="primary" size="md" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Execute Scan Lookup
                </Button>
                <Button
                  type="button"
                  onClick={() => handleScanBarcode('(01)06164000000000(17)261231(10)LOT9988')}
                  variant="outline"
                  size="md"
                  className="text-xs"
                >
                  Test GS1 Sample
                </Button>
              </div>
            </form>

            {/* Parsed GS1 Application Identifiers */}
            {parsedGS1 && (parsedGS1.gtin || parsedGS1.expiryDate || parsedGS1.batchLot) && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
                  <span className="font-black text-emerald-900 uppercase">GS1 Application Identifiers Extracted</span>
                  <Badge variant="success">GS1 Validated</Badge>
                </div>
                {parsedGS1.gtin && <div className="flex justify-between"><span className="text-slate-500">(01) GTIN:</span><span className="font-extrabold">{parsedGS1.gtin}</span></div>}
                {parsedGS1.expiryDate && <div className="flex justify-between"><span className="text-slate-500">(17) Expiry Date:</span><span className="font-extrabold text-emerald-800">{parsedGS1.expiryDate}</span></div>}
                {parsedGS1.batchLot && <div className="flex justify-between"><span className="text-slate-500">(10) Batch/Lot:</span><span className="font-extrabold">{parsedGS1.batchLot}</span></div>}
              </div>
            )}
          </Card>

          {/* Matched Product Details Card */}
          <Card className="p-5 border border-slate-200 space-y-4 bg-white">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-sm font-extrabold text-slate-900">Scanned Product Details</CardTitle>
            </CardHeader>

            {matchedProduct ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                    {matchedProduct.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">{matchedProduct.name}</h3>
                    <p className="text-xs text-blue-700 font-bold mt-0.5">Price: {formatCurrency(matchedProduct.selling_price)}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">Barcode: {matchedProduct.barcode}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div><span className="text-slate-400 font-bold block text-[10px] uppercase">Current Stock:</span> <span className="font-black text-slate-900">{matchedProduct.current_stock ?? matchedProduct.stock_quantity} units</span></div>
                  <div><span className="text-slate-400 font-bold block text-[10px] uppercase">SKU Reference:</span> <span className="font-mono text-slate-900 font-bold">{matchedProduct.sku}</span></div>
                </div>

                <Button
                  onClick={() => {
                    setDesignerProduct(matchedProduct);
                    setIsDesignerOpen(true);
                  }}
                  variant="outline"
                  size="md"
                  className="w-full"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print Barcode Label for this Item
                </Button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 font-medium">
                <Scan className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No active barcode scanned. Use the test engine or scanner to lookup products.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Barcode Generator & Label Printing */}
      {activeTab === 'generator' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <TableSearch value={search} onChange={setSearch} placeholder="Search product by name or SKU..." className="w-72" />
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="p-3.5 text-left font-black text-slate-700">Product Name</th>
                  <th className="p-3.5 text-left font-black text-slate-700">SKU</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Current Barcode</th>
                  <th className="p-3.5 text-left font-black text-slate-700">Price</th>
                  <th className="p-3.5 text-right font-black text-slate-700">Actions</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products
                  .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase()))
                  .slice(0, 10)
                  .map((prod) => (
                    <TableRow key={prod.id}>
                      <TableCell className="font-extrabold text-slate-900">{prod.name}</TableCell>
                      <TableCell className="font-mono text-slate-500">{prod.sku}</TableCell>
                      <TableCell>
                        {prod.barcode ? (
                          <Badge variant="success" className="font-mono">{prod.barcode}</Badge>
                        ) : (
                          <Badge variant="warning">Missing Barcode</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-black text-slate-900">{formatCurrency(prod.selling_price)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {!prod.barcode && (
                          <Button variant="outline" size="sm" onClick={() => handleGenerateEAN13(prod)}>
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Auto EAN-13
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDesignerProduct(prod);
                            setIsDesignerOpen(true);
                          }}
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" /> Label Designer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 3: Health Audit & Scan History */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <Card className="p-5 border border-slate-200">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-sm font-extrabold flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>Realtime Barcode Scan Audit Log</span>
              </CardTitle>
            </CardHeader>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto font-mono text-xs">
              {scanLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-black text-slate-900">{log.barcode}</span>
                    <span className="text-slate-400 ml-2">({log.scanner_type})</span>
                    {log.product_name && <p className="text-[11px] font-sans text-slate-600 font-bold">{log.product_name}</p>}
                  </div>
                  <div className="text-right">
                    {log.is_found ? <Badge variant="success">Match Found</Badge> : <Badge variant="danger">Not Found</Badge>}
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">{formatDateTime(log.scanned_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      {designerProduct && (
        <LabelDesignerModal
          isOpen={isDesignerOpen}
          onClose={() => {
            setIsDesignerOpen(false);
            setDesignerProduct(null);
          }}
          product={designerProduct}
          productsList={products}
        />
      )}

      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => handleScanBarcode(code)}
      />
    </div>
  );
}
