# Antigravity Supermarket POS - Cloud Web Edition v2.0

An enterprise-grade, 100% cloud-first Point of Sale (POS) & Supermarket Management System built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, **shadcn/ui**, **TanStack React Query v5**, **Redux Toolkit**, and **Supabase PostgreSQL**. Hosted natively on **Vercel**.

---

## 🌟 Key Features

- **100% Cloud-First Architecture**: Every CRUD action operates directly against **Supabase PostgreSQL** in real-time.
- **High-Speed POS Register**: Fast product search, keyboard barcode scanner event listeners (`F1`–`F5` shortcuts), category tabs, item/global discounts, tax (VAT 16%), held carts, and split payment selectors.
- **Multi-Gateway Payment Integration**: Cash, Card, M-Pesa STK Push prompt simulation, and Customer Store Accounts (Debtors balance).
- **Debtors Ledger & Borrow Limits**: Customer store accounts with strict borrowing limit enforcement (`borrow_limit`), preventing credit sales when thresholds are exceeded.
- **Inventory & Reorder Point Alerts**: Product catalog, barcode/SKU creation, stock adjustments, purchase orders, and low-stock restock warnings.
- **Operational Expense Tracker**: Log store operational bills, category breakdowns, and daily expense summaries.
- **Financial Reports & CSV Export**: Real-time sales revenue, expense totals, net profit calculations, and one-click CSV report downloads.
- **Role-Based Access Control (RBAC)**: Cashier shift lock overlay (`TerminalLockModal.tsx`) with fast 4–6 digit numeric PIN authentication.
- **Thermal Receipt Printing**: Browser print engine (`printService.ts`, `ReceiptModal.tsx`) formatted for standard 80mm thermal receipt printers.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies Used |
| :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** + **React 19** |
| **Styling & UI** | **Tailwind CSS** + **shadcn/ui** + **Lucide Icons** |
| **State & Caching** | **Redux Toolkit** (POS cart & shift lock state) + **TanStack React Query v5** (Server query caching) |
| **Backend & Auth** | **Supabase Auth** + **Supabase PostgreSQL** (`@supabase/ssr`, `@supabase/supabase-js`) |
| **Deployment** | Native deployment on **Vercel** |

---

## 📁 Project Structure

```
├── app/
│   ├── (auth)/login/page.tsx        # Supabase Auth Login
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx    # Executive Metrics & Revenue Charts
│   │   ├── pos/page.tsx          # Register Checkout Screen
│   │   ├── inventory/page.tsx    # Product & Reorder Alerts
│   │   ├── customers/page.tsx    # Debtors Ledger & Credit Limits
│   │   ├── reports/page.tsx      # Financial Summaries & CSV Export
│   │   ├── expenses/page.tsx     # Operational Expense Logger
│   │   ├── suppliers/page.tsx    # Supplier Directory
│   │   ├── employees/page.tsx    # Staff & RBAC Accounts
│   │   └── settings/page.tsx     # Store Profile & Tax Rules
│   ├── globals.css               # Tailwind directives & Thermal @media print styles
│   └── layout.tsx                # App Root Layout with Providers
├── components/
│   ├── auth/TerminalLockModal.tsx# Shift PIN Lock Overlay
│   ├── layout/                   # Sidebar & Navbar Components
│   ├── pos/                      # CartPanel, PaymentModal, ReceiptModal
│   ├── ui/                       # Button, Card, Dialog, Input, Badge
│   └── providers.tsx             # Redux & QueryClient Providers
├── lib/
│   ├── supabase/client.ts        # Supabase Browser Client
│   └── utils.ts                  # Currency & Date Formatters, Tailwind Merger
├── services/                     # Direct Supabase PostgreSQL Services
│   ├── productService.ts
│   ├── saleService.ts
│   ├── customerService.ts
│   ├── inventoryService.ts
│   ├── expenseService.ts
│   ├── supplierService.ts
│   ├── employeeService.ts
│   ├── mpesaService.ts
│   └── printService.ts
├── store/                        # Redux Toolkit Store
│   ├── cartSlice.ts
│   ├── authSlice.ts
│   └── index.ts
├── types/                        # Domain Models
│   └── index.ts
└── supabase/
    └── schema.sql                # Supabase PostgreSQL Database Schema
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- A Supabase Project

### 2. Environment Setup
Create a `.env.local` file in the root folder:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-api-key
```

### 3. Database Migration
Run the SQL schema in `supabase/schema.sql` inside your Supabase SQL Editor.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Building for Production & Vercel Deployment

Deploy directly to **Vercel** or compile locally:
```bash
npm run build
npm start
```
