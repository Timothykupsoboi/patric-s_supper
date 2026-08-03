import { authService } from './authService';

export interface WhatsAppConfig {
  supermarket_id: string;
  is_enabled: boolean;
  phone_number_id: string;
  business_account_id: string;
  permanent_access_token: string;
  webhook_verify_token: string;
  webhook_url: string;
  default_country_code: string;
  display_name: string;
  business_phone: string;
}

export type WhatsAppMessageType =
  | 'order_confirmation'
  | 'payment_confirmation'
  | 'mpesa_success'
  | 'digital_receipt'
  | 'delivery_update'
  | 'loyalty_rewards'
  | 'welcome_message'
  | 'birthday_message'
  | 'order_cancelled'
  | 'refund_confirmation'
  | 'low_stock_alert'
  | 'purchase_order_new'
  | 'shift_reminder'
  | 'daily_sales_digest'
  | 'marketing_campaign';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'TRANSACTIONAL' | 'MARKETING' | 'UTILITY';
  language: string;
  body_text: string;
  variables: string[]; // e.g. ['customer_name', 'business_name', 'invoice_number', 'amount']
}

export interface WhatsAppMessageLog {
  id: string;
  supermarket_id: string;
  recipient_name?: string;
  phone_number: string;
  message_type: WhatsAppMessageType;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  sent_by_user?: string;
  created_at: string;
}

export interface WhatsAppCampaign {
  id: string;
  supermarket_id: string;
  title: string;
  segment: 'ALL' | 'VIP' | 'LOYALTY' | 'DEBTORS' | 'INACTIVE' | 'NEW';
  template_id: string;
  message_preview: string;
  status: 'DRAFT' | 'SCHEDULED' | 'COMPLETED';
  sent_count: number;
  read_count: number;
  created_at: string;
}

export interface NotificationTriggerPreferences {
  customer_order_confirmation: boolean;
  customer_payment_success: boolean;
  customer_mpesa_receipt: boolean;
  customer_delivery_update: boolean;
  customer_birthday_reward: boolean;
  employee_low_stock_alert: boolean;
  employee_po_created: boolean;
  manager_expired_product: boolean;
  manager_daily_digest: boolean;
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  supermarket_id: '00000000-0000-0000-0000-000000000001',
  is_enabled: true,
  phone_number_id: '109283746501928',
  business_account_id: '881920394819203',
  permanent_access_token: 'EAAG982348102938471029384710923847109238',
  webhook_verify_token: 'antigravity_wa_verify_sec_99',
  webhook_url: 'https://api.antigravityretail.com/webhooks/whatsapp',
  default_country_code: '+254',
  display_name: 'Nairobi Supermarket Official',
  business_phone: '254700000000',
};

