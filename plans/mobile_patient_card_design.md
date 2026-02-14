# Mobile Patient Card Design Specification

## Overview
This document specifies the design for a new mobile-first patient card layout optimized for touch interactions and mobile screens. The design focuses on essential information display with expandable timeline functionality.

## Design Requirements
- **Mobile-first approach**: Optimized for screens 320px and up
- **Touch-friendly**: Minimum 44px touch targets
- **Single horizontal row layout**: Compact information display
- **Expandable timeline**: Show/hide additional patient events
- **Design system compliance**: Follows CuraSoft design system (Poppins typography, cyan primary, slate neutrals)

## Layout Structure

### Main Card Layout (Collapsed State)
```
┌─────────────────────────────────────────────────────────────┐
│ [Avatar] [Name & Balance]                    [Actions] [Expand] │
│          [Last Visit • Doctor]                                │
└─────────────────────────────────────────────────────────────┘
```

### Main Card Layout (Expanded State)
```
┌─────────────────────────────────────────────────────────────┐
│ [Avatar] [Name & Balance]                    [Actions] [Expand] │
│          [Last Visit • Doctor]                                │
│                                                             │
│ [Timeline Events]                                           │
│ • Event 1: Date                                             │
│ • Event 2: Date                                             │
│ • Event 3: Date                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
MobilePatientCard
├── PatientAvatar
│   ├── Image (if available)
│   └── InitialsFallback
├── PatientInfo
│   ├── PatientName
│   └── BalanceBadge
├── PatientDetails
│   ├── LastVisitInfo
│   └── DoctorInfo
├── ActionButtons
│   ├── DeleteButton
│   ├── WhatsAppButton
│   └── ExpandButton
└── TimelineSection (when expanded)
    ├── TimelineEvent (multiple)
    └── TimelineEvent
```

## Detailed Component Specifications

### 1. PatientAvatar
- **Size**: 48x48px (w-12 h-12)
- **Shape**: Circular (rounded-full)
- **Border**: 2px solid primary color (--color-primary)
- **Shadow**: --shadow-sm
- **Fallback**: Initials with background color based on patient ID
- **Position**: Leftmost in horizontal row

### 2. PatientInfo Section
- **Layout**: Vertical stack next to avatar
- **Spacing**: --spacing-sm (8px) gap between name and balance

#### PatientName
- **Typography**: 16px (1rem) bold, --color-text-primary
- **Font**: Poppins 600 weight
- **Truncation**: Ellipsis for long names
- **Max width**: Available space minus avatar and actions

