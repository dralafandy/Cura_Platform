# Design Document: Edit/Delete Functionality for Patient Financial Transactions

## Overview
This design document outlines the implementation of edit and delete functionality for patient payment transactions in the financials tab of `PatientDetailsPanel.tsx`. The design reuses existing components and hooks where possible, ensuring consistency with the current codebase.

## Current Structure Analysis
- **Financials Tab**: Located in `PatientDetailsPanel.tsx` (lines 347-430)
- **Payment Display**: Payments are rendered as list items with green border-left (lines 397-408)
- **Existing Modals**: `AddPaymentModal` handles payment creation
- **Data Hooks**: `updatePayment` and `deletePayment` available in `useClinicData.ts`
- **Payment Interface**: Defined in `types.ts` with fields: id, patientId, date, amount, method, notes, treatmentRecordId, clinicShare, doctorShare

## UI Placement of Edit/Delete Buttons
- **Location**: Icons placed at the end of each payment transaction div, aligned to the right
- **Icons**: 
  - Edit: Pencil icon (existing `EditIcon` component)
  - Delete: Trash icon (new `TrashIcon` component needed)
- **Layout**: Flexbox with `justify-between` for payment details and action buttons
- **Styling**: Small, subtle icons with hover effects matching existing design system

## EditPaymentModal Component
### Reuse Strategy
- **Base Component**: Extend `AddPaymentModal` to create `EditPaymentModal`
- **Props**: Add `payment` prop for pre-filling data, change `onAdd` to `onUpdate`
- **Pre-fill Logic**: Populate form fields with existing payment data on mount

### Component Structure
```typescript
interface EditPaymentModalProps {
  patientId: string;
  payment: Payment;
  clinicData: ClinicData;
  onClose: () => void;
  onUpdate: (payment: Payment) => void;
}
```

### Key Features
- **Form Fields**: date, amount, method, notes, treatmentRecordId (read-only for edit)
- **Validation**: Amount > 0, prevent exceeding outstanding balance
- **Share Recalculation**: 
  - On amount change, recalculate clinicShare and doctorShare based on treatment definition percentages
  - Update doctor payments if shares change (reverse previous doctor payment, create new one)
- **Submit Handler**: Call `clinicData.updatePayment(payment)` and refresh UI

## Delete Functionality
### Confirmation Dialog
- **Component**: New `DeletePaymentConfirmationModal`
- **Props**: payment, onConfirm, onCancel
- **Warning Message**: Display impact on patient balance and clinic/doctor shares
- **i18n Keys**: 
  - `paymentDelete.confirmTitle`
  - `paymentDelete.confirmMessage`
  - `paymentDelete.balanceImpact`
  - `paymentDelete.shareImpact`

### Logic
- **Validation**: Check for dependencies (e.g., linked to closed financial periods)
- **Deletion**: Call `clinicData.deletePayment(payment.id)`
- **Side Effects**: 
  - Reverse doctor payment if exists
  - Update patient balance calculations
  - Refresh financial summary

## Data Flow
### Update Flow
1. User clicks edit icon → Open `EditPaymentModal` with pre-filled data
2. User modifies fields → Validate and recalculate shares
3. On submit → Call `updatePayment(payment)` → Update database → Refresh local state → Close modal → Show success notification

### Delete Flow
1. User clicks delete icon → Open confirmation dialog
2. User confirms → Call `deletePayment(payment.id)` → Delete from database → Refresh local state → Close dialog → Show success notification

## Edge Cases and Validation
### Prevent Editing/Deleting
- **Closed Periods**: Check if payment date falls within a closed accounting period
- **Dependencies**: Prevent deletion if payment is referenced by financial reports or has dependent transactions
- **User Permissions**: Check user role for edit/delete permissions (future enhancement)
- **Outstanding Balance**: Prevent payment amount exceeding current outstanding balance

### Validation Rules
- Amount must be positive number
- Date cannot be in the future
- Treatment record must exist and belong to patient
- Payment method must be valid enum value

## Localization (i18n)
### New Keys Required
```json
{
  "paymentEdit.title": "Edit Payment",
  "paymentEdit.saveChanges": "Save Changes",
  "paymentDelete.confirmTitle": "Delete Payment",
  "paymentDelete.confirmMessage": "Are you sure you want to delete this payment?",
  "paymentDelete.balanceImpact": "This will affect the patient's outstanding balance by {amount}.",
  "paymentDelete.shareImpact": "Doctor share of {doctorShare} will be reversed.",
  "paymentEdit.amountChanged": "Amount changed - shares recalculated",
  "common.delete": "Delete",
  "common.edit": "Edit"
}
```

### Implementation
- Use existing `useI18n` hook
- Add keys to both `ar.json` and `en.ts` locale files
- Support RTL layout for Arabic

## Component Integration
### PatientDetailsPanel Updates
- **State Management**: Add state for edit modal open/close and selected payment
- **Event Handlers**: 
  - `handleEditPayment(payment)` → Open edit modal
  - `handleDeletePayment(payment)` → Open delete confirmation
- **UI Updates**: Add action buttons to payment list items

### Modal Management
- **Import Statements**: Add imports for new modals
- **Conditional Rendering**: Render modals based on state
- **Props Passing**: Pass required props to modal components

## Technical Considerations
### Performance
- **Re-renders**: Use `useCallback` for event handlers to prevent unnecessary re-renders
- **State Updates**: Batch state updates where possible

### Error Handling
- **API Errors**: Display user-friendly error messages via notifications
- **Validation Errors**: Inline validation with specific error messages
- **Rollback**: No automatic rollback - rely on user confirmation for destructive actions

### Testing Considerations
- **Unit Tests**: Test share recalculation logic
- **Integration Tests**: Test full edit/delete flows
- **UI Tests**: Verify modal interactions and form validation

## Implementation Steps
1. Create `EditPaymentModal` component
2. Create `DeletePaymentConfirmationModal` component
3. Update `PatientDetailsPanel` to include action buttons
4. Add i18n keys to locale files
5. Implement event handlers and state management
6. Add validation and edge case handling
7. Test integration and fix any issues

## Future Enhancements
- Bulk edit/delete operations
- Payment history/audit trail
- Integration with accounting software
- Advanced permission controls