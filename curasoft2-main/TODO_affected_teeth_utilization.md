# Affected Teeth Feature Utilization Plan

## Current State Analysis

The `affected_teeth` field exists in:
- Database schema: `treatment_records` table as `TEXT[] DEFAULT '{}'`
- AddTreatmentRecordModal.tsx - Allows multi-select of teeth
- PatientDetailsPanel.tsx - Auto-updates dental chart based on treatment type

## Issues Identified

1. **Treatment Record List** (TreatmentRecordList.tsx)
   - Does NOT display affected teeth
   - Only shows treatment name, date, dentist, and costs

2. **Patient Invoice** (PatientInvoice.tsx)
   - Does NOT show affected teeth in the treatment table

3. **Patient Full Report** (PatientFullReport.tsx)
   - Does NOT show affected teeth in the treatment table

4. **Dental Chart Treatment History**
   - The `treatmentHistory` prop is passed but not populated from treatment records
   - No link between treatment records and dental chart history

## Plan

### 1. Update TreatmentRecordList.tsx
- [ ] Display affected teeth for each treatment record
- [ ] Show as chips/badges with tooth IDs
- [ ] Add translation keys for "Affected Teeth" label

### 2. Update PatientInvoice.tsx
- [ ] Add affected teeth column to treatment table
- [ ] Show tooth IDs for each treatment

### 3. Update PatientFullReport.tsx
- [ ] Add affected teeth column to treatment table
- [ ] Show tooth IDs for each treatment

### 4. Connect Dental Chart to Treatment Records
- [ ] Build treatmentHistory object from patient treatment records
- [ ] Pass to DentalChart component

### 5. Update translations
- [ ] Add Arabic translation for "Affected Teeth" in reports
- [ ] Add proper formatting for multiple teeth display
