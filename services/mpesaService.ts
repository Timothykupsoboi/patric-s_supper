import { createClient } from '@/lib/supabase/client';
import { authService } from './authService';

export interface MpesaConfig {
  supermarket_id: string;
  environment: 'sandbox' | 'production';
  consumer_key: string;
  consumer_secret: string;
  business_shortcode: string;
  till_number?: string;
  paybill_number?: string;
  passkey: string;
  callback_url: string;
  validation_url?: string;
  confirmation_url?: string;
  account_reference: string;
  transaction_desc: string;
  enable_stk_push: boolean;
  enable_paybill: boolean;
  enable_till: boolean;
  enable_refunds: boolean;
  enable_reconciliation: boolean;
}

export interface MpesaTransaction {
  id: string;
  supermarket_id: string;
  branch_id?: string;
  checkout_request_id: string;
  mpesa_receipt_number: string;
  phone_number: string;
  amount: number;
  customer_name?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  payment_channel: 'STK_PUSH' | 'PAYBILL' | 'TILL_NUMBER';
  account_reference?: string;
  cashier_name?: string;
  branch_name?: string;
  created_at: string;
}

export interface MpesaStkPushResponse {
  success: boolean;
  checkoutRequestId?: string;
  referenceNumber?: string;
  message: string;
  status?: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';
}

export const DEFAULT_MPESA_CONFIG: MpesaConfig = {
  supermarket_id: '00000000-0000-0000-0000-000000000001',
  environment: 'sandbox',
  consumer_key: 'sb_ck_1729384918239120',
  consumer_secret: 'sb_cs_9849201948291039',
  business_shortcode: '174379',
  till_number: '889900',
  paybill_number: '600100',
  passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  callback_url: 'https://api.antigravityretail.com/mpesa/callback',
  validation_url: 'https://api.antigravityretail.com/mpesa/validation',
  confirmation_url: 'https://api.antigravityretail.com/mpesa/confirmation',
  account_reference: 'STORE_POS',
  transaction_desc: 'Supermarket POS Payment',
  enable_stk_push: true,
  enable_paybill: true,
  enable_till: true,
  enable_refunds: true,
  enable_reconciliation: true,
};

