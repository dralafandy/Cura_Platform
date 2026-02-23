-- Insurance module migration
-- Safe to run on existing databases.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS insurance_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insurance_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_number TEXT,
    balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')) NOT NULL DEFAULT 'ACTIVE',
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_insurance_account_name_per_company UNIQUE (insurance_company_id, account_name, user_id)
);

CREATE TABLE IF NOT EXISTS insurance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insurance_account_id UUID NOT NULL REFERENCES insurance_accounts(id) ON DELETE CASCADE,
    transaction_type TEXT CHECK (transaction_type IN ('CREDIT', 'DEBIT')) NOT NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    transaction_date DATE NOT NULL,
    description TEXT,
    related_entity_type TEXT CHECK (related_entity_type IN ('PATIENT', 'TREATMENT', 'DOCTOR', 'CLINIC')),
    related_entity_id UUID,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_insurance_transaction_amount_non_negative CHECK (amount >= 0)
);

CREATE TABLE IF NOT EXISTS patient_insurance_link (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
    policy_number TEXT,
    coverage_percentage NUMERIC(5,2) NOT NULL DEFAULT 100,
    effective_date DATE,
    expiry_date DATE,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_patient_insurance_coverage_percentage CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    CONSTRAINT chk_patient_insurance_dates CHECK (expiry_date IS NULL OR effective_date IS NULL OR expiry_date >= effective_date)
);

CREATE TABLE IF NOT EXISTS treatment_insurance_link (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_record_id UUID NOT NULL REFERENCES treatment_records(id) ON DELETE CASCADE,
    insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
    claim_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    claim_status TEXT CHECK (claim_status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')) NOT NULL DEFAULT 'PENDING',
    claim_date DATE,
    payment_date DATE,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_treatment_insurance_claim_amount CHECK (claim_amount >= 0),
    CONSTRAINT chk_treatment_insurance_payment_date CHECK (payment_date IS NULL OR claim_date IS NULL OR payment_date >= claim_date)
);

CREATE INDEX IF NOT EXISTS idx_insurance_companies_user_id ON insurance_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_company_id ON insurance_accounts(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_user_id ON insurance_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_account_id ON insurance_transactions(insurance_account_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_user_id ON insurance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_date ON insurance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_patient_id ON patient_insurance_link(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_company_id ON patient_insurance_link(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_user_id ON patient_insurance_link(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_treatment_record_id ON treatment_insurance_link(treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_company_id ON treatment_insurance_link(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_status ON treatment_insurance_link(claim_status);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_user_id ON treatment_insurance_link(user_id);
