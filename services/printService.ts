import { Sale, CartItem } from '@/types';

export const printService = {
  printReceipt(sale: Partial<Sale>, cartItems?: CartItem[], storeName: string = 'NAIROBI SUPERMARKET'): void {
    if (typeof window === 'undefined') return;

    // Trigger standard browser print window targeting #printable-receipt
    window.print();
  },

  generateReceiptHtml(sale: Partial<Sale>, items: { name: string; qty: number; price: number; total: number }[], storeName: string = 'NAIROBI SUPERMARKET'): string {
    const itemsRows = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 4px 0;">${item.name}<br/>${item.qty} x KES ${item.price.toFixed(2)}</td>
        <td style="text-align: right; vertical-align: top; padding: 4px 0;">KES ${item.total.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `
      <div id="printable-receipt" style="width: 280px; font-family: monospace; font-size: 12px; margin: 0 auto; color: black; background: white;">
        <div style="text-align: center; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 16px; font-weight: bold;">${storeName}</h2>
          <p style="margin: 2px 0;">Main Branch, Nairobi CBD</p>
          <p style="margin: 2px 0;">Tel: +254 700 000 000</p>
          <hr style="border-top: 1px dashed #000; margin: 8px 0;"/>
          <p style="margin: 2px 0; font-weight: bold;">OFFICIAL RECEIPT</p>
          <p style="margin: 2px 0;">Inv #: ${sale.invoice_number || 'INV-LOCAL'}</p>
          <p style="margin: 2px 0;">Date: ${new Date().toLocaleString()}</p>
        </div>
        <hr style="border-top: 1px dashed #000; margin: 8px 0;"/>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; padding-bottom: 4px;">Item</th>
              <th style="text-align: right; padding-bottom: 4px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        <hr style="border-top: 1px dashed #000; margin: 8px 0;"/>
        <div style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Subtotal:</span>
            <span>KES ${(sale.total_amount || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Discount:</span>
            <span>-KES ${(sale.discount_amount || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>VAT Tax (16%):</span>
            <span>KES ${(sale.tax_amount || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px;">
            <span>TOTAL:</span>
            <span>KES ${(sale.net_amount || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Payment Method:</span>
            <span style="text-transform: uppercase;">${sale.payment_method || 'CASH'}</span>
          </div>
        </div>
        <hr style="border-top: 1px dashed #000; margin: 12px 0 8px 0;"/>
        <div style="text-align: center; font-size: 11px;">
          <p style="margin: 2px 0;">Thank you for shopping with us!</p>
          <p style="margin: 2px 0;">Goods once sold are non-refundable.</p>
        </div>
      </div>
    `;
  },
};
