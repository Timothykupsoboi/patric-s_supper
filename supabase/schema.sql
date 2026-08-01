-- Copied directly from my-supabase-migration/supabase/migrations/schema.txt (Single Source of Truth)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "public";
ALTER SCHEMA "public" OWNER TO "pg_database_owner";
COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE OR REPLACE FUNCTION "public"."create_supermarket_with_admin"("p_supermarket_id" "uuid", "p_name" character varying, "p_phone" character varying, "p_email" character varying, "p_address" "text", "p_subscription_plan" character varying, "p_trial_ends_at" timestamp with time zone, "p_admin_id" "uuid", "p_admin_name" character varying, "p_admin_email" character varying, "p_admin_password" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_encrypted_password TEXT;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = p_admin_email) INTO v_user_exists;
  
  IF v_user_exists THEN
    RAISE EXCEPTION 'A user with email % already exists.', p_admin_email;
  END IF;

  INSERT INTO public.supermarkets (
    id, name, phone, email, address, subscription_plan, subscription_status, trial_ends_at, created_at, updated_at
  ) VALUES (
    p_supermarket_id, p_name, p_phone, p_email, p_address, p_subscription_plan, 'trial', p_trial_ends_at, NOW(), NOW()
  );

  v_encrypted_password := crypt(p_admin_password, gen_salt('bf', 10));

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, 
    recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', p_admin_id, 'authenticated', 'authenticated', 
    p_admin_email, v_encrypted_password, NOW(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('name', p_admin_name),
    NOW(), NOW(), '', '', '', ''
  );

  INSERT INTO public.users (
    id, supermarket_id, branch_id, name, email, role, is_active, created_at, updated_at
  ) VALUES (
    p_admin_id, p_supermarket_id, NULL, p_admin_name, p_admin_email, 'super_admin', TRUE, NOW(), NOW()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'supermarket_id', p_supermarket_id,
    'admin_id', p_admin_id
  );
END;
$$;

