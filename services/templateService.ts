import { authService } from './authService';

export type DocumentType =
  | 'sales_receipt'
  | 'tax_invoice'
  | 'quotation'
  | 'refund_receipt'
  | 'exchange_receipt'
  | 'purchase_order'
  | 'delivery_note';

export type PaperSize = '58mm' | '80mm' | 'A4';
export type Orientation = 'portrait' | 'landscape';
export type FontFamily = 'monospace' | 'sans-serif' | 'serif';

export interface DocumentTemplate {
  id: string;
  supermarket_id: string;
  name: string;
  type: DocumentType;
  is_default: boolean;
  is_system: boolean;
  is_enabled: boolean;
  paper_size: PaperSize;
  orientation: Orientation;
  font_family: FontFamily;
  font_size: 'small' | 'medium' | 'large';
  primary_color: string;
  accent_color: string;
  show_logo: boolean;
  show_qr: boolean;
  show_barcode: boolean;
  show_watermark: boolean;
  show_signature: boolean;
  show_stamp: boolean;
  header_message: string;
  footer_message: string;
  thank_you_message: string;
  return_policy: string;
  promo_message: string;
  social_links: string;
  pin_vat_number: string;
  tax_number: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  sales_receipt: 'Standard Sales Receipt',
  tax_invoice: 'Official Tax Invoice',
  quotation: 'Sales Quotation',
  refund_receipt: 'Cash Refund Receipt',
  exchange_receipt: 'Item Exchange Receipt',
  purchase_order: 'Supplier Purchase Order',
  delivery_note: 'Goods Delivery Note',
};

