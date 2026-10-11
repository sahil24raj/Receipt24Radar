/**
 * Production-ready PostgreSQL Relational Schema DDL & Architecture
 * Receipt Radar — Secure Smart Receipt Management and Expense Intelligence Platform
 */

export const POSTGRES_SCHEMA_SQL = `-- ============================================================================
-- RECEIPT RADAR: PRODUCTION RELATIONAL DATABASE SCHEMA (PostgreSQL 16+)
-- Compliant with PCI-DSS storage requirements & India DPDP (Data Protection) Act
-- ============================================================================

-- 1. Enable Cryptographic & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enumerated Types
CREATE TYPE user_role AS ENUM ('user', 'business_owner', 'auditor', 'admin');
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
CREATE TYPE payment_method AS ENUM ('UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash');
CREATE TYPE receipt_status AS ENUM ('VERIFIED', 'NEEDS_REVIEW', 'DUPLICATE_FLAGGED', 'PROCESSING');
CREATE TYPE warranty_status AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'NO_WARRANTY');
CREATE TYPE return_status AS ENUM ('ELIGIBLE', 'EXPIRING_SOON', 'EXPIRED', 'NOT_RETURNABLE');

-- 3. Users Table (Argon2 / bcrypt password hash + JWT claims)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    currency VARCHAR(10) DEFAULT 'INR',
    monthly_budget NUMERIC(14, 2) DEFAULT 80000.00,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret_enc TEXT,
    kms_key_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Receipts Master Table (Private S3 ARN + SHA-256 Digest)
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    
    -- Warranty & Return tracking
    has_warranty BOOLEAN DEFAULT FALSE,
    warranty_expiry_date DATE,
    warranty_status warranty_status DEFAULT 'NO_WARRANTY',
    warranty_duration_months INT,
    
    has_return_window BOOLEAN DEFAULT FALSE,
    return_deadline DATE,
    return_status return_status DEFAULT 'NOT_RETURNABLE',
    
    -- Object Storage & Tamper-Evident Security
    s3_storage_arn TEXT NOT NULL,
    s3_storage_key TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_mime_type VARCHAR(100) NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    is_client_encrypted BOOLEAN DEFAULT TRUE,
    
    -- OCR Telemetry & Notes
    ocr_confidence_score NUMERIC(5, 2),
    notes TEXT,
    tags TEXT[],
    is_duplicate_flagged BOOLEAN DEFAULT FALSE,
    duplicate_of_receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Receipt Line Items Table
CREATE TABLE receipt_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 1.00,
    unit_price NUMERIC(14, 2) NOT NULL,
    total_price NUMERIC(14, 2) NOT NULL,
    category_override VARCHAR(100),
    warranty_months INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Budgets Table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_year CHAR(7) NOT NULL, -- Format: YYYY-MM
    total_budget NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- 7. Budget Category Allocations
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category expense_category NOT NULL,
    allocated_amount NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Log & Tamper Verification
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'OCR_EXTRACT', 'HASH_VERIFY', 'WARRANTY_ALERT'
    ip_address INET,
    user_agent TEXT,
    payload_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_purchase_date ON receipts(purchase_date DESC);
CREATE INDEX idx_receipts_category ON receipts(category);
CREATE INDEX idx_receipts_merchant ON receipts(merchant_name);
CREATE INDEX idx_receipts_sha256 ON receipts(sha256_hash);
CREATE INDEX idx_receipts_warranty ON receipts(has_warranty, warranty_expiry_date) WHERE has_warranty = TRUE;
CREATE INDEX idx_receipts_return ON receipts(has_return_window, return_deadline) WHERE has_return_window = TRUE;
CREATE INDEX idx_line_items_receipt_id ON receipt_line_items(receipt_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY receipts_isolation_policy ON receipts
    FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY line_items_isolation_policy ON receipt_line_items
    FOR ALL
    USING (receipt_id IN (SELECT id FROM receipts WHERE user_id = auth.uid()));
`;
