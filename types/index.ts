export type UserRole =
  | 'platform_owner'
  | 'super_admin'
  | 'admin'
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'store_keeper'
  | 'accountant';

export interface UserProfile {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  pin?: string;
  is_active: boolean;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
}

export interface Supermarket {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string;
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  license_key?: string;
  max_branches: number;
  max_users: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
}

export interface Category {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  name: string;
  description?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
}

export interface Product {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  category_id?: string;
  supplier_id?: string;
  name: string;
  sku?: string;
  barcode?: string;
  qr_code?: string;
  unit: string;
  buying_price: number;
  selling_price: number;
  wholesale_price?: number;
  minimum_price?: number;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  image_url?: string;
  description?: string;
  expiry_date?: string;
  tax_rate: number;
  discount_rate?: number;
  location?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
  category?: Category;

  // Non-optional helper fields mapping to schema columns
  cost_price: number;
  stock_quantity: number;
  reorder_level: number;
  vat_rate: number;
}

export interface Customer {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  name: string;
  phone?: string;
  email?: string;
  national_id?: string;
  credit_limit: number;
  balance: number;
  loyalty_points?: number;
  notes?: string;
  birthday?: string;
  photo_url?: string;
  group_name?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;

  // Non-optional helper fields mapping to schema columns
  borrow_limit: number;
  current_debt: number;
  store_credit: number;
}

export interface CustomerCreditLog {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  customer_id: string;
  type: 'charge' | 'payment';
  amount: number;
  description?: string;
  due_date?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;

  // Helper properties
  notes?: string;
  balance_after?: number;
}

export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'credit' | 'split';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';
export type HoldStatus = 'active' | 'held' | 'voided' | 'refunded';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount: number;
  tax: number;
  supermarket_id?: string;
  branch_id?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
  product?: Product;
  product_name?: string;
  total_price?: number;
  vat_amount?: number;
}

export interface Sale {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  cashier_id: string;
  customer_id?: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes?: string;
  hold_status: HoldStatus;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;

  sale_items?: SaleItem[];
  customer?: Customer;
  cashier?: UserProfile;

  // Helper properties
  invoice_number?: string;
  net_amount?: number;
  status?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface StockTransaction {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  product_id: string;
  type: 'in' | 'out' | 'adjustment_add' | 'adjustment_sub' | 'transfer_in' | 'transfer_out' | 'damaged' | 'expired';
  quantity: number;
  unit_cost: number;
  reference_id?: string;
  notes?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
  product?: Product;

  // Helper properties
  reason?: string;
}

export interface Expense {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  category: 'rent' | 'electricity' | 'water' | 'transport' | 'salary' | 'maintenance' | 'internet' | 'other';
  amount: number;
  description?: string;
  date: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;

  // Helper properties
  title?: string;
  payment_method?: string;
}

export interface Supplier {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  outstanding_balance: number;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;

  // Helper property
  is_active?: boolean;
}

export interface PurchaseOrder {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  supplier_id: string;
  total_amount: number;
  status: 'ordered' | 'received' | 'returned';
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;

  supplier?: Supplier;

  // Helper properties
  order_number?: string;
}

export interface AuditLog {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  user_id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;

  // Helper properties
  entity_type?: string;
  entity_id?: string;
}
