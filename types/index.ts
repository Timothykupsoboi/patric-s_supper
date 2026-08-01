export type UserRole =
  | 'platform_owner'
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'cashier'
  | 'store_keeper'
  | 'accountant';

export interface Supermarket {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string;
  subscription_plan: 'free_trial' | 'monthly' | 'annual';
  subscription_status: 'trial' | 'active' | 'expired' | 'suspended';
  license_key?: string;
  max_branches: number;
  max_users: number;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  supermarket_id: string;
  name: string;
  location?: string;
  phone?: string;
  is_main_branch: boolean;
  created_at: string;
}

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
  created_at: string;
}

export interface Category {
  id: string;
  supermarket_id: string;
  branch_id?: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Brand {
  id: string;
  supermarket_id: string;
  branch_id?: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Product {
  id: string;
  supermarket_id: string;
  branch_id?: string;
  category_id?: string;
  brand_id?: string;
  name: string;
  barcode: string;
  sku?: string;
  description?: string;
  cost_price: number;
  selling_price: number;
  vat_rate: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  unit_of_measure?: string;
  expiry_date?: string;
  image_url?: string;
  created_at: string;
  category?: Category;
}

export interface Customer {
  id: string;
  supermarket_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  borrow_limit: number;
  current_debt: number;
  store_credit: number;
  is_active: boolean;
  created_at: string;
}

export interface CustomerCreditLog {
  id: string;
  supermarket_id: string;
  customer_id: string;
  sale_id?: string;
  type: 'borrow' | 'repayment' | 'credit_added' | 'credit_used';
  amount: number;
  balance_after: number;
  notes?: string;
  reference_number?: string;
  created_by?: string;
  created_at: string;
}

export type PaymentMethod = 'cash' | 'card' | 'mpesa' | 'credit' | 'split';

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // Flat discount per item
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
  vat_amount: number;
}

export interface PaymentBreakdown {
  payment_method: PaymentMethod;
  amount: number;
  reference_number?: string;
}

export interface Sale {
  id: string;
  supermarket_id: string;
  branch_id?: string;
  cashier_id: string;
  customer_id?: string;
  invoice_number: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  payment_method: PaymentMethod;
  status: 'completed' | 'refunded' | 'cancelled';
  notes?: string;
  created_at: string;
  sale_items?: SaleItem[];
  customer?: Customer;
  cashier?: UserProfile;
  payments?: PaymentBreakdown[];
}

export interface StockTransaction {
  id: string;
  supermarket_id: string;
  branch_id?: string;
  product_id: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage' | 'transfer';
  quantity: number;
  reason?: string;
  created_by?: string;
  created_at: string;
  product?: Product;
}

export interface Expense {
  id: string;
  supermarket_id: string;
  branch_id?: string;
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  supermarket_id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  supermarket_id: string;
  branch_id?: string;
  supplier_id: string;
  order_number: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  total_amount: number;
  expected_date?: string;
  created_by?: string;
  created_at: string;
  supplier?: Supplier;
}

export interface AuditLog {
  id: string;
  supermarket_id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}
