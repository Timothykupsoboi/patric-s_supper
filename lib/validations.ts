import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  barcode: z.string().min(1, 'Barcode is required'),
  sku: z.string().optional(),
  unit: z.string().default('Pcs'),
  buying_price: z.number().min(0, 'Buying price must be non-negative'),
  selling_price: z.number().min(0, 'Selling price must be non-negative'),
  current_stock: z.number().min(0, 'Current stock must be non-negative'),
  minimum_stock: z.number().min(0).default(5),
  tax_rate: z.number().min(0).default(16),
  expiry_date: z.string().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  credit_limit: z.number().min(0, 'Credit limit must be non-negative').default(5000),
});

export const expenseSchema = z.object({
  description: z.string().min(2, 'Expense description is required'),
  category: z.enum(['rent', 'electricity', 'water', 'transport', 'salary', 'maintenance', 'internet', 'other']),
  amount: z.number().positive('Expense amount must be greater than zero'),
  date: z.string().optional(),
});

export const checkoutSchema = z.object({
  cashier_id: z.string().uuid('Invalid cashier ID format'),
  supermarket_id: z.string().uuid('Invalid supermarket tenant ID'),
  payment_method: z.enum(['cash', 'mpesa', 'card', 'credit', 'split']),
  total_amount: z.number().min(0, 'Total amount cannot be negative'),
  tax_amount: z.number().min(0),
  discount_amount: z.number().min(0),
});
