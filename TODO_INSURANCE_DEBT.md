# Insurance Debt Management - Implementation Plan

## Task Summary
When adding payments for insured patients:
1. Patient's portion → Added directly as payment
2. Insurance portion → Recorded as debt on patient (receivable from insurance company)
3. Insurance claim automatically created (PENDING status)

When changing claim status to PAID:
1. The remaining amount (insurance portion) gets paid
2. Recorded as revenue
3. Patient's debt is cleared

## Steps to Implement

### Step 1: Create Database Migration
- [ ] Create new table `patient_insurance_debts` to track debts
- [ ] Add columns: patient_id, treatment_record_id, insurance_company_id, claim_id, original_amount, remaining_amount, status, created_at, updated_at

### Step 2: Update AddPaymentModal.tsx
- [ ] Modify payment logic to split patient and insurance portions
- [ ] Create debt record for insurance portion
- [ ] Create insurance claim with PENDING status

### Step 3: Update InsuranceManagementPage.tsx
- [ ] Add functionality to handle claim status change to PAID
- [ ] Add payment entry for insurance portion as revenue
- [ ] Clear patient debt when claim is paid

### Step 4: Add Types
- [ ] Add PatientInsuranceDebt type to types.ts

## Files to Modify
1. `migrations/045_patient_insurance_debts.sql` - New file
2. `types.ts` - Add new type
3. `components/patient/AddPaymentModal.tsx` - Update payment logic
4. `components/finance/InsuranceManagementPage.tsx` - Add claim settlement

