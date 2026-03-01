# نظام التأمينات الموحد - دليل التكامل

## نظرة عامة

تم تطوير نظام التأمينات الموحد لربط جميع أجزاء البرنامج بشكل متكامل. يشمل هذا النظام:

1. **إدارة شركات التأمين** - إضافة وتعديل وحذف شركات التأمين
2. **إدارة حسابات التأمين** - إنشاء حسابات لكل شركة تأمين
1. **المعاملات المالية** - تسجيل الإيداعات والسحوبات
1. **تغطية المرضى** - ربط المرضى بشركات التأمين
1. **مطالبات العلاج** - إنشاء ومتابعة مطالبات التأمين
1. **التقارير والمطبوعات** - تقارير شاملة للطباعة

## التكامل مع صفحة إضافة مريض جديد

### في `AddEditPatientModal.tsx`

عند إضافة مريض جديد، تم إضافة قسم التأمين الذي يتيح:

1. **اختيار شركة التأمين**: قائمة منسدلة من شركات التأمين المسجلة في النظام
1. **إدخال رقم البوليصة**: حقل لإدخال رقم بوليصة التأمين
1. **تحديد نسبة التغطية**: نسبة مئوية لتغطية التأمين (افتراضي 100%)
1. **الحفظ التلقائي**: عند حفظ المريض، يتم إنشاء سجل في جدول `patient_insurance_link`

```tsx
// تحميل شركات التأمين
useEffect(() => {
    const loadInsuranceCompanies = async () => {
        const { data } = await supabase
            .from('insurance_companies')
            .select('id, name')
            .order('name');
        setInsuranceCompanies(data || []);
    };
    void loadInsuranceCompanies();
}, [user?.id]);

// حفظ رابط التأمين عند حفظ المريض
const handleSubmit = async (e: React.FormEvent) => {
    // ... حفظ المريض
    await onSave(formData);
    
    // إنشاء رابط التأمين
    if (selectedInsuranceId && patient?.id) {
        await supabase
            .from('patient_insurance_link')
            .upsert({
                patient_id: patient.id,
                insurance_company_id: selectedInsuranceId,
                coverage_percentage: coveragePercentage,
                policy_number: policyNumber,
                user_id: user.id
            });
    }
};
```

## التكامل مع صفحة الدفعات

### في `AddPaymentModal.tsx`

عند إضافة دفعة جديدة، يتم:

1. **التحقق من وجود تأمين للمريض**: جلب بيانات رابط التأمين
1. **عرض خيار استخدام التأمين**: checkbox لتفعيل التأمين
1. **حساب مبالغ التغطية**: حساب تلقائي بناءً على نسبة التغطية
1. **إنشاء مطالبة تأمين**: عند التفعيل، يتم إنشاء مطالبة تلقائياً

```tsx
// تحميل بيانات تأمين المريض
const [patientInsurance, setPatientInsurance] = useState(null);

useEffect(() => {
    const loadPatientInsurance = async () => {
        const { data } = await supabase
            .from('patient_insurance_link')
            .select('insurance_company_id, coverage_percentage, policy_number, insurance_companies(name)')
            .eq('patient_id', patientId)
            .single();
        
        if (data) {
            setPatientInsurance({
                insurance_company_id: data.insurance_company_id,
                insurance_company_name: data.insurance_companies?.name,
                coverage_percentage: data.coverage_percentage,
                policy_number: data.policy_number
            });
        }
    };
    void loadPatientInsurance();
}, [patientId, user?.id]);

// حساب مبالغ التغطية
const insuranceCoverageAmount = useInsurance && patientInsurance 
    ? (formData.amount * patientInsurance.coverage_percentage / 100)
    : 0;

const patientResponsibility = formData.amount - insuranceCoverageAmount;

// إنشاء مطالبة تأمين عند الدفع
if (useInsurance && patientInsurance && insuranceCoverageAmount > 0) {
    await supabase
        .from('treatment_insurance_link')
        .insert({
            treatment_record_id: formData.treatmentRecordId,
            insurance_company_id: patientInsurance.insurance_company_id,
            claim_amount: insuranceCoverageAmount,
            claim_status: 'PENDING',
            claim_date: formData.date,
            user_id: user.id
        });
}
```

