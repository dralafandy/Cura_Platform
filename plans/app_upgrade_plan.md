# CuraSoft App Upgrade Plan

## Executive Summary

This document outlines a comprehensive plan for upgrading the CuraSoft Dental Clinic Management System. The app is currently functional but has several areas that would benefit from systematic upgrades to improve maintainability, performance, user experience, and extensibility.

---

## Current State Analysis

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4.1.18 + Custom CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: React Hooks + Context API
- **i18n**: Custom translation system (English + Arabic)
- **Build Tool**: Vite 7.3.0

### Architecture Overview
```
CuraSoft/
├── components/
│   ├── finance/ (15+ finance components)
│   ├── patient/ (14+ patient components)
│   ├── reports/ (reports components)
│   └── Shared (Sidebar, Header, Dashboard, Scheduler, etc.)
├── contexts/ (Auth, Clinic, I18n, Notification, ReportsFilter)
├── hooks/ (useClinicData, useFinancialCalculations, useI18n, usePersistentState)
├── pages/ (LoginPage)
├── services/ (geminiService)
├── locales/ (en.ts, ar.ts - 1100+ translation keys)
├── types.ts (300+ lines of TypeScript interfaces)
└── utils/ (authUtils, print utilities)
```

### Key Findings
1. **useClinicData hook** is 2057 lines - needs refactoring into smaller hooks
2. **Monolithic data fetching** - single hook fetches all data on mount
3. **No component library** - inconsistent UI across modules
4. **Large translation file** - 1172 lines, could be modularized
5. **Multiple modals** - scattered modal components in patient folder
6. **Reports system** - existing plan but not implemented

---

## Upgrade Phases

### Phase 1: Core Infrastructure Refactoring

#### 1.1 Split useClinicData Hook
**Current Issue**: Single 2057-line hook managing all data operations
**Solution**: Break into domain-specific hooks

```
hooks/
├── useClinicData.ts (keep for compatibility - delegates to domain hooks)
├── usePatients.ts (patient CRUD + relationships)
├── useAppointments.ts (appointment management)
├── useTreatments.ts (treatment records + payments)
├── useFinance.ts (expenses, invoices, doctor payments)
├── useInventory.ts (inventory + lab cases)
├── usePrescriptions.ts (prescriptions + items)
├── useSuppliers.ts (supplier management)
└── useAttachments.ts (patient + supplier invoice attachments)
```

**Deliverables**:
- [ ] Create `usePatients.ts` hook
- [ ] Create `useAppointments.ts` hook
- [ ] Create `useTreatments.ts` hook
- [ ] Create `useFinance.ts` hook
- [ ] Create `useInventory.ts` hook
- [ ] Create `usePrescriptions.ts` hook
- [ ] Create `useSuppliers.ts` hook
- [ ] Create `useAttachments.ts` hook
- [ ] Refactor `useClinicData.ts` to use domain hooks
- [ ] Update all components to use new hooks

#### 1.2 Modularize Translation Files
**Current Issue**: Single `locales/en.ts` with 1172 lines
**Solution**: Split by feature/module

```
locales/
├── en.ts (main export - aggregates all)
├── common.ts (shared strings - buttons, labels)
├── dashboard.ts
├── patients.ts
├── appointments.ts
├── finance.ts
├── inventory.ts
├── reports.ts
├── settings.ts
└── errors.ts
```

**Deliverables**:
- [ ] Create `locales/common.ts`
- [ ] Create `locales/dashboard.ts`
- [ ] Create `locales/patients.ts`
- [ ] Create `locales/appointments.ts`
- [ ] Create `locales/finance.ts`
- [ ] Create `locales/inventory.ts`
- [ ] Create `locales/reports.ts`
- [ ] Create `locales/settings.ts`
- [ ] Update `locales/en.ts` to aggregate all modules
- [ ] Update `locales/ar.ts` with corresponding modules
- [ ] Update i18n context to support modular loading

---

### Phase 2: Component Architecture Improvements

#### 2.1 Create Shared Component Library
**Current Issue**: No shared UI component library
**Solution**: Build reusable component primitives