ALTER FUNCTION "public"."create_supermarket_with_admin"("p_supermarket_id" "uuid", "p_name" character varying, "p_phone" character varying, "p_email" character varying, "p_address" "text", "p_subscription_plan" character varying, "p_trial_ends_at" timestamp with time zone, "p_admin_id" "uuid", "p_admin_name" character varying, "p_admin_email" character varying, "p_admin_password" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_auth_branch"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (SELECT branch_id FROM users WHERE id = auth.uid() AND deleted = FALSE);
END;
$$;

ALTER FUNCTION "public"."get_auth_branch"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_auth_role"() RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = auth.uid() AND deleted = FALSE);
END;
$$;

ALTER FUNCTION "public"."get_auth_role"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_auth_supermarket"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (SELECT supermarket_id FROM users WHERE id = auth.uid() AND deleted = FALSE);
END;
$$;

ALTER FUNCTION "public"."get_auth_supermarket"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."reconcile_inventory_on_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.type IN ('in', 'adjustment_add', 'transfer_in') THEN
        UPDATE products
        SET current_stock = current_stock + NEW.quantity,
            updated_at = NOW(),
            version = version + 1
        WHERE id = NEW.product_id;
    ELSIF NEW.type IN ('out', 'adjustment_sub', 'transfer_out', 'damaged', 'expired') THEN
        UPDATE products
        SET current_stock = current_stock - NEW.quantity,
            updated_at = NOW(),
            version = version + 1
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."reconcile_inventory_on_transaction"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_customer_credit_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.type = 'charge' THEN
        UPDATE customers
        SET balance = balance + NEW.amount,
            updated_at = NOW(),
            version = version + 1
        WHERE id = NEW.customer_id;
    ELSIF NEW.type = 'payment' THEN
        UPDATE customers
        SET balance = balance - NEW.amount,
            updated_at = NOW(),
            version = version + 1
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_customer_credit_balance"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';
SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" character varying(255) NOT NULL,
    "table_name" character varying(100),
    "record_id" character varying(100),
    "old_values" "jsonb",
    "new_values" "jsonb",
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid"
);
ALTER TABLE "public"."audit_logs" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid"
);
ALTER TABLE "public"."branches" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid"
);
ALTER TABLE "public"."categories" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."customer_credits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "type" character varying(20) NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "description" "text",
    "due_date" "date",
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid",
    CONSTRAINT "customer_credits_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['charge'::character varying, 'payment'::character varying])::"text"[])))
);
ALTER TABLE "public"."customer_credits" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "phone" character varying(50),
    "email" character varying(255),
    "national_id" character varying(50),
    "credit_limit" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "balance" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "loyalty_points" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "birthday" "date",
    "photo_url" "text",
    "group_name" character varying(100),
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid"
);
ALTER TABLE "public"."customers" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category" character varying(50) NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "description" "text",
    "date" "date" NOT NULL,
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid",
    CONSTRAINT "expenses_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['rent'::character varying, 'electricity'::character varying, 'water'::character varying, 'transport'::character varying, 'salary'::character varying, 'maintenance'::character varying, 'internet'::character varying, 'other'::character varying])::"text"[])))
);
ALTER TABLE "public"."expenses" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "sku" character varying(100),
    "barcode" character varying(100),
    "qr_code" character varying(255),
    "unit" character varying(50) NOT NULL,
    "buying_price" numeric(15,2) NOT NULL,
    "selling_price" numeric(15,2) NOT NULL,
    "wholesale_price" numeric(15,2),
    "minimum_price" numeric(15,2),
    "current_stock" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "minimum_stock" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "maximum_stock" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "supplier_id" "uuid",
    "image_url" "text",
    "description" "text",
    "expiry_date" "date",
    "tax_rate" numeric(5,2) DEFAULT 0.00 NOT NULL,
    "discount_rate" numeric(5,2) DEFAULT 0.00 NOT NULL,
    "location" character varying(255),
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid"
);
ALTER TABLE "public"."products" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."purchase_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "cost_price" numeric(15,2) NOT NULL,
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid"
);
ALTER TABLE "public"."purchase_items" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "total_amount" numeric(15,2) NOT NULL,
    "status" character varying(50) NOT NULL,
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid",
    CONSTRAINT "purchases_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['ordered'::character varying, 'received'::character varying, 'returned'::character varying])::"text"[])))
);
ALTER TABLE "public"."purchases" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."sale_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sale_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "subtotal" numeric(15,2) NOT NULL,
    "discount" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "tax" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid"
);
ALTER TABLE "public"."sale_items" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cashier_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "total_amount" numeric(15,2) NOT NULL,
    "discount_amount" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "tax_amount" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "payment_status" character varying(50) NOT NULL,
    "payment_method" character varying(50) NOT NULL,
    "notes" "text",
    "hold_status" character varying(50) DEFAULT 'active'::character varying NOT NULL,
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid",
    CONSTRAINT "sales_hold_status_check" CHECK ((("hold_status")::"text" = ANY ((ARRAY['active'::character varying, 'held'::character varying, 'voided'::character varying, 'refunded'::character varying])::"text"[]))),
    CONSTRAINT "sales_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['cash'::character varying, 'mpesa'::character varying, 'card'::character varying, 'credit'::character varying, 'split'::character varying])::"text"[]))),
    CONSTRAINT "sales_payment_status_check" CHECK ((("payment_status")::"text" = ANY ((ARRAY['paid'::character varying, 'unpaid'::character varying, 'partial'::character varying])::"text"[])))
);
ALTER TABLE "public"."sales" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."stock_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "quantity" numeric(15,2) NOT NULL,
    "unit_cost" numeric(15,2) NOT NULL,
    "reference_id" character varying(100),
    "notes" "text",
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid",
    CONSTRAINT "stock_transactions_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['in'::character varying, 'out'::character varying, 'adjustment_add'::character varying, 'adjustment_sub'::character varying, 'transfer_in'::character varying, 'transfer_out'::character varying, 'damaged'::character varying, 'expired'::character varying])::"text"[])))
);
ALTER TABLE "public"."stock_transactions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."supermarkets" (
    "id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "phone" character varying(50),
    "email" character varying(255),
    "address" "text",
    "logo_url" "text",
    "subscription_plan" character varying(50) DEFAULT 'free_trial'::character varying NOT NULL,
    "subscription_status" character varying(50) DEFAULT 'trial'::character varying NOT NULL,
    "trial_ends_at" timestamp with time zone,
    "subscription_ends_at" timestamp with time zone,
    "license_key" character varying(100),
    "max_branches" integer DEFAULT 1 NOT NULL,
    "max_users" integer DEFAULT 5 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL
);
ALTER TABLE "public"."supermarkets" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "contact_person" character varying(255),
    "phone" character varying(50),
    "email" character varying(255),
    "outstanding_balance" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid"
);
ALTER TABLE "public"."suppliers" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255),
    "role" character varying(50) NOT NULL,
    "phone" character varying(50),
    "pin" character varying(6),
    "branch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "supermarket_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['platform_owner'::character varying, 'super_admin'::character varying, 'admin'::character varying, 'owner'::character varying, 'manager'::character varying, 'cashier'::character varying, 'store_keeper'::character varying, 'accountant'::character varying])::"text"[])))
);
ALTER TABLE "public"."users" OWNER TO "postgres";

ALTER TABLE ONLY "public"."audit_logs" ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."branches" ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."customer_credits" ADD CONSTRAINT "customer_credits_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."customers" ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."expenses" ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."products" ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");
ALTER TABLE ONLY "public"."purchase_items" ADD CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."purchases" ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."sale_items" ADD CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."sales" ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."stock_transactions" ADD CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."supermarkets" ADD CONSTRAINT "supermarkets_license_key_key" UNIQUE ("license_key");
ALTER TABLE ONLY "public"."supermarkets" ADD CONSTRAINT "supermarkets_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."suppliers" ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