## صفحة إدارة التأمينات الموحدة

### في `InsuranceManagementPage.tsx`

صفحة شاملة تحتوي على:

1. **شركات التأمين**: إدارة شركات التأمين
1. **الحسابات**: حسابات التأمين لكل شركة
1. **المعاملات**: سجل الإيداعات والسحوبات
1. **تغطية المرضى**: ربط المرضى بشركات التأمين
1. **مطالبات العلاج**: متابعة المطالبات
1. **التقارير**: تقارير متنوعة للطباعة

### الميزات الرئيسية

- واجهة مستخدم محسنة مع دعم الوضع الداكن
- إحصائيات فورية في أعلى الصفحة
- البحث والتصفية
- تقارير قابلة للطباعة
- حالة مرئية للمطالبات والحسابات

## التقارير والمطبوعات

### في `PrintableInsuranceReport.tsx`

أنواع التقارير المتاحة:

1. **ملخص التأمينات**: نظرة عامة على جميع البيانات
1. **المطالبات**: تقرير مفصل عن المطالبات
1. **المرضى المؤمن لهم**: قائمة بالمرضى وتغطياتهم
1. **المعاملات**: سجل المعاملات المالية
1. **كشف حساب**: كشف حساب مفصل لحساب معين

### استخدام التقارير

```tsx
// فتح نافذة التقرير
setShowReportModal(true);

// اختيار نوع التقرير
setReportType('claims'); // أو 'summary', 'patients', 'transactions', 'account-statement'

// تطبيق الفلاتر
setReportFilters({
    companyId: 'company-id',
    accountId: 'account-id',
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31'
});
```

## قاعدة البيانات

### الجداول المطلوبة

```sql
-- شركات التأمين
CREATE TABLE insurance_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- حسابات التأمين
CREATE TABLE insurance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insurance_company_id UUID REFERENCES insurance_companies(id),
    account_name TEXT NOT NULL,
    balance DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- معاملات التأمين
CREATE TABLE insurance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insurance_account_id UUID REFERENCES insurance_accounts(id),
    transaction_type TEXT NOT NULL, -- 'CREDIT' or 'DEBIT'
    amount DECIMAL NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    reference_number TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ربط المريض بالتأمين
CREATE TABLE patient_insurance_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    insurance_company_id UUID REFERENCES insurance_companies(id),
    policy_number TEXT,
    coverage_percentage DECIMAL DEFAULT 100,
    effective_date DATE,
    expiry_date DATE,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(patient_id, insurance_company_id)
);

-- ربط العلاج بالتأمين
CREATE TABLE treatment_insurance_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_record_id UUID REFERENCES treatment_records(id),
    insurance_company_id UUID REFERENCES insurance_companies(id),
    claim_amount DECIMAL NOT NULL,
    claim_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'PAID'
    claim_date DATE,
    payment_date DATE,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## سير العمل

### إضافة مريض جديد مع تأمين

1. افتح نافذة إضافة مريض
1. انتقل إلى تبويب "الطوارئ والتأمين"
1. اختر شركة التأمين من القائمة
1. أدخل رقم البوليصة ونسبة التغطية
1. احفظ المريض

### إضافة دفعة مع تأمين
1. افتح نافذة إضافة دفعة لمريض لديه تأمين
1. سيظهر قسم التأمين تلقائياً
1. فعّل خيار "استخدام التأمين"
1. سيتم حساب مبالغ التغطية تلقائياً
1. عند الحفظ، سيتم إنشاء مطالبة تأمين تلقائياً

### طباعة تقرير تأمين
1. افتح صفحة التأمينات الموحدة
1. انتقل إلى تبويب "التقارير"
1. اختر نوع التقرير
1. حدد الفلاتر (شركة، حساب، فترة زمنية)
1. اضغط "عرض وطباعة التقرير"

## ملاحظات تقنية

- جميع الجداول مرتبطة بجدول المستخدمين عبر حقل `user_id`
- يتم التحقق من الصلاحيات قبل إجراء أي عملية
- الواجهة تدعم الوضع الداكن بشكل كامل
- التقارير مصممة للطباعة على ورق A4