```
components/ui/
├── Button/
│   ├── Button.tsx
│   ├── Button.stories.tsx
│   └── Button.test.tsx
├── Modal/
│   ├── Modal.tsx
│   ├── Modal.stories.tsx
│   └── Modal.test.tsx
├── Card/
│   ├── Card.tsx
│   ├── Card.stories.tsx
│   └── Card.test.tsx
├── Input/
│   ├── Input.tsx
│   ├── Input.stories.tsx
│   └── Input.test.tsx
├── Select/
│   ├── Select.tsx
│   ├── Select.stories.tsx
│   └── Select.test.tsx
├── Table/
│   ├── Table.tsx
│   ├── Table.stories.tsx
│   └── Table.test.tsx
├── Badge/
│   ├── Badge.tsx
│   └── Badge.stories.tsx
├── Alert/
│   ├── Alert.tsx
│   └── Alert.stories.tsx
├── Loading/
│   ├── Spinner.tsx
│   ├── Skeleton.tsx
│   └── LoadingOverlay.tsx
├── Dropdown/
│   ├── Dropdown.tsx
│   └── DropdownMenu.tsx
├── Tabs/
│   ├── Tabs.tsx
│   └── TabPanel.tsx
├── Pagination/
│   └── Pagination.tsx
└── Toast/
    ├── Toast.tsx
    └── ToastContainer.tsx
```

**Deliverables**:
- [ ] Create Button component with variants
- [ ] Create Modal component with portal
- [ ] Create Card component
- [ ] Create Input component
- [ ] Create Select component
- [ ] Create Table component with sorting/filtering
- [ ] Create Badge component
- [ ] Create Alert component
- [ ] Create Loading components (Spinner, Skeleton)
- [ ] Create Dropdown components
- [ ] Create Tabs component
- [ ] Create Pagination component
- [ ] Create Toast component
- [ ] Add Storybook stories
- [ ] Add unit tests

#### 2.2 Refactor Patient Components
**Current Issue**: Scattered modal components in patient folder

```
components/patient/
├── PatientList/
│   ├── PatientList.tsx
│   ├── PatientListItem.tsx
│   └── PatientFilters.tsx
├── PatientDetails/
│   ├── PatientDetailsPanel.tsx
│   └── PatientTabs/
│       ├── PatientDetailsTab.tsx
│       ├── PatientDentalChartTab.tsx
│       ├── PatientTreatmentsTab.tsx
│       ├── PatientPrescriptionsTab.tsx
│       ├── PatientFinancialsTab.tsx
│       └── PatientAttachmentsTab.tsx
├── PatientModals/
│   ├── AddEditPatientModal.tsx
│   ├── PatientDetailsModal.tsx
│   └── TabbedPatientModal.tsx
└── PatientForms/
    ├── AddTreatmentRecordModal.tsx
    ├── AddPaymentModal.tsx
    ├── AddDiscountModal.tsx
    ├── AddPrescriptionModal.tsx
    └── PatientAttachments.tsx
```

**Deliverables**:
- [ ] Refactor PatientList.tsx with PatientListItem
- [ ] Create PatientFilters.tsx
- [ ] Refactor PatientDetailsPanel.tsx
- [ ] Modularize patient tabs
- [ ] Consolidate patient modals
- [ ] Consolidate patient forms
- [ ] Apply DESIGN_SYSTEM.md standards

#### 2.3 Refactor Finance Components
**Current Issue**: 15+ finance components need organization

