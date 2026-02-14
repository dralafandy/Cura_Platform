# خطة إصلاح الوضع الداكن وتوحيد التصميم

## المرحلة 1: إصلاح تداخل الأيقونات في حقول الإدخال (RTL)

### الملفات المستهدفة:
- [ ] `components/patient/AddEditPatientModal.tsx`
- [ ] `components/patient/AddPaymentModal.tsx`
- [ ] `components/patient/AddTreatmentRecordModal.tsx`
- [ ] `components/patient/AddEditPrescriptionModal.tsx`
- [ ] `components/finance/ExpensesManagement.tsx`
- [ ] `components/finance/CreatePurchaseOrderModal.tsx`
- [ ] `components/Scheduler.tsx`

### التغييرات المطلوبة:
- تغيير `pl-12` إلى `pr-12` للحقول التي تحتوي على أيقونات (RTL)
- تغيير `left-3` إلى `right-3` لموضع الأيقونات
- تغيير `pl-10` إلى `pr-10` للـ textarea مع أيقونات

## المرحلة 2: مراجعة وإصلاح الوضع الداكن في جميع النماذج

### الملفات المستهدفة:
- [ ] `components/patient/AddEditPatientModal.tsx`
- [ ] `components/patient/AddPaymentModal.tsx`
- [ ] `components/patient/AddTreatmentRecordModal.tsx`
- [ ] `components/patient/AddEditPrescriptionModal.tsx`
- [ ] `components/patient/EditPaymentModal.tsx`
- [ ] `components/patient/PatientDetailsModal.tsx`
- [ ] `components/patient/TabbedPatientModal.tsx`
- [ ] `components/finance/ExpensesManagement.tsx`
- [ ] `components/finance/CreatePurchaseOrderModal.tsx`
- [ ] `components/finance/LowStockPurchaseOrderModal.tsx`
- [ ] `components/finance/SuppliersManagement.tsx`
- [ ] `components/finance/InventoryManagement.tsx`
- [ ] `components/finance/LabCaseManagement.tsx`
- [ ] `components/finance/DoctorAccountsManagement.tsx`
- [ ] `components/Settings.tsx`
- [ ] `components/UserManagement.tsx`
- [ ] `components/Scheduler.tsx`

### التغييرات المطلوبة:
- إضافة `dark:bg-slate-800` للخلفيات
- إضافة `dark:text-slate-200` للنصوص
- إضافة `dark:border-slate-700` للحدود
- إضافة `dark:placeholder:text-slate-500` للـ placeholders

## المرحلة 3: توحيد التصميم عبر جميع الصفحات

### التغييرات المطلوبة:
- [ ] توحيد نظام الألوان (استخدام CSS variables)
- [ ] توحيد border radius (rounded-2xl للبطاقات)
- [ ] توحيد الظلال
- [ ] توحيد أزرار الحفظ والإلغاء

## المرحلة 4: إنشاء مكونات مشتركة موحدة

### الملفات الجديدة:
- [ ] `components/common/FormInput.tsx`
- [ ] `components/common/FormModal.tsx`
- [ ] `components/common/FormTextarea.tsx`

## الملاحظات:
- الواجهة RTL (عربية) لذا يجب مراعاة ذلك في padding
- استخدام `isDark` من `useTheme()` للتحقق من الوضع الداكن
- التأكد من جميع المودالات تستخدم نفس النمط