// Default System Templates generator
export function createDefaultSystemTemplates(supermarketId: string): DocumentTemplate[] {
  const now = new Date().toISOString();
  return [
    {
      id: `tmpl-sys-sales-${supermarketId}`,
      supermarket_id: supermarketId,
      name: 'Default Thermal POS Receipt',
      type: 'sales_receipt',
      is_default: true,
      is_system: true,
      is_enabled: true,
      paper_size: '80mm',
      orientation: 'portrait',
      font_family: 'monospace',
      font_size: 'medium',
      primary_color: '#0f172a',
      accent_color: '#10b981',
      show_logo: true,
      show_qr: true,
      show_barcode: true,
      show_watermark: false,
      show_signature: false,
      show_stamp: false,
      header_message: 'Welcome to Nairobi Supermarket CBD',
      footer_message: 'Please retain this receipt for return/exchange within 7 days.',
      thank_you_message: 'Thank you for shopping with us!',
      return_policy: 'Goods once sold are returnable within 7 days with valid original receipt.',
      promo_message: 'Get 5% bonus loyalty points on your next purchase!',
      social_links: 'Twitter: @NairobiSuper | FB: /NairobiSuper',
      pin_vat_number: 'P051234567Z',
      tax_number: 'VAT-99887766',
      created_at: now,
      updated_at: now,
    },
    {
      id: `tmpl-sys-invoice-${supermarketId}`,
      supermarket_id: supermarketId,
      name: 'Official Tax Invoice (A4 Standard)',
      type: 'tax_invoice',
      is_default: true,
      is_system: true,
      is_enabled: true,
      paper_size: 'A4',
      orientation: 'portrait',
      font_family: 'sans-serif',
      font_size: 'medium',
      primary_color: '#1e293b',
      accent_color: '#2563eb',
      show_logo: true,
      show_qr: true,
      show_barcode: true,
      show_watermark: true,
      show_signature: true,
      show_stamp: true,
      header_message: 'OFFICIAL TAX INVOICE — ORIGINAL',
      footer_message: 'Payment due within 30 days of invoice issuance.',
      thank_you_message: 'We appreciate your business!',
      return_policy: 'All corporate inquiries to accounts@nairobisuper.co.ke.',
      promo_message: 'Volume wholesale discounts available for bulk orders.',
      social_links: 'www.nairobisuper.co.ke',
      pin_vat_number: 'P051234567Z',
      tax_number: 'KRA-VAT-0991823',
      created_at: now,
      updated_at: now,
    },
    {
      id: `tmpl-sys-quote-${supermarketId}`,
      supermarket_id: supermarketId,
      name: 'Sales Quotation Template',
      type: 'quotation',
      is_default: true,
      is_system: true,
      is_enabled: true,
      paper_size: 'A4',
      orientation: 'portrait',
      font_family: 'sans-serif',
      font_size: 'medium',
      primary_color: '#0f172a',
      accent_color: '#3b82f6',
      show_logo: true,
      show_qr: true,
      show_barcode: false,
      show_watermark: false,
      show_signature: true,
      show_stamp: true,
      header_message: 'OFFICIAL SALES PRICE QUOTATION',
      footer_message: 'Quotation valid for 30 calendar days from date of issue.',
      thank_you_message: 'Thank you for requesting a price quote.',
      return_policy: 'Prices subject to stock availability upon order confirmation.',
      promo_message: 'Contact sales team for custom wholesale terms.',
      social_links: 'sales@nairobisuper.co.ke',
      pin_vat_number: 'P051234567Z',
      tax_number: 'KRA-VAT-0991823',
      created_at: now,
      updated_at: now,
    },
    {
      id: `tmpl-sys-refund-${supermarketId}`,
      supermarket_id: supermarketId,
      name: 'Cash Refund Slip (80mm Thermal)',
      type: 'refund_receipt',
      is_default: true,
      is_system: true,
      is_enabled: true,
      paper_size: '80mm',
      orientation: 'portrait',
      font_family: 'monospace',
      font_size: 'medium',
      primary_color: '#991b1b',
      accent_color: '#ef4444',
      show_logo: true,
      show_qr: true,
      show_barcode: true,
      show_watermark: false,
      show_signature: true,
      show_stamp: false,
      header_message: 'OFFICIAL CASH REFUND VOUCHER',
      footer_message: 'Customer acknowledges receipt of cash refund.',
      thank_you_message: 'We apologize for any inconvenience caused.',
      return_policy: 'Refund approved by Store Manager.',
      promo_message: '',
      social_links: '',
      pin_vat_number: 'P051234567Z',
      tax_number: 'VAT-99887766',
      created_at: now,
      updated_at: now,
    },
    {
      id: `tmpl-sys-exchange-${supermarketId}`,
      supermarket_id: supermarketId,
      name: 'Item Exchange Slip',
      type: 'exchange_receipt',
      is_default: true,
      is_system: true,
      is_enabled: true,
      paper_size: '80mm',
      orientation: 'portrait',
      font_family: 'monospace',
      font_size: 'medium',
      primary_color: '#854d0e',
      accent_color: '#f59e0b',
      show_logo: true,
      show_qr: true,
      show_barcode: true,
      show_watermark: false,
      show_signature: true,
      show_stamp: false,
      header_message: 'PRODUCT EXCHANGE RECEIPT',
      footer_message: 'Exchange processed for returned items.',
      thank_you_message: 'Thank you for shopping with us.',
      return_policy: 'Exchanged goods subject to standard warranty policy.',
      promo_message: '',
      social_links: '',
      pin_vat_number: 'P051234567Z',
      tax_number: 'VAT-99887766',
      created_at: now,
      updated_at: now,
    },
    {
      id: `tmpl-sys-po-${supermarketId}`,
      supermarket_id: supermarketId,
      name: 'Official Purchase Order (A4)',
      type: 'purchase_order',
      is_default: true,
      is_system: true,
      is_enabled: true,
      paper_size: 'A4',
      orientation: 'portrait',
      font_family: 'sans-serif',
      font_size: 'medium',
      primary_color: '#1e293b',
      accent_color: '#059669',
      show_logo: true,
      show_qr: true,
      show_barcode: true,
      show_watermark: true,
      show_signature: true,
      show_stamp: true,
      header_message: 'OFFICIAL PURCHASE ORDER — VENDOR COPY',
      footer_message: 'Deliveries to be made directly to Central Receiving Bay.',
      thank_you_message: 'Please acknowledge PO receipt within 24 hours.',
      return_policy: 'All goods subject to quality inspection upon delivery.',
      promo_message: '',
      social_links: 'procurement@nairobisuper.co.ke',
      pin_vat_number: 'P051234567Z',
      tax_number: 'KRA-VAT-0991823',
      created_at: now,
      updated_at: now,
    },
    {
      id: `tmpl-sys-delivery-${supermarketId}`,
      supermarket_id: supermarketId,
      name: 'Goods Delivery Note (A4)',
      type: 'delivery_note',
      is_default: true,
      is_system: true,
      is_enabled: true,
      paper_size: 'A4',
      orientation: 'portrait',
      font_family: 'sans-serif',
      font_size: 'medium',
      primary_color: '#1e293b',
      accent_color: '#6366f1',
      show_logo: true,
      show_qr: true,
      show_barcode: true,
      show_watermark: false,
      show_signature: true,
      show_stamp: true,
      header_message: 'GOODS DELIVERY & RECEIPT NOTE',
      footer_message: 'Verify all items and sign upon driver handover.',
      thank_you_message: 'Thank you for choosing Nairobi Supermarket Logistics.',
      return_policy: 'Discrepancies must be noted on this delivery note before signing.',
      promo_message: '',
      social_links: 'dispatch@nairobisuper.co.ke',
      pin_vat_number: 'P051234567Z',
      tax_number: 'KRA-VAT-0991823',
      created_at: now,
      updated_at: now,
    },
  ];
}