```
components/finance/
├── FinancialDashboard/
│   └── FinancialSummary.tsx
├── Accounts/
│   ├── FinancialAccounts.tsx
│   ├── AccountDetailsPage.tsx
│   └── AccountSelectionPage.tsx
├── Suppliers/
│   ├── SuppliersManagement.tsx
│   ├── SupplierDetails.tsx
│   └── SupplierStatement.tsx
├── Expenses/
│   ├── ExpensesManagement.tsx
│   └── ExpensesTab.tsx
├── Invoices/
    ├── InvoiceList.tsx
    └── InvoiceDetails.tsx
├── DoctorAccounts/
│   ├── DoctorAccountsManagement.tsx
│   ├── AddDoctorPaymentModal.tsx
│   └── DoctorReports.tsx
├── Inventory/
│   ├── InventoryManagement.tsx
│   └── InventoryReport.tsx
├── LabCases/
│   ├── LabCaseManagement.tsx
│   ├── LabStatement.tsx
│   └── LabCaseReport.tsx
└── Shared/
    ├── FinancialCharts.tsx
    ├── FinancialFilters.tsx
    ├── FinancialTable.tsx
    ├── AccountDetailsTab.tsx
    └── BalancesTab.tsx
```

**Deliverables**:
- [ ] Organize finance components into folders
- [ ] Create shared finance components
- [ ] Apply consistent styling
- [ ] Add proper TypeScript types

---

### Phase 3: Performance Optimization

#### 3.1 Implement Data Fetching Optimizations
**Current Issue**: All data fetched on app mount
**Solution**: Lazy loading + caching

```
hooks/
├── useQuery.ts (custom query hook with caching)
├── useMutation.ts (custom mutation hook)
└── useInfiniteQuery.ts (for paginated data)

utils/
└── queryClient.ts (React Query setup - optional)
```

**Deliverables**:
- [ ] Implement useQuery hook with caching
- [ ] Add stale-time configuration
- [ ] Implement optimistic updates
- [ ] Add background refetching
- [ ] Implement pagination for large lists

#### 3.2 Component Lazy Loading
**Current Issue**: All components loaded at once
**Solution**: Code splitting by route/view

```typescript
// Lazy load heavy components
const PatientDetailsPanel = lazy(() => import('./components/patient/PatientDetails/PatientDetailsPanel'));
const ReportsPage = lazy(() => import('./components/reports/ReportsPage'));
const FinancialAccounts = lazy(() => import('./components/finance/Accounts/FinancialAccounts'));
```

**Deliverables**:
- [ ] Identify heavy components for lazy loading
- [ ] Implement React.lazy for heavy components
- [ ] Add Suspense boundaries
- [ ] Add loading skeletons

#### 3.3 Optimize useClinicData
**Current Issue**: 2000+ lines, single responsibility violation
**Solution**: Already planned in Phase 1.1

---

### Phase 4: Reports System Implementation

#### 4.1 Execute comprehensive_reports_plan.md
**Reference**: `plans/comprehensive_reports_plan.md`

**Implementation Steps**:
1. Set up reports folder structure
2. Create shared report components
3. Implement patient reports
4. Implement finance reports
5. Implement scheduler reports
6. Implement inventory reports
7. Add export functionality (PDF, Excel, CSV)

**Deliverables**:
- [ ] Create ReportsDashboard.tsx
- [ ] Create shared report components (DateRangeSelector, FilterPanel, etc.)
- [ ] Implement patient reports
- [ ] Implement finance reports
- [ ] Implement scheduler reports
- [ ] Implement inventory reports
- [ ] Add export functionality
- [ ] Add real-time updates

---

### Phase 5: User Experience Improvements

#### 5.1 Implement Patient Card Redesign
**Reference**: `plans/patient_card_redesign.md`

**Deliverables**:
- [ ] Create new PatientCard component
- [ ] Add patient image support
- [ ] Implement modern design
- [ ] Add responsive layout
- [ ] Test with various data scenarios

#### 5.2 Improve Scheduler UI
**Reference**: `plans/mobile_scheduler_redesign.md`

**Deliverables**:
- [ ] Redesign scheduler component
- [ ] Add drag-and-drop appointments
- [ ] Improve mobile experience
- [ ] Add appointment templates

#### 5.3 Enhance Dashboard
**Reference**: `plans/header_redesign_plan.md`

**Deliverables**:
- [ ] Implement header redesign
- [ ] Improve dashboard KPIs
- [ ] Add quick actions
- [ ] Enhance mobile navigation

---

### Phase 6: Testing & Quality Assurance