// Mock memory store for demo transactions
let mpesaTransactionsStore: MpesaTransaction[] = [
  {
    id: 'mp-tx-1',
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    checkout_request_id: 'ws_CO_2026080318001',
    mpesa_receipt_number: 'QW78X9K12',
    phone_number: '254712345678',
    amount: 1450,
    customer_name: 'John Kamau',
    status: 'SUCCESS',
    payment_channel: 'STK_PUSH',
    account_reference: 'STORE_POS',
    cashier_name: 'Jane Cashier',
    branch_name: 'CBD Main Store',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'mp-tx-2',
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    checkout_request_id: 'ws_CO_2026080318002',
    mpesa_receipt_number: 'QW78X9K15',
    phone_number: '254798765432',
    amount: 3200,
    customer_name: 'Mary Wanjiku',
    status: 'SUCCESS',
    payment_channel: 'TILL_NUMBER',
    account_reference: 'TILL_889900',
    cashier_name: 'Jane Cashier',
    branch_name: 'CBD Main Store',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'mp-tx-3',
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    checkout_request_id: 'ws_CO_2026080318003',
    mpesa_receipt_number: 'QW78X9K99',
    phone_number: '254722114455',
    amount: 850,
    customer_name: 'David Omondi',
    status: 'CANCELLED',
    payment_channel: 'STK_PUSH',
    account_reference: 'STORE_POS',
    cashier_name: 'Samuel M',
    branch_name: 'Westlands Branch',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const mpesaService = {
  // Format phone number to standard 2547XXXXXXXX or 2541XXXXXXXX
  formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/[^0-9]/g, '');
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('+254')) {
      formatted = formatted.substring(1);
    }
    return formatted;
  },

  validatePhone(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return formatted.length === 12 && (formatted.startsWith('2547') || formatted.startsWith('2541'));
  },

  async getConfig(supermarketId?: string): Promise<MpesaConfig> {
    const ctx = await authService.getCurrentUserContext();
    const targetId = supermarketId || ctx?.supermarketId || DEFAULT_MPESA_CONFIG.supermarket_id;

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`mpesa_config_${targetId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
    return { ...DEFAULT_MPESA_CONFIG, supermarket_id: targetId };
  },

  async saveConfig(supermarketId: string, config: Partial<MpesaConfig>): Promise<MpesaConfig> {
    const current = await this.getConfig(supermarketId);
    const updated = { ...current, ...config, supermarket_id: supermarketId };

    if (typeof window !== 'undefined') {
      localStorage.setItem(`mpesa_config_${supermarketId}`, JSON.stringify(updated));
    }
    return updated;
  },

  async testConnection(config: Partial<MpesaConfig>): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (!config.consumer_key || !config.consumer_secret || !config.business_shortcode) {
      return {
        success: false,
        message: 'Connection failed: Consumer Key, Consumer Secret, and Business Shortcode are required.',
      };
    }

    return {
      success: true,
      message: `Successfully authenticated with Safaricom Daraja API (${config.environment || 'sandbox'} environment). Access token granted.`,
    };
  },

  async triggerStkPush(phoneNumber: string, amount: number, accountRef = 'POS_STORE'): Promise<MpesaStkPushResponse> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    if (!this.validatePhone(phoneNumber)) {
      return {
        success: false,
        message: 'Invalid Kenyan phone number format. Must be e.g. 0712345678 or 254712345678.',
      };
    }

    // Simulate STK Push API call to Safaricom Daraja Gateway
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const checkoutReqId = `ws_CO_${Date.now()}`;
    const mpesaRef = `MP${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Record pending transaction
    const newTx: MpesaTransaction = {
      id: `mp-tx-${Date.now()}`,
      supermarket_id: '00000000-0000-0000-0000-000000000001',
      checkout_request_id: checkoutReqId,
      mpesa_receipt_number: mpesaRef,
      phone_number: formattedPhone,
      amount,
      status: 'PENDING',
      payment_channel: 'STK_PUSH',
      account_reference: accountRef,
      cashier_name: 'Current Cashier',
      branch_name: 'CBD Main Store',
      created_at: new Date().toISOString(),
    };

    mpesaTransactionsStore.unshift(newTx);

    return {
      success: true,
      checkoutRequestId: checkoutReqId,
      referenceNumber: mpesaRef,
      status: 'PENDING',
      message: `STK Push prompt sent to +${formattedPhone}. Prompting customer for M-Pesa PIN...`,
    };
  },

  async pollStkStatus(checkoutRequestId: string): Promise<MpesaStkPushResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const tx = mpesaTransactionsStore.find((t) => t.checkout_request_id === checkoutRequestId);
    if (tx) {
      tx.status = 'SUCCESS';
      return {
        success: true,
        checkoutRequestId,
        referenceNumber: tx.mpesa_receipt_number,
        status: 'SUCCESS',
        message: `M-Pesa payment of KES ${tx.amount.toLocaleString()} received successfully (${tx.mpesa_receipt_number}).`,
      };
    }

    return {
      success: true,
      checkoutRequestId,
      referenceNumber: `MP-${Date.now().toString().slice(-6)}`,
      status: 'SUCCESS',
      message: 'M-Pesa payment confirmed.',
    };
  },

  async getTransactions(supermarketId?: string): Promise<MpesaTransaction[]> {
    return mpesaTransactionsStore;
  },

  async refundTransaction(transactionId: string): Promise<boolean> {
    const tx = mpesaTransactionsStore.find((t) => t.id === transactionId);
    if (tx) {
      tx.status = 'REFUNDED';
      return true;
    }
    return false;
  },
};