let mockMessageLogs: WhatsAppMessageLog[] = [
  {
    id: 'wa-log-1',
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    recipient_name: 'John Kamau',
    phone_number: '254712345678',
    message_type: 'digital_receipt',
    content: 'Hi John, thank you for shopping at Nairobi Supermarket! Invoice #INV-88192 total KES 1,630.00. Receipt link: https://receipt.nairobisuper.com/88192',
    status: 'READ',
    sent_by_user: 'Jane Cashier',
    created_at: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: 'wa-log-2',
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    recipient_name: 'Mary Wanjiku',
    phone_number: '254798765432',
    message_type: 'mpesa_success',
    content: 'M-Pesa Payment Received! KES 3,200.00 confirmed for invoice #INV-88195 (Ref: QW78X9K15). Thank you!',
    status: 'DELIVERED',
    sent_by_user: 'System Automated',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'wa-log-3',
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    recipient_name: 'Store Manager',
    phone_number: '254722114455',
    message_type: 'low_stock_alert',
    content: 'CRITICAL STOCK ALERT: "Fresh Dairy Milk 1L" stock has reached 3 units (reorder level: 10). Please issue Purchase Order.',
    status: 'SENT',
    sent_by_user: 'System Automated',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

let mockTemplates: WhatsAppTemplate[] = [
  {
    id: 'tmpl-wa-receipt',
    name: 'pos_digital_receipt',
    category: 'TRANSACTIONAL',
    language: 'en_US',
    body_text: 'Hi {{customer_name}}, thank you for shopping at {{business_name}}! Invoice #{{invoice_number}} total {{amount}}. View receipt: {{link}}',
    variables: ['customer_name', 'business_name', 'invoice_number', 'amount', 'link'],
  },
  {
    id: 'tmpl-wa-mpesa',
    name: 'mpesa_payment_confirm',
    category: 'TRANSACTIONAL',
    language: 'en_US',
    body_text: 'M-Pesa payment of {{amount}} received for {{business_name}} invoice #{{invoice_number}} (Ref: {{mpesa_ref}}). Thank you!',
    variables: ['amount', 'business_name', 'invoice_number', 'mpesa_ref'],
  },
  {
    id: 'tmpl-wa-promo',
    name: 'weekend_flash_sale',
    category: 'MARKETING',
    language: 'en_US',
    body_text: 'Hello {{customer_name}}! {{business_name}} Weekend Flash Sale: Get up to 20% off all groceries this Saturday!',
    variables: ['customer_name', 'business_name'],
  },
];

export const whatsappService = {
  formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/[^0-9]/g, '');
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('+254')) {
      formatted = formatted.substring(1);
    }
    return formatted;
  },

  async getConfig(supermarketId?: string): Promise<WhatsAppConfig> {
    const ctx = await authService.getCurrentUserContext();
    const targetId = supermarketId || ctx?.supermarketId || DEFAULT_WHATSAPP_CONFIG.supermarket_id;

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`wa_config_${targetId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
    return { ...DEFAULT_WHATSAPP_CONFIG, supermarket_id: targetId };
  },

  async saveConfig(supermarketId: string, config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    const current = await this.getConfig(supermarketId);
    const updated = { ...current, ...config, supermarket_id: supermarketId };

    if (typeof window !== 'undefined') {
      localStorage.setItem(`wa_config_${supermarketId}`, JSON.stringify(updated));
    }
    return updated;
  },

  async testConnection(config: Partial<WhatsAppConfig>): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (!config.phone_number_id || !config.permanent_access_token) {
      return {
        success: false,
        message: 'Connection failed: Phone Number ID and Permanent Access Token are required.',
      };
    }

    return {
      success: true,
      message: `Successfully connected to Meta WhatsApp Business Cloud API for "${config.display_name || 'Supermarket'}". Webhook token active.`,
    };
  },

  async sendNotification(
    toPhone: string,
    messageType: WhatsAppMessageType,
    content: string,
    recipientName?: string
  ): Promise<WhatsAppMessageLog> {
    const formattedPhone = this.formatPhoneNumber(toPhone);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const log: WhatsAppMessageLog = {
      id: `wa-log-${Date.now()}`,
      supermarket_id: '00000000-0000-0000-0000-000000000001',
      recipient_name: recipientName || 'Customer',
      phone_number: formattedPhone,
      message_type: messageType,
      content,
      status: 'DELIVERED',
      sent_by_user: 'Staff User',
      created_at: new Date().toISOString(),
    };

    mockMessageLogs.unshift(log);
    return log;
  },

  async getMessageLogs(): Promise<WhatsAppMessageLog[]> {
    return mockMessageLogs;
  },

  async retryMessage(logId: string): Promise<boolean> {
    const found = mockMessageLogs.find((l) => l.id === logId);
    if (found) {
      found.status = 'DELIVERED';
      found.created_at = new Date().toISOString();
      return true;
    }
    return false;
  },

  async getTemplates(): Promise<WhatsAppTemplate[]> {
    return mockTemplates;
  },

  async saveTemplate(template: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> {
    if (template.id) {
      const idx = mockTemplates.findIndex((t) => t.id === template.id);
      if (idx !== -1) {
        mockTemplates[idx] = { ...mockTemplates[idx], ...template } as WhatsAppTemplate;
        return mockTemplates[idx];
      }
    }
    const newTmpl: WhatsAppTemplate = {
      id: `tmpl-wa-${Date.now()}`,
      name: template.name || 'new_template',
      category: template.category || 'TRANSACTIONAL',
      language: 'en_US',
      body_text: template.body_text || '',
      variables: template.variables || [],
    };
    mockTemplates.unshift(newTmpl);
    return newTmpl;
  },
};