#### BalanceBadge
- **Shape**: Rounded rectangle (--radius-md = 12px)
- **Size**: Minimum 44px height for touch
- **Colors**:
  - Red variant: Outstanding balance > 0
    - Background: Linear gradient red (#ef4444 to #dc2626)
    - Text: White
  - Green variant: Balance ≤ 0
    - Background: Linear gradient green (#10b981 to #059669)
    - Text: White
- **Typography**: 14px (0.875rem) medium weight
- **Content**: Formatted currency (EGP)
- **Padding**: --spacing-sm horizontal, --spacing-xs vertical

### 3. PatientDetails Section
- **Layout**: Horizontal row below name/balance
- **Typography**: 12px (0.75rem) regular, --color-text-secondary
- **Separator**: Bullet (•) between visit and doctor
- **Content**:
  - Last visit: Formatted date
  - Doctor: Doctor name (from last treatment or appointment)

### 4. ActionButtons Section
- **Layout**: Horizontal row, right-aligned
- **Spacing**: --spacing-xs (4px) between buttons

#### DeleteButton
- **Size**: 44x44px minimum
- **Shape**: Circular (rounded-full)
- **Colors**:
  - Background: Red (#ef4444)
  - Hover: Darker red (#dc2626)
- **Icon**: Delete/trash icon
- **Accessibility**: Proper ARIA label

#### WhatsAppButton
- **Size**: 44x44px minimum
- **Shape**: Circular (rounded-full)
- **Colors**:
  - Background: Green (#10b981)
  - Hover: Darker green (#059669)
- **Icon**: WhatsApp icon
- **Accessibility**: Proper ARIA label

#### ExpandButton
- **Size**: 44x44px minimum
- **Shape**: Circular (rounded-full)
- **Colors**:
  - Background: --color-bg-secondary (#f1f5f9)
  - Hover: --color-bg-tertiary
- **Icon**: Chevron down/up with rotation animation
- **State**: Indicates expanded/collapsed

### 5. TimelineSection (Expanded)
- **Layout**: Vertical list below main content
- **Animation**: Smooth expand/collapse (300ms ease)
- **Spacing**: --spacing-sm between events

#### TimelineEvent
- **Layout**: Horizontal row with dot and text
- **Dot**: 8x8px circle with event-specific color
- **Text**: 14px regular, --color-text-primary
- **Colors by event type**:
  - Visit: Blue (#3b82f6)
  - Payment: Purple (#8b5cf6)
  - Appointment: Green (#10b981)
  - Treatment: Orange (#f59e0b)
- **Date format**: Localized (ar-EG)

## Styling Details

### Colors
- **Primary**: #06b6d4 (Cyan)
- **Secondary**: #8b5cf6 (Violet)
- **Background**: #f8fafc (Light slate)
- **Text Primary**: #0f172a (Dark slate)
- **Text Secondary**: #475569 (Medium slate)
- **Border**: #e2e8f0 (Light slate)
- **Success**: #10b981 (Green)
- **Error**: #ef4444 (Red)

### Typography
- **Font Family**: 'Poppins', system-ui, sans-serif
- **Scale**:
  - Large: 1.125rem (18px)
  - Base: 1rem (16px)
  - Small: 0.875rem (14px)
  - Extra Small: 0.75rem (12px)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- **Component padding**: --spacing-md (16px)
- **Internal gaps**: --spacing-sm (8px)
- **Touch targets**: Minimum 44px
- **Card margins**: --spacing-sm (8px) vertical

### Shadows & Borders
- **Card shadow**: --shadow-md (resting), --shadow-lg (hover)
- **Border radius**: --radius-lg (16px) for card, --radius-md (12px) for badges
- **Border**: 1px solid --color-border

## Responsive Behavior

### Mobile (320px - 767px)
- **Layout**: Single horizontal row as specified
- **Avatar**: 48x48px
- **Text sizes**: As specified
- **Touch targets**: Minimum 44px
- **Timeline**: Full width when expanded

### Tablet (768px - 1023px)
- **Layout**: Maintain horizontal row
- **Avatar**: 56x56px (w-14 h-14)
- **Text sizes**: Slightly larger (1.125rem for name)
- **Spacing**: Increased to --spacing-md
- **Actions**: Slightly larger buttons (48x48px)

### Desktop (1024px+)
- **Layout**: Could extend to multi-column if needed, but maintain mobile-first approach
- **Avatar**: 64x64px (w-16 h-16)
- **Enhanced hover states**: More pronounced shadows and color changes

## Interactions & Animations

### Touch Interactions
- **Card tap**: Select patient (navigate to details)
- **Button taps**: Prevent card selection with stopPropagation
- **Expand tap**: Toggle timeline visibility with smooth animation

### Animations
- **Expand/collapse**: 300ms ease-in-out height transition
- **Hover states**: 200ms color transitions
- **Button press**: Scale down 95% with 150ms transition
- **Badge pulse**: Subtle pulse for outstanding balance (if desired)

### Accessibility
- **Focus indicators**: 2px solid primary color outline
- **ARIA labels**: Descriptive labels for all interactive elements
- **Keyboard navigation**: Full keyboard support
- **Screen readers**: Semantic HTML structure
- **Color contrast**: WCAG 2.1 AA compliant (4.5:1 minimum)

## Implementation Considerations

### Performance
- **Lazy loading**: Timeline data loaded on expand
- **Memoization**: React.memo for event components
- **Efficient re-renders**: Use callbacks and memo for calculations

### Data Requirements
- **Patient**: name, phone, images[], id
- **Balance**: Calculated from treatments and payments
- **Last visit**: From patient.lastVisit or latest treatment
- **Doctor**: From latest treatment or upcoming appointment
- **Timeline events**: Visits, payments, appointments (max 5-7 recent)

### Edge Cases
- **No image**: Fallback to initials with color
- **Long names**: Truncate with ellipsis
- **Zero balance**: Green badge
- **No doctor**: Hide doctor info or show "No doctor assigned"
- **No timeline events**: Show "No recent activity"

## Mermaid Diagram

```mermaid
graph TD
    A[MobilePatientCard] --> B[PatientAvatar]
    A --> C[PatientInfo]
    A --> D[PatientDetails]
    A --> E[ActionButtons]
    A --> F[TimelineSection]

    B --> B1[Image | Initials]

    C --> C1[PatientName]
    C --> C2[BalanceBadge]

    D --> D1[LastVisitInfo]
    D --> D2[DoctorInfo]

    E --> E1[DeleteButton]
    E --> E2[WhatsAppButton]
    E --> E3[ExpandButton]

    F --> F1[TimelineEvent]
    F --> F2[TimelineEvent]
    F --> F3[TimelineEvent]

    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#ffebee
    style F fill:#f3e5f5
```

This design specification provides a comprehensive blueprint for implementing the new mobile patient card layout, ensuring consistency with the existing design system while optimizing for mobile usability.