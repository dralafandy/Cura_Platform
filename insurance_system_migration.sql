-- ============================================
-- نظام التأمينات الموحد - migration add-on
-- تاريخ الإنشاء: 2026-02-23
-- ============================================
-- هذا الملف يضيف جداول التأمينات الجديدة بدون المساس بالبيانات الحالية
-- يجب تشغيل هذا الملف بعد الجداول الأساسية

-- 1. إنشاء جدول شركات التأمين
CREATE TABLE IF NOT EXISTS insurance_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    contact_person TEXT,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة فهرس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_insurance_companies_user_id ON insurance_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_name ON insurance_companies(name);

-- 2. إنشاء جدول حسابات التأمين
CREATE TABLE IF NOT EXISTS insurance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insurance_company_id UUID REFERENCES insurance_companies(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_number TEXT,
    balance DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_accounts_company ON insurance_accounts(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_user ON insurance_accounts(user_id);

-- 3. إنشاء جدول معاملات التأمين
CREATE TABLE IF NOT EXISTS insurance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insurance_account_id UUID REFERENCES insurance_accounts(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('CREDIT', 'DEBIT')),
    amount DECIMAL(15,2) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    reference_number TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_transactions_account ON insurance_transactions(insurance_account_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_date ON insurance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_user ON insurance_transactions(user_id);

-- 4. إنشاء جدول ربط المرضى بالتأمين
CREATE TABLE IF NOT EXISTS patient_insurance_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    insurance_company_id UUID REFERENCES insurance_companies(id) ON DELETE CASCADE,
    policy_number TEXT,
    coverage_percentage DECIMAL(5,2) DEFAULT 100,
    effective_date DATE,
    expiry_date DATE,
    notes TEXT,
    is_primary BOOLEAN DEFAULT true,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, insurance_company_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient ON patient_insurance_link(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_company ON patient_insurance_link(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_user ON patient_insurance_link(user_id);

-- 5. إنشاء جدول ربط العلاج بالتأمين (المطالبات)
CREATE TABLE IF NOT EXISTS treatment_insurance_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_record_id UUID NOT NULL,
    insurance_company_id UUID REFERENCES insurance_companies(id) ON DELETE CASCADE,
    claim_amount DECIMAL(15,2) NOT NULL,
    claim_status TEXT DEFAULT 'PENDING' CHECK (claim_status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
    claim_date DATE,
    payment_date DATE,
    rejection_reason TEXT,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatment_insurance_treatment ON treatment_insurance_link(treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_company ON treatment_insurance_link(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_status ON treatment_insurance_link(claim_status);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_user ON treatment_insurance_link(user_id);

-- ============================================
-- سياسات Row Level Security (RLS)
-- ============================================

-- تفعيل RLS على جميع جداول التأمين
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_insurance_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_insurance_link ENABLE ROW LEVEL SECURITY;

-- سياسات شركات التأمين
DROP POLICY IF EXISTS "insurance_companies_user_policy" ON insurance_companies;
CREATE POLICY "insurance_companies_user_policy" ON insurance_companies
    FOR ALL USING (user_id = auth.uid());

-- سياسات حسابات التأمين
DROP POLICY IF EXISTS "insurance_accounts_user_policy" ON insurance_accounts;
CREATE POLICY "insurance_accounts_user_policy" ON insurance_accounts
    FOR ALL USING (user_id = auth.uid());

-- سياسات معاملات التأمين
DROP POLICY IF EXISTS "insurance_transactions_user_policy" ON insurance_transactions;
CREATE POLICY "insurance_transactions_user_policy" ON insurance_transactions
    FOR ALL USING (user_id = auth.uid());

-- سياسات ربط المرضى
DROP POLICY IF EXISTS "patient_insurance_link_user_policy" ON patient_insurance_link;
CREATE POLICY "patient_insurance_link_user_policy" ON patient_insurance_link
    FOR ALL USING (user_id = auth.uid());

-- سياسات ربط العلاج
DROP POLICY IF EXISTS "treatment_insurance_link_user_policy" ON treatment_insurance_link;
CREATE POLICY "treatment_insurance_link_user_policy" ON treatment_insurance_link
    FOR ALL USING (user_id = auth.uid());

-- ============================================
--Migrazione dei dati esistenti من البيانات الموجودة
-- ============================================

-- ملاحظة: إذا كانت هناك بيانات في جدول patients تحتوي على insuranceProvider
-- يمكن تهجيرها إلى جدول insurance_companies ثم ربطها
-- هذا خيار اختياري - يمكن تنفيذه لاحقاً عند الحاجة

-- ============================================
-- التحقق من إنشاء الجداول
-- ============================================

SELECT 
    'insurance_companies' AS table_name,
    COUNT(*) AS exists_count
FROM information_schema.tables 
WHERE table_name = 'insurance_companies'
UNION ALL
SELECT 
    'insurance_accounts',
    COUNT(*)
FROM information_schema.tables 
WHERE table_name = 'insurance_accounts'
UNION ALL
SELECT 
    'insurance_transactions',
    COUNT(*)
FROM information_schema.tables 
WHERE table_name = 'insurance_transactions'
UNION ALL
SELECT 
    'patient_insurance_link',
    COUNT(*)
FROM information_schema.tables 
WHERE table_name = 'patient_insurance_link'
UNION ALL
SELECT 
    'treatment_insurance_link',
    COUNT(*)
FROM information_schema.tables 
WHERE table_name = 'treatment_insurance_link';

-- ============================================
-- ملاحظات:
-- 1. تم إنشاء جميع الجداول بدون المساس بالبيانات الموجودة
-- 2. تم تفعيل RLS وتأمين البيانات
-- 3. يمكن现在开始 استخدام نظام التأمينات
-- ============================================