#### 6.1 Unit Testing Setup
**Deliverables**:
- [ ] Configure Jest/Testing Library
- [ ] Create test utilities
- [ ] Write tests for hooks
- [ ] Write tests for components
- [ ] Achieve 70% coverage

#### 6.2 Integration Testing
**Deliverables**:
- [ ] Configure Cypress/E2E tests
- [ ] Write user journey tests
- [ ] Test critical workflows

#### 6.3 Accessibility Testing
**Deliverables**:
- [ ] Add axe-core for accessibility
- [ ] Fix WCAG violations
- [ ] Add ARIA labels
- [ ] Test keyboard navigation

---

## Prioritized Upgrade Order

### Priority 1: Critical Infrastructure
1. Split useClinicData hook (Phase 1.1)
2. Create shared component library (Phase 2.1)
3. Implement data fetching optimizations (Phase 3.1)

### Priority 2: User Experience
4. Implement Patient Card redesign (Phase 5.1)
5. Refactor Patient components (Phase 2.2)
6. Improve Scheduler UI (Phase 5.2)

### Priority 3: Feature Expansion
7. Execute reports plan (Phase 4.1)
8. Refactor Finance components (Phase 2.3)
9. Modularize translations (Phase 1.2)

### Priority 4: Quality Assurance
10. Add unit tests (Phase 6.1)
11. Add integration tests (Phase 6.2)
12. Accessibility improvements (Phase 6.3)

---

## Technical Approach by Area

### Hook Refactoring Strategy
```typescript
// Example: New usePatients hook pattern
export const usePatients = () => {
  const queryClient = useQueryClient();
  const { supabase, user } = useAuth();
  const { addNotification } = useNotification();
  
  const queryKey = ['patients'];
  
  const { data: patients, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Patient[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const addPatient = useMutation({
    mutationFn: async (patient: NewPatient) => {
      // Implementation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  
  return { patients, isLoading, addPatient /* ... */ };
};
```

### Component Library Pattern
```typescript
// Example: Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-cyan-500 text-white hover:bg-cyan-600 focus:ring-cyan-500',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Data Fetching Pattern
```typescript
// Implement useQuery hook pattern
export const useQuery = ({ queryKey, queryFn, options = {} }) => {
  // Implement caching, stale-time, refetching
  // Return data, isLoading, error, refetch, etc.
};
```

---

## Migration Strategy

### Backward Compatibility
1. Keep `useClinicData.ts` as main export
2. Gradually migrate components to new hooks
3. Maintain API compatibility where possible
4. Test each migration step

### Incremental Changes
1. Create new files alongside existing
2. Update one component at a time
3. Run tests after each change
4. Deploy to staging before production

### Rollback Plan
1. Git branches for each phase
2. Feature flags for new components
3. Easy revert via version control

---

## Success Metrics

### Code Quality
- Reduce useClinicData from 2057 lines to ~300 lines
- Achieve 70% unit test coverage
- Eliminate all TypeScript warnings

### Performance
- Initial load time < 2 seconds
- Data fetch response < 500ms
- Component render < 100ms

### User Experience
- Reduce user complaints by 50%
- Improve task completion rate by 25%
- Achieve 90% user satisfaction

---

## Timeline Estimates

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Infrastructure | 2-3 weeks | Split hooks, modular translations |
| Phase 2: Components | 3-4 weeks | UI library, refactored components |
| Phase 3: Performance | 2 weeks | Optimized data fetching, lazy loading |
| Phase 4: Reports | 4-6 weeks | Full reports system implementation |
| Phase 5: UX | 2-3 weeks | Patient card, scheduler, dashboard |
| Phase 6: Testing | 2 weeks | Unit tests, integration tests |

**Total Estimated Time**: 15-20 weeks

---

## Next Steps

1. **Review and approve** this plan
2. **Start with Phase 1.1**: Split useClinicData hook
3. **Create new hooks** one by one
4. **Update components** incrementally
5. **Test thoroughly** after each change
6. **Deploy to staging** for validation
7. **Roll out to production** in phases

---

*Last Updated: 2026-01-30*
*Version: 1.0*
