-- Supabase DB Migration: 20260801_production_schema.sql
-- 3NF Normalized Production Schema with Foreign Keys, Unique Indexes, RLS Policies & Performance Tuning

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Re-apply full schema definitions
\i supabase/schema.sql
