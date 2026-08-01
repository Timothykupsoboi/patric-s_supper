import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  barcode: z.string().min(1, 'Barcode is required'),
  sku: z.string().optional(),
  cost_price: z.number().min(0, 'Cost price must be non-negative'),
  selling_price: z.number().min(0, 'Selling price must be non-negative'),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
  reorder_level: z.number().int().min(0).default(5),
  expiry_date: z.string().optional(),
  category_id: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  borrow_limit: z.number().min(0, 'Borrow limit must be non-negative').default(5000),
});

export const expenseSchema = z.object({
  title: z.string().min(2, 'Expense title is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Expense amount must be greater than zero'),
  payment_method: z.enum(['cash', 'card', 'mpesa', 'bank_transfer']).default('cash'),
});

export const checkoutSchema = z.object({
  cashier_id: z.string().uuid('Invalid cashier ID format'),
  supermarket_id: z.string().uuid('Invalid supermarket tenant ID'),
  payment_method: z.enum(['cash', 'card', 'mpesa', 'credit', 'split']),
  net_amount: z.number().min(0, 'Net amount cannot be negative'),
  tax_amount: z.number().min(0),
  discount_amount: z.number().min(0),
});
