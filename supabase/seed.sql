-- ====================================================================
-- ANTIGRAVITY SUPERMARKET POS PLATFORM - SQL SEED DATA
-- ====================================================================
-- Multi-Tenant Seed File for Independent Supermarkets:
-- 1. Prince Supermarket (Owner: prince@example.com)
-- 2. Dany Supermarket (Owner: dany@example.com)
-- ====================================================================

-- --------------------------------------------------------------------
-- SECTION 1: SUPERMARKET TENANTS
-- --------------------------------------------------------------------

INSERT INTO public.supermarkets (
  id, name, phone, email, address, logo_url, subscription_plan, subscription_status, 
  trial_ends_at, subscription_ends_at, license_key, max_branches, max_users, 
  created_at, updated_at, deleted, version
) VALUES 
(
  '11111111-1111-4111-a111-111111111111', 
  'Prince Supermarket', 
  '+254711111111', 
  'prince@example.com', 
  'Kilmarnock Road, Kilimani, Nairobi', 
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80', 
  'professional', 
  'active', 
  NOW() + INTERVAL '14 days', 
  NOW() + INTERVAL '1 year', 
  'LIC-PRINCE-2026-X89K', 
  10, 
  25, 
  NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222222', 
  'Dany Supermarket', 
  '+254722222222', 
  'dany@example.com', 
  'Ngong Road, Junction, Nairobi', 
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80', 
  'enterprise', 
  'active', 
  NOW() + INTERVAL '14 days', 
  NOW() + INTERVAL '1 year', 
  'LIC-DANY-2026-Y90L', 
  999, 
  100, 
  NOW(), NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- SECTION 2: DEFAULT BRANCHES
-- --------------------------------------------------------------------

INSERT INTO public.branches (
  id, supermarket_id, name, location, created_at, updated_at, deleted, version
) VALUES 
(
  '11111111-1111-4111-a111-111111111112', 
  '11111111-1111-4111-a111-111111111111', 
  'Prince Kilimani Main Branch', 
  'Kilimani HQ, Nairobi', 
  NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222223', 
  '22222222-2222-4222-a222-222222222222', 
  'Dany Junction Main Branch', 
  'Junction HQ, Nairobi', 
  NOW(), NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- SECTION 3: USERS & EMPLOYEES
-- Roles allowed: 'super_admin', 'manager', 'cashier', 'store_keeper', 'accountant'
-- --------------------------------------------------------------------

INSERT INTO public.users (
  id, supermarket_id, branch_id, name, email, role, phone, pin, is_active, created_at, updated_at, deleted, version
) VALUES 
-- Prince Supermarket Team
(
  '11111111-1111-4111-a111-111111111113', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Prince', 
  'prince@example.com', 
  'super_admin', 
  '+254711000001', 
  '1111', 
  TRUE, NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111114', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Alex Kipkorir', 
  'prince_mgr@example.com', 
  'manager', 
  '+254711000002', 
  '1122', 
  TRUE, NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111115', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Faith Wambui', 
  'prince_cashier@example.com', 
  'cashier', 
  '+254711000003', 
  '1234', 
  TRUE, NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111116', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Dennis Otieno', 
  'prince_store@example.com', 
  'store_keeper', 
  '+254711000004', 
  '1133', 
  TRUE, NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111117', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Grace Nyambura', 
  'prince_acct@example.com', 
  'accountant', 
  '+254711000005', 
  '1144', 
  TRUE, NOW(), NOW(), FALSE, 1
),

-- Dany Supermarket Team
(
  '22222222-2222-4222-a222-222222222224', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Dany', 
  'dany@example.com', 
  'super_admin', 
  '+254722000001', 
  '2222', 
  TRUE, NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222225', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Kevin Mutua', 
  'dany_mgr@example.com', 
  'manager', 
  '+254722000002', 
  '2233', 
  TRUE, NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222226', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Joy Chebet', 
  'dany_cashier@example.com', 
  'cashier', 
  '+254722000003', 
  '5678', 
  TRUE, NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222227', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Brian Omondi', 
  'dany_store@example.com', 
  'store_keeper', 
  '+254722000004', 
  '2244', 
  TRUE, NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222228', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Sarah Akinyi', 
  'dany_acct@example.com', 
  'accountant', 
  '+254722000005', 
  '2255', 
  TRUE, NOW(), NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- SECTION 4: CATEGORIES
-- --------------------------------------------------------------------

INSERT INTO public.categories (
  id, supermarket_id, branch_id, name, description, created_at, updated_at, deleted, version
) VALUES 
-- Prince Supermarket Categories
(
  '11111111-1111-4111-a111-111111111121', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Dairy & Eggs', 'Milk, yogurt, cheese, butter, and fresh eggs', NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111122', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Bakery & Pastries', 'Fresh bread, buns, cakes, and cookies', NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111123', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Beverages & Soft Drinks', 'Juices, water, sodas, tea, and coffee', NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111124', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Grains, Flour & Sugar', 'Rice, maize flour, wheat flour, sugar, salt', NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111125', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Personal Hygiene', 'Bath soap, toothpaste, tissue, and shampoo', NOW(), NOW(), FALSE, 1
),

-- Dany Supermarket Categories
(
  '22222222-2222-4222-a222-222222222231', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Dairy & Fresh', 'Milk, yogurt, and fresh farm products', NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222232', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Bakery Essentials', 'Whole grain bread, rolls, and pastries', NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222233', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Cold Drinks & Water', 'Flavored fruit juices, sodas, and mineral water', NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222234', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Staple Foods', 'Pishori rice, unga, vegetable oils, and salt', NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222235', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Cleaning & Home Care', 'Detergents, soaps, tissue paper, and antiseptics', NOW(), NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- SECTION 5: SUPPLIERS
-- --------------------------------------------------------------------

INSERT INTO public.suppliers (
  id, supermarket_id, branch_id, name, contact_person, phone, email, outstanding_balance, created_at, updated_at, deleted, version
) VALUES 
-- Prince Suppliers
(
  '11111111-1111-4111-a111-111111111131', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Brookside Dairy Kenya', 'Joseph Ndung u', '+254733100200', 'orders@brookside.co.ke', 15400.00, NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111132', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Broadways Bakery Ltd', 'Mary Wanja', '+254733100300', 'sales@broadways.co.ke', 0.00, NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111133', 
  '11111111-1111-4111-a111-111111111111', 
  '11111111-1111-4111-a111-111111111112', 
  'Coca-Cola Bottlers EA', 'Peter Maina', '+254733100400', 'supply@cocacola.co.ke', 48500.00, NOW(), NOW(), FALSE, 1
),

-- Dany Suppliers
(
  '22222222-2222-4222-a222-222222222241', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'New KCC Dairy Ltd', 'Samuel Cheruiyot', '+254733200100', 'supply@newkcc.co.ke', 0.00, NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222242', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Festo Bakers & Confectioners', 'Lucy Njeri', '+254733200200', 'orders@festo.co.ke', 8200.00, NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222243', 
  '22222222-2222-4222-a222-222222222222', 
  '22222222-2222-4222-a222-222222222223', 
  'Bidco Africa Oils & Soaps', 'Hassan Ali', '+254733200300', 'corporate@bidco.co.ke', 32000.00, NOW(), NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- SECTION 6: PRODUCTS
-- --------------------------------------------------------------------

INSERT INTO public.products (
  id, supermarket_id, branch_id, supplier_id, name, sku, barcode, qr_code, unit, 
  buying_price, selling_price, wholesale_price, minimum_price, current_stock, 
  minimum_stock, maximum_stock, image_url, description, expiry_date, tax_rate, 
  discount_rate, location, created_at, updated_at, deleted, version
) VALUES 
-- Prince Supermarket Products (SKUs: SKU-PRINCE-001 to SKU-PRINCE-010)
(
  '11111111-1111-4111-a111-111111111141', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112', '11111111-1111-4111-a111-111111111131',
  'Fresh Whole Milk 1L', 'SKU-PRINCE-001', '616110000101', 'QR-PRINCE-001', 'Pcs',
  85.00, 110.00, 100.00, 95.00, 150.00, 20.00, 500.00,
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop&q=80',
  'Pasteurized fresh whole cow milk 1 Liter pouch', CURRENT_DATE + INTERVAL '10 days', 0.00, 0.00, 'Aisle 1 - Dairy Fridge',
  NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111142', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112', '11111111-1111-4111-a111-111111111132',
  'Broadways White Bread 400g', 'SKU-PRINCE-002', '616110000102', 'QR-PRINCE-002', 'Pcs',
  55.00, 65.00, 60.00, 58.00, 80.00, 15.00, 300.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80',
  'Freshly baked white sandwich bread 400g', CURRENT_DATE + INTERVAL '5 days', 0.00, 0.00, 'Aisle 2 - Bakery Shelf',
  NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111143', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112', NULL,
  'White Refined Sugar 2kg', 'SKU-PRINCE-003', '616110000103', 'QR-PRINCE-003', 'Pcs',
  230.00, 280.00, 260.00, 250.00, 120.00, 25.00, 400.00,
  'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=200&auto=format&fit=crop&q=80',
  'Pure refined white cane sugar 2kg pack', CURRENT_DATE + INTERVAL '365 days', 16.00, 0.00, 'Aisle 3 - Shelf B',
  NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111144', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112', NULL,
  'Super Basmati Rice 5kg', 'SKU-PRINCE-004', '616110000104', 'QR-PRINCE-004', 'Pcs',
  750.00, 950.00, 880.00, 850.00, 60.00, 10.00, 200.00,
  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&auto=format&fit=crop&q=80',
  'Premium aromatic long grain Basmati rice 5kg', CURRENT_DATE + INTERVAL '500 days', 0.00, 0.00, 'Aisle 3 - Shelf D',
  NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111145', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112', NULL,
  'Vegetable Cooking Oil 3L', 'SKU-PRINCE-005', '616110000105', 'QR-PRINCE-005', 'Pcs',
  680.00, 820.00, 750.00, 720.00, 45.00, 12.00, 150.00,
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&auto=format&fit=crop&q=80',
  'Fortified refined vegetable cooking oil 3 Liters', CURRENT_DATE + INTERVAL '200 days', 16.00, 0.00, 'Aisle 4 - Shelf A',
  NOW(), NOW(), FALSE, 1
),

-- Dany Supermarket Products (SKUs: SKU-DANY-001 to SKU-DANY-005)
(
  '22222222-2222-4222-a222-222222222251', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223', '22222222-2222-4222-a222-222222222241',
  'Fresh Strawberry Yogurt 500ml', 'SKU-DANY-001', '616220000201', 'QR-DANY-001', 'Pcs',
  90.00, 125.00, 110.00, 105.00, 95.00, 15.00, 300.00,
  'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=200&auto=format&fit=crop&q=80',
  'Probiotic strawberry flavored drinkable yogurt 500ml', CURRENT_DATE + INTERVAL '21 days', 0.00, 0.00, 'Cold Storage Unit 2',
  NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222252', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223', '22222222-2222-4222-a222-222222222242',
  'Festo Brown Bread 400g', 'SKU-DANY-002', '616220000202', 'QR-DANY-002', 'Pcs',
  60.00, 75.00, 70.00, 68.00, 110.00, 20.00, 400.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80',
  'High fiber brown wheat sandwich bread 400g', CURRENT_DATE + INTERVAL '6 days', 0.00, 0.00, 'Bakery Display Counter',
  NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222253', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223', '22222222-2222-4222-a222-222222222243',
  'Pure Sunflower Cooking Oil 2L', 'SKU-DANY-003', '616220000203', 'QR-DANY-003', 'Pcs',
  520.00, 640.00, 590.00, 560.00, 70.00, 15.00, 250.00,
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&auto=format&fit=crop&q=80',
  'Cholesterol free pure sunflower seed oil 2 Liters', CURRENT_DATE + INTERVAL '180 days', 16.00, 0.00, 'Rack C - Shelf 1',
  NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222254', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223', NULL,
  'Orange Fruit Juice 1L', 'SKU-DANY-004', '616220000204', 'QR-DANY-004', 'Pcs',
  140.00, 185.00, 170.00, 160.00, 130.00, 25.00, 350.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200&auto=format&fit=crop&q=80',
  '100% natural orange fruit juice blend 1 Liter bottle', CURRENT_DATE + INTERVAL '90 days', 16.00, 0.00, 'Beverages Display 3',
  NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222255', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223', '22222222-2222-4222-a222-222222222243',
  'Laundry Powder Detergent 1kg', 'SKU-DANY-005', '616220000205', 'QR-DANY-005', 'Pcs',
  180.00, 230.00, 210.00, 200.00, 90.00, 20.00, 300.00,
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80',
  'Multi-action stain remover washing powder 1kg', CURRENT_DATE + INTERVAL '700 days', 16.00, 0.00, 'Cleaning Section - Aisle 4',
  NOW(), NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- SECTION 7: CUSTOMERS
-- --------------------------------------------------------------------

INSERT INTO public.customers (
  id, supermarket_id, branch_id, name, phone, email, national_id, credit_limit, balance, 
  loyalty_points, notes, birthday, photo_url, group_name, created_at, updated_at, deleted, version
) VALUES 
-- Prince Customers
(
  '11111111-1111-4111-a111-111111111161', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112',
  'John Kariuki', '+254701111222', 'john.k@gmail.com', '28475930', 10000.00, 1500.00, 140, 'VIP Customer - Prompt Repayment', '1988-04-12', NULL, 'VIP',
  NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111162', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112',
  'Jane Mwangi', '+254701111333', 'jane.m@yahoo.com', '30294812', 5000.00, 0.00, 85, 'Regular Shopper', '1992-09-24', NULL, 'Regular',
  NOW(), NOW(), FALSE, 1
),

-- Dany Customers
(
  '22222222-2222-4222-a222-222222222271', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223',
  'David Omwamba', '+254702222444', 'david.o@gmail.com', '29384756', 15000.00, 3200.00, 210, 'Corporate Customer Account', '1985-11-05', NULL, 'Corporate',
  NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222272', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223',
  'Esther Nanjala', '+254702222555', 'esther.n@outlook.com', '31049582', 7500.00, 0.00, 95, 'Regular Shopper', '1995-02-18', NULL, 'Regular',
  NOW(), NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- SECTION 8: EXPENSES
-- Allowed categories: 'rent', 'electricity', 'water', 'transport', 'salary', 'maintenance', 'internet', 'other'
-- --------------------------------------------------------------------

INSERT INTO public.expenses (
  id, supermarket_id, branch_id, category, amount, description, date, created_at, updated_at, deleted, version
) VALUES 
-- Prince Expenses
(
  '11111111-1111-4111-a111-111111111181', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112',
  'rent', 85000.00, 'Monthly Store Premises Rent - Kilimani', CURRENT_DATE - INTERVAL '5 days', NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111182', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112',
  'electricity', 18400.00, 'Kenya Power Electricity Bill - Cold Storage', CURRENT_DATE - INTERVAL '2 days', NOW(), NOW(), FALSE, 1
),

-- Dany Expenses
(
  '22222222-2222-4222-a222-222222222291', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223',
  'rent', 120000.00, 'Monthly Store Premises Rent - Junction Branch', CURRENT_DATE - INTERVAL '6 days', NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222292', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223',
  'internet', 12500.00, 'Fibre Internet & POS Network Connectivity', CURRENT_DATE - INTERVAL '1 day', NOW(), NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- SECTION 9: SALES & SALE ITEMS
-- --------------------------------------------------------------------

INSERT INTO public.sales (
  id, supermarket_id, branch_id, cashier_id, customer_id, total_amount, 
  discount_amount, tax_amount, payment_status, payment_method, notes, 
  hold_status, created_at, updated_at, deleted, version
) VALUES 
-- Prince Sale 1
(
  '11111111-1111-4111-a111-111111111191', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112',
  '11111111-1111-4111-a111-111111111115', '11111111-1111-4111-a111-111111111161',
  455.00, 0.00, 38.62, 'paid', 'mpesa', 'POS Checkout #1001', 'active', NOW() - INTERVAL '2 hours', NOW(), FALSE, 1
),

-- Dany Sale 1
(
  '22222222-2222-4222-a222-222222222301', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223',
  '22222222-2222-4222-a222-222222222226', '22222222-2222-4222-a222-222222222271',
  950.00, 0.00, 88.28, 'paid', 'cash', 'POS Checkout #2001', 'active', NOW() - INTERVAL '1 hour', NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sale_items (
  id, supermarket_id, branch_id, sale_id, product_id, quantity, unit_price, subtotal, discount, tax, created_at, updated_at, deleted, version
) VALUES 
-- Items for Prince Sale 1
(
  '11111111-1111-4111-a111-111111111192', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112',
  '11111111-1111-4111-a111-111111111191', '11111111-1111-4111-a111-111111111141', 2.00, 110.00, 220.00, 0.00, 0.00, NOW(), NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111193', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112',
  '11111111-1111-4111-a111-111111111191', '11111111-1111-4111-a111-111111111143', 1.00, 280.00, 280.00, 0.00, 38.62, NOW(), NOW(), FALSE, 1
),

-- Items for Dany Sale 1
(
  '22222222-2222-4222-a222-222222222302', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223',
  '22222222-2222-4222-a222-222222222301', '22222222-2222-4222-a222-222222222253', 1.00, 640.00, 640.00, 0.00, 88.28, NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222303', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223',
  '22222222-2222-4222-a222-222222222301', '22222222-2222-4222-a222-222222222254', 2.00, 185.00, 370.00, 0.00, 0.00, NOW(), NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- SECTION 10: STOCK TRANSACTIONS
-- Allowed types: 'in', 'out', 'adjustment_add', 'adjustment_sub', 'transfer_in', 'transfer_out', 'damaged', 'expired'
-- --------------------------------------------------------------------

INSERT INTO public.stock_transactions (
  id, supermarket_id, branch_id, product_id, type, quantity, unit_cost, reference_id, notes, created_at, updated_at, deleted, version
) VALUES 
-- Prince Stock Transactions
(
  '11111111-1111-4111-a111-111111111195', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112',
  '11111111-1111-4111-a111-111111111141', 'in', 100.00, 85.00, 'PO-BROOK-001', 'Initial Stock Intake Brookside Milk', NOW() - INTERVAL '3 days', NOW(), FALSE, 1
),
(
  '11111111-1111-4111-a111-111111111196', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112',
  '11111111-1111-4111-a111-111111111141', 'out', 2.00, 85.00, '11111111-1111-4111-a111-111111111191', 'POS Sale Deduct Milk', NOW() - INTERVAL '2 hours', NOW(), FALSE, 1
),

-- Dany Stock Transactions
(
  '22222222-2222-4222-a222-222222222305', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223',
  '22222222-2222-4222-a222-222222222253', 'in', 50.00, 520.00, 'PO-BIDCO-001', 'Initial Stock Intake Bidco Oil', NOW() - INTERVAL '4 days', NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222306', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223',
  '22222222-2222-4222-a222-222222222253', 'out', 1.00, 520.00, '22222222-2222-4222-a222-222222222301', 'POS Sale Deduct Sunflower Oil', NOW() - INTERVAL '1 hour', NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- SECTION 11: AUDIT LOGS
-- --------------------------------------------------------------------

INSERT INTO public.audit_logs (
  id, supermarket_id, branch_id, user_id, action, table_name, record_id, created_at, updated_at, deleted, version
) VALUES 
(
  '11111111-1111-4111-a111-111111111199', '11111111-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111112',
  '11111111-1111-4111-a111-111111111113', 'Tenant Created: Prince Supermarket', 'supermarkets', '11111111-1111-4111-a111-111111111111', NOW(), NOW(), FALSE, 1
),
(
  '22222222-2222-4222-a222-222222222309', '22222222-2222-4222-a222-222222222222', '22222222-2222-4222-a222-222222222223',
  '22222222-2222-4222-a222-222222222224', 'Tenant Created: Dany Supermarket', 'supermarkets', '22222222-2222-4222-a222-222222222222', NOW(), NOW(), FALSE, 1
)
ON CONFLICT (id) DO NOTHING;
