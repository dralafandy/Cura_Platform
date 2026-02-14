# Permission Fixes TODO List

## Summary of Issues Found:
1. Many components have NO permission checks at all
2. Some components have partial permission checks (DELETE works but ADD/EDIT don't)
3. The permission system exists but is not properly linked to UI buttons

## Files to Fix:

### 1. Scheduler.tsx (Appointments - المواعيد)
- [ ] Add permission import
- [ ] Add permission check for ADD appointment button
- [ ] Add permission check for EDIT appointment button  
- [ ] Add permission check for DELETE appointment button
- Permissions needed: APPOINTMENT_CREATE, APPOINTMENT_EDIT, APPOINTMENT_DELETE

### 2. SuppliersManagement.tsx (Suppliers - الموردين)
- [x] DELETE supplier - Already has permission check ✅
- [ ] ADD supplier button - Needs permission check (SUPPLIER_MANAGE)
- [ ] EDIT supplier button - Needs permission check (SUPPLIER_MANAGE)

### 3. PatientList.tsx (Patients - المرضى)
- [x] EDIT patient - Already has permission check ✅
- [x] DELETE patient - Already has permission check ✅
- [ ] ADD patient button - Needs permission check (PATIENT_CREATE)

### 4. Settings.tsx (Settings - الاعدادات)
- [ ] Check content and add appropriate permission checks (SETTINGS_VIEW, SETTINGS_EDIT)

### 5. DoctorList.tsx (Doctors - الموظفين)
- [ ] Check content and add permission checks (DOCTOR_VIEW, DOCTOR_CREATE, DOCTOR_EDIT, DOCTOR_DELETE)

### 6. InventoryManagement.tsx (Inventory - المخزون)
- [ ] Check content and add permission checks (INVENTORY_VIEW, INVENTORY_MANAGE)

### 7. ReportsPage.tsx (Reports - التقارير)
- [ ] Check content and add permission checks (REPORTS_VIEW, REPORTS_GENERATE)

### 8. Prescription Files (الروشتات)
- [ ] Check PrescriptionList.tsx and AddEditPrescriptionModal.tsx
- [ ] Add permission checks (PRESCRIPTION_VIEW, PRESCRIPTION_CREATE, PRESCRIPTION_EDIT, PRESCRIPTION_DELETE)

### 9. Finance Files (Invoices - الفواتير)
- [ ] Check finance components for permission checks
- [ ] Add FINANCE_INVOICES_MANAGE permission where needed

## Implementation Pattern:
```
tsx
import { Permission } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const { hasPermission } = useAuth();

// For ADD buttons:
{hasPermission(Permission.[FEATURE]_CREATE) && (
  <button>Add</button>
)}

// For EDIT buttons:
{hasPermission(Permission.[FEATURE]_EDIT) && (
  <button>Edit</button>
)}

// For DELETE buttons:
{hasPermission(Permission.[FEATURE]_DELETE) && (
  <button>Delete</button>
)}
```

## Status:
- Started: [Date]
- Completed:
