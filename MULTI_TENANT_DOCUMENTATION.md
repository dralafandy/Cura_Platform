# دليل تحويل نظام كيواسوفت إلى نظام متعدد المستأجرين (SaaS)

## نظرة عامة

تم تطوير النظام ليصبح جاهزاً لبيعه لعدة عيادات مختلفة مع دعم الفترة التجريبية المجانية 14 يوم.

---

## 1. ملفات قاعدة البيانات الجديدة

### الملف: `multi_tenant_migration.sql`

هذا الملف يحتوي على جميع التغييرات المطلوبة في قاعدة البيانات:

#### الجداول الجديدة:
- **tenants**: جدول المستأجرين/العيادات
- **subscription_plans**: جدول خطط الاشتراك
- **tenant_invitations**: جدول دعوات للانضمام للعيادة

#### الحقول المضافة:
- `tenant_id` لجميع جداول البيانات
- `is_owner`, `is_primary` لجدول المستخدمين

#### الوظائف (Functions):
- `subscription.is_trial_valid()` - التحقق من صلاحية الفترة التجريبية
- `subscription.get_trial_days_remaining()` - أيام التجربة المتبقية
- `subscription.check_limits()` - التحقق من حدود الاستخدام
- `subscription.create_tenant_with_trial()` - إنشاء عيادة جديدة مع تجربة
- `subscription.activate_subscription()` - تفعيل الاشتراك المدفوع

---

## 2. ملفات الكود الجديدة

### `auth/tenantService.ts`
خدمة كاملة لإدارة المستأجرين والاشتراكات:
- إنشاء عيادة جديدة
- جلب معلومات الاشتراك
- التحقق من حدود الاستخدام
- تفعيل الاشتراكات

### `components/RegisterClinic.tsx`
صفحة تسجيل عيادة جديدة مع:
- إدخال بيانات العيادة
- توليد رابط مخصص
- إنشاء حساب المالك
- تفعيل الفترة التجريبية 14 يوم تلقائياً

### `components/SubscriptionStatus.tsx`
مكون عرض حالة الاشتراك:
- عرض أيام التجربة المتبقية
- إحصائيات الاستخدام (المستخدمين والمرضى)
- زر الترقية للخطة المدفوعة

---

## 3. خطوات التفعيل

### الخطوة 1: تشغيل Migration
```sql
-- في Supabase SQL Editor
-- 1. تأكد من تشغيل complete_database_schema.sql أولاً
-- 2. ثم شغل multi_tenant_migration.sql
```

### الخطوة 2: ترحيل البيانات القديمة
```sql
SELECT migration.create_default_tenant_for_existing_data();
```

### الخطوة 3: تحديث الواجهة الأمامية
أضف الملفات الجديدة:
- `auth/tenantService.ts`
- `components/RegisterClinic.tsx`
- `components/SubscriptionStatus.tsx`

---

## 4. كيفية الاستخدام

### تسجيل عيادة جديدة (العميل)
1. اذهب لـ `/register` أو `/signup`
2. أدخل اسم العيادة والرابط المخصص
3. أدخل البريد الإلكتروني وكلمة المرور
4. اضغط "إنشاء مجاناً"
5. يتم إنشاء عيادة مع فترة تجريبية 14 يوم

### التحقق من حالة الاشتراك
```typescript
import { tenantService } from './auth/tenantService';

// التحقق من صلاحية التجربة
const isValid = await tenantService.isTrialValid(tenantId);

// جلب أيام التجربة المتبقية
const daysLeft = await tenantService.getTrialDaysRemaining(tenantId);

// التحقق من الحدود
const limits = await tenantService.checkLimits(tenantId, 'users');
```

### عرض مكون حالة الاشتراك
```typescript
import SubscriptionStatus from './components/SubscriptionStatus';

<SubscriptionStatus tenantId={user.tenant_id} />
```

---

## 5. خطط الاشتراك

| الخطة | السعر | المستخدمين | المرضى |
|-------|-------|------------|--------|
| تجريبي | مجاني | 2 | 100 |
| أساسي | 299 جم/شهر | 3 | 500 |
| احترافي | 499 جم/شهر | 10 | 2000 |
| مؤسسات | 999 جم/شهر | غير محدود | غير محدود |

---

## 6. حدود الاستخدام

النظام يتحقق تلقائياً من:
- عدد المستخدمين المسموح
- عدد المرضى المسموح

عند الوصول للحد الأقصى:
- يظهر إشعار للعميل
- يمكنه الترقية للخطة الأعلى

---

## 7. Row Level Security (RLS)

تم تفعيل RLS على جميع الجداول بحيث:
- كل عيادة ترى بياناتها فقط
- لا يمكن للعميل A رؤية بيانات العميل B
- يتم التصفية تلقائياً عبر `tenant_id`

---

## 8. مشاكل شائعة وحلولها

### المشكلة: المستخدم لا يستطيع تسجيل الدخول
**الحل**: تأكد من ربط المستخدم بالمستأجر
```sql
UPDATE users SET tenant_id = 'tenant-uuid' WHERE id = 'user-uuid';
```

### المشكلة: لا يمكنني رؤية أي بيانات
**الحل**: تأكد من وجود tenant_id في الجداول
```sql
SELECT * FROM patients WHERE tenant_id = 'your-tenant-id';
```

### المشكلة: التجربة انتهت ولا أستطيع إنشاء بيانات
**الحل**: قم بالترقية للخطة المدفوعة من لوحة التحكم

---

## 9. التحديثات المستقبلية المطلوبة

1. **دفع إلكتروني**: ربط Stripe للدفع
2. **نطاقات مخصصة**: دعم custom domains
3. **White Label**: تخصيص العلامة التجارية
4. **API Access**: واجهة برمجة التطبيقات

---

## 10. الدعم

للأسئلة أو المشاكل:
- البريد الإلكتروني: support@curasoft.app
- الهاتف: +20 100 000 0000

---

**تاريخ الإنشاء**: 2026-02-26
**الإصدار**: 1.0.0
