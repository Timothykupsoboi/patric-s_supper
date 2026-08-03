export type GlobalRole = 'platform_owner';

export type SupermarketRole = 'supermarket_owner' | 'super_admin' | 'owner';

export type EmployeeRole =
  | 'branch_manager'
  | 'manager'
  | 'supervisor'
  | 'inventory_manager'
  | 'sales_manager'
  | 'accountant'
  | 'procurement_officer'
  | 'store_keeper'
  | 'customer_service'
  | 'cashier';

export type UserRole = GlobalRole | SupermarketRole | EmployeeRole;

export interface UserProfile {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  photo_url?: string;
  address?: string;
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
  registration_number?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  owner_id?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
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
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  buying_price: number;
  selling_price: number;
  wholesale_price?: number;
  minimum_price?: number;
  cost_price?: number;
  stock_quantity?: number;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  reorder_level?: number;
  tax_rate: number;
  vat_rate?: number;
  unit: string;
  image_url?: string;
  expiry_date?: string;
  location?: string;
  category?: Category;
  version?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
}

export interface Customer {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  name: string;
  email?: string;
  phone?: string;
  credit_limit: number;
  borrow_limit?: number;
  balance: number;
  current_debt?: number;
  store_credit?: number;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
}

export interface CustomerCreditLog {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  customer_id: string;
  type: 'charge' | 'payment';
  amount: number;
  description?: string;
  notes?: string;
  balance_after?: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  outstanding_balance?: number;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
}

export interface StockTransaction {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  product_id: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  unit_cost: number;
  notes?: string;
  reason?: string;
  product?: Product;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  supplier_id: string;
  order_number?: string;
  total_amount: number;
  status: 'ordered' | 'received' | 'returned';
  supplier?: Supplier;
  created_at: string;
}

export interface Expense {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  notes?: string;
  description?: string;
  date?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  supermarket_id?: string;
  branch_id?: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount: number;
  tax: number;
  product_name?: string;
  total_price?: number;
  product?: Product;
}

export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'credit';

export interface Sale {
  id: string;
  invoice_number?: string;
  supermarket_id?: string;
  branch_id?: string;
  cashier_id: string;
  customer_id?: string;
  total_amount: number;
  net_amount?: number;
  discount_amount: number;
  tax_amount: number;
  payment_method: PaymentMethod;
  payment_status: 'paid' | 'unpaid' | 'refunded';
  hold_status: 'active' | 'held' | 'refunded';
  status?: string;
  customer?: Customer;
  cashier?: UserProfile;
  sale_items?: SaleItem[];
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}
