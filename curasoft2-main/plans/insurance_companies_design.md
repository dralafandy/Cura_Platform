# تصميم نظام شركات التأمين

## المتطلبات
- إضافة صفحة جديدة لشركات التأمين مع حسابات مستقلة عن النظام الحالي.
- ربط شركات التأمين بالبيانات الحالية مثل الأطباء والمرضى وجلسات العلاج.
- ربطها في النهاية بحسابات العيادة (مدائن و مدين).

## تحليل قاعدة البيانات الحالية
- قاعدة البيانات الحالية تحتوي على جداول مثل:
  - `patients`: تحتوي على معلومات المرضى بما في ذلك مزود التأمين (`insurance_provider`).
  - `treatment_records`: سجلات العلاج المرتبطة بالمرضى والأطباء.
  - `payments`: المدفوعات المرتبطة بالمرضى وسجلات العلاج.
  - `doctor_payments`: مدفوعات الأطباء.

## تصميم جداول البيانات الجديدة

### 1. جدول شركات التأمين (`insurance_companies`)
```sql
CREATE TABLE insurance_companies (
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
```

### 2. جدول حسابات شركات التأمين (`insurance_accounts`)
```sql
CREATE TABLE insurance_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insurance_company_id UUID REFERENCES insurance_companies(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_number TEXT,
    balance NUMERIC(15,2) DEFAULT 0,
    status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. جدول المعاملات مع شركات التأمين (`insurance_transactions`)
```sql
CREATE TABLE insurance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insurance_account_id UUID REFERENCES insurance_accounts(id) ON DELETE CASCADE,
    transaction_type TEXT CHECK (transaction_type IN ('CREDIT', 'DEBIT')),
    amount NUMERIC(15,2) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    related_entity_type TEXT CHECK (related_entity_type IN ('PATIENT', 'TREATMENT', 'DOCTOR', 'CLINIC')),
    related_entity_id UUID,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. جدول ربط المرضى بشركات التأمين (`patient_insurance_link`)
```sql
CREATE TABLE patient_insurance_link (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    insurance_company_id UUID REFERENCES insurance_companies(id) ON DELETE CASCADE,
    policy_number TEXT,
    coverage_percentage NUMERIC(5,2) DEFAULT 100,
    effective_date DATE,
    expiry_date DATE,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. جدول ربط جلسات العلاج بشركات التأمين (`treatment_insurance_link`)
```sql
CREATE TABLE treatment_insurance_link (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_record_id UUID REFERENCES treatment_records(id) ON DELETE CASCADE,
    insurance_company_id UUID REFERENCES insurance_companies(id) ON DELETE CASCADE,
    claim_amount NUMERIC(15,2) DEFAULT 0,
    claim_status TEXT CHECK (claim_status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
    claim_date DATE,
    payment_date DATE,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## إنشاء الفهارس
```sql
CREATE INDEX IF NOT EXISTS idx_insurance_companies_user_id ON insurance_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_insurance_company_id ON insurance_accounts(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_user_id ON insurance_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_insurance_account_id ON insurance_transactions(insurance_account_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_user_id ON insurance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_patient_id ON patient_insurance_link(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_insurance_company_id ON patient_insurance_link(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_treatment_record_id ON treatment_insurance_link(treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_insurance_company_id ON treatment_insurance_link(insurance_company_id);
```

## صفحات واجهة المستخدم

### 1. صفحة إدارة شركات التأمين (`InsuranceCompaniesPage.tsx`)
- عرض قائمة بشركات التأمين.
- إضافة وتعديل وحذف شركات التأمين.
- عرض تفاصيل شركة التأمين.

### 2. صفحة حسابات شركات التأمين (`InsuranceAccountsPage.tsx`)
- عرض قائمة بحسابات شركات التأمين.
- إضافة وتعديل وحذف حسابات.
- عرض تفاصيل الحساب.

### 3. صفحة المعاملات (`InsuranceTransactionsPage.tsx`)
- عرض قائمة بالمعاملات.
- إضافة وتعديل وحذف معاملات.
- عرض تفاصيل المعاملة.

### 4. صفحة ربط المرضى (`PatientInsuranceLinkPage.tsx`)
- عرض قائمة بربط المرضى بشركات التأمين.
- إضافة وتعديل وحذف الروابط.
- عرض تفاصيل الربط.

### 5. صفحة ربط العلاج (`TreatmentInsuranceLinkPage.tsx`)
- عرض قائمة بربط جلسات العلاج بشركات التأمين.
- إضافة وتعديل وحذف الروابط.
- عرض تفاصيل الربط.

## الربط مع النظام الحالي
- ربط المعاملات مع حسابات العيادة (مدائن و مدين).
- ربط المعاملات مع المرضى والأطباء وجلسات العلاج.
- التأكد من عدم تغيير قاعدة البيانات الحالية.

## اختبار النظام
- اختبار إضافة وتعديل وحذف شركات التأمين.
- اختبار إضافة وتعديل وحذف حسابات.
- اختبار إضافة وتعديل وحذف المعاملات.
- اختبار ربط المرضى والعلاج بشركات التأمين.
- اختبار الربط مع حسابات العيادة.