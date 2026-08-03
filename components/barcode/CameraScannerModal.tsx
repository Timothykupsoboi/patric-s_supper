'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, Smartphone, Scan, Volume2, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedBarcode: string) => void;
}

export function CameraScannerModal({ isOpen, onClose, onScan }: CameraScannerModalProps) {
  const [manualInput, setManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Play audio beep feedback
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1800; // 1800Hz beep tone
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // ignore
    }
  };

  // Keyboard Wedge Listener for USB / Bluetooth Scanners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyTimeRef.current > 60) {
        bufferRef.current = '';
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3) {
          const barcode = bufferRef.current;
          bufferRef.current = '';
          playBeep();
          setLastScanned(barcode);
          onScan(barcode);
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      playBeep();
      setLastScanned(manualInput.trim());
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Barcode Scanner Gateway" className="max-w-lg font-sans">
      <div className="space-y-4">
        {/* Scanner Mode Indicator */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-sm text-white">Hardware Wedge Ready</h4>
              <p className="text-[11px] text-slate-400 font-mono">USB / Bluetooth scanners active</p>
            </div>
          </div>
          <Badge variant="success">Listening</Badge>
        </div>

        {lastScanned && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-bold">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Scanned Code: <strong className="font-mono text-slate-900">{lastScanned}</strong></span>
            </div>
            <Volume2 className="w-4 h-4 text-emerald-600 animate-bounce" />
          </div>
        )}

        {/* Manual Barcode Fallback Input */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <Input
            isFloating
            label="Manual Barcode Key Entry"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Type or paste barcode..."
            autoFocus
          />
          <Button type="submit" variant="primary" size="md" className="w-full bg-blue-600 hover:bg-blue-700">
            Submit Barcode Search
          </Button>
        </form>

        <div className="text-center text-[11px] text-slate-400 font-medium pt-2 border-t">
          Point handheld USB or Bluetooth scanner at product barcode. Rapid scanning enabled.
        </div>
      </div>
    </Dialog>
  );
}