export const templateService = {
  async getTemplates(supermarketId?: string): Promise<DocumentTemplate[]> {
    const ctx = await authService.getCurrentUserContext();
    const targetId = supermarketId || ctx?.supermarketId || '00000000-0000-0000-0000-000000000001';

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`doc_templates_${targetId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }

    const defaults = createDefaultSystemTemplates(targetId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`doc_templates_${targetId}`, JSON.stringify(defaults));
    }
    return defaults;
  },

  async getDefaultTemplate(type: DocumentType, supermarketId?: string): Promise<DocumentTemplate> {
    const templates = await this.getTemplates(supermarketId);
    const found = templates.find((t) => t.type === type && t.is_default && t.is_enabled);
    if (found) return found;

    const fallbackType = templates.find((t) => t.type === type && t.is_enabled);
    if (fallbackType) return fallbackType;

    return templates[0] || createDefaultSystemTemplates(supermarketId || 'default')[0];
  },

  async saveTemplate(template: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const ctx = await authService.getCurrentUserContext();
    const targetId = template.supermarket_id || ctx?.supermarketId || '00000000-0000-0000-0000-000000000001';

    const list = await this.getTemplates(targetId);
    const now = new Date().toISOString();

    let updated: DocumentTemplate;

    if (template.id) {
      const idx = list.findIndex((t) => t.id === template.id);
      if (idx !== -1) {
        updated = { ...list[idx], ...template, updated_at: now } as DocumentTemplate;
        list[idx] = updated;
      } else {
        updated = { ...template, supermarket_id: targetId, created_at: now, updated_at: now } as DocumentTemplate;
        list.unshift(updated);
      }
    } else {
      updated = {
        ...template,
        id: `tmpl-custom-${Date.now()}`,
        supermarket_id: targetId,
        is_system: false,
        is_default: false,
        is_enabled: true,
        created_at: now,
        updated_at: now,
      } as DocumentTemplate;
      list.unshift(updated);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(`doc_templates_${targetId}`, JSON.stringify(list));
    }

    return updated;
  },

  async setDefaultTemplate(templateId: string, type: DocumentType, supermarketId?: string): Promise<void> {
    const list = await this.getTemplates(supermarketId);
    list.forEach((t) => {
      if (t.type === type) {
        t.is_default = t.id === templateId;
      }
    });

    const ctx = await authService.getCurrentUserContext();
    const targetId = supermarketId || ctx?.supermarketId || '00000000-0000-0000-0000-000000000001';
    if (typeof window !== 'undefined') {
      localStorage.setItem(`doc_templates_${targetId}`, JSON.stringify(list));
    }
  },

  async deleteTemplate(templateId: string, supermarketId?: string): Promise<boolean> {
    const list = await this.getTemplates(supermarketId);
    const target = list.find((t) => t.id === templateId);

    if (!target) return false;
    if (target.is_system) {
      throw new Error('System default templates cannot be deleted.');
    }

    const filtered = list.filter((t) => t.id !== templateId);
    const ctx = await authService.getCurrentUserContext();
    const targetId = supermarketId || ctx?.supermarketId || '00000000-0000-0000-0000-000000000001';

    if (typeof window !== 'undefined') {
      localStorage.setItem(`doc_templates_${targetId}`, JSON.stringify(filtered));
    }
    return true;
  },

  async duplicateTemplate(templateId: string, supermarketId?: string): Promise<DocumentTemplate> {
    const list = await this.getTemplates(supermarketId);
    const target = list.find((t) => t.id === templateId);
    if (!target) throw new Error('Template not found');

    const copy: Partial<DocumentTemplate> = {
      ...target,
      id: `tmpl-custom-${Date.now()}`,
      name: `${target.name} (Copy)`,
      is_system: false,
      is_default: false,
    };

    return this.saveTemplate(copy);
  },
};
