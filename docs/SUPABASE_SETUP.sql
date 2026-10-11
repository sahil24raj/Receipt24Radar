-- ============================================================================
-- RECEIPT RADAR: COMPLETE SUPABASE SQL SCHEMA SETUP & RLS CONFIGURATION
-- Paste this entire script into your Supabase SQL Editor and click 'Run'.
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enumerated Custom Types
DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM (
        'Electronics',
        'Food & Dining',
        'Groceries',
        'Travel & Commute',
        'Utilities & Telecom',
        'Healthcare & Wellness',
        'Entertainment',
        'Office & Business',
        'Shopping & Apparel'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'UPI',
        'Credit Card',
        'Debit Card',
        'Net Banking',
        'Cash'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE receipt_status AS ENUM (
        'VERIFIED',
        'NEEDS_REVIEW',
        'DUPLICATE_FLAGGED',
        'PROCESSING'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE warranty_status AS ENUM (
        'ACTIVE',
        'EXPIRING_SOON',
        'EXPIRED',
        'NO_WARRANTY'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE return_status AS ENUM (
        'ELIGIBLE',
        'EXPIRING_SOON',
        'EXPIRED',
        'NOT_RETURNABLE'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. PROFILES TABLE (Linked with Supabase Auth: auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    avatar_url TEXT,
    currency VARCHAR(10) DEFAULT 'INR',
    monthly_budget NUMERIC(14, 2) DEFAULT 80000.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatically create user profile when user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. RECEIPTS TABLE (Master Receipt Vault)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_name VARCHAR(200) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    tax_amount NUMERIC(14, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    category expense_category NOT NULL,
    payment_method payment_method NOT NULL,
    card_last_4 CHAR(4),
    status receipt_status DEFAULT 'VERIFIED',
    
    -- Warranty & Return
    has_warranty BOOLEAN DEFAULT FALSE,
    warranty_expiry_date DATE,
    warranty_status warranty_status DEFAULT 'NO_WARRANTY',
    warranty_duration_months INT DEFAULT 0,
    has_return_window BOOLEAN DEFAULT FALSE,
    return_deadline DATE,
    return_status return_status DEFAULT 'NOT_RETURNABLE',
    
    -- Object Storage & Checksum
    storage_arn TEXT DEFAULT 'supabase-storage',
    storage_key TEXT NOT NULL,
    file_url TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    file_mime_type VARCHAR(100) DEFAULT 'image/jpeg',
    sha256_hash CHAR(64) NOT NULL,
    is_client_encrypted BOOLEAN DEFAULT TRUE,
    
    -- Telemetry
    ocr_confidence_score NUMERIC(5, 2) DEFAULT 95.0,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    is_duplicate_flagged BOOLEAN DEFAULT FALSE,
    duplicate_of_receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. RECEIPT LINE ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.receipt_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 1.00,
    unit_price NUMERIC(14, 2) NOT NULL,
    total_price NUMERIC(14, 2) NOT NULL,
    category_override VARCHAR(100),
    warranty_months INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. BUDGETS & CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year CHAR(7) NOT NULL, -- Format: YYYY-MM
    total_budget NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

CREATE TABLE IF NOT EXISTS public.budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    category expense_category NOT NULL,
    allocated_amount NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(budget_id, category)
);

-- ============================================================================
-- 7. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_purchase_date ON public.receipts(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_sha256 ON public.receipts(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_receipts_warranty ON public.receipts(has_warranty, warranty_expiry_date) 
    WHERE has_warranty = TRUE;
CREATE INDEX IF NOT EXISTS idx_line_items_receipt_id ON public.receipt_line_items(receipt_id);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read & update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Receipts: Full access strictly for the owner
CREATE POLICY "Users can view own receipts" ON public.receipts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts" ON public.receipts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts" ON public.receipts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts" ON public.receipts
    FOR DELETE USING (auth.uid() = user_id);

-- Line Items: Child access verified through parent receipt ownership
CREATE POLICY "Users can manage own line items" ON public.receipt_line_items
    FOR ALL USING (
        receipt_id IN (SELECT id FROM public.receipts WHERE user_id = auth.uid())
    );

-- Budgets: Full access strictly for the owner
CREATE POLICY "Users can manage own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own budget categories" ON public.budget_categories
    FOR ALL USING (
        budget_id IN (SELECT id FROM public.budgets WHERE user_id = auth.uid())
    );

-- ============================================================================
-- 9. STORAGE BUCKET FOR RECEIPT VAULT (Optional 1-Click Storage Config)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts-vault', 'receipts-vault', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload receipt images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'receipts-vault' AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view receipt images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'receipts-vault'
    );
