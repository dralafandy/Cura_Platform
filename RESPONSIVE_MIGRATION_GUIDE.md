# Responsive Design System - Migration Guide

## Overview

This document provides guidance for migrating existing Curasoft components to use the new responsive design system. The system supports both desktop and mobile layouts with adaptive components.

## Breaking Changes: NONE

This migration is **100% backwards compatible**. All existing desktop functionality remains unchanged. Mobile optimizations are additive.

---

## Quick Start

### 1. Import the Responsive Provider

Wrap your app with the `ResponsiveProvider`:

```tsx
// App.tsx
import { ResponsiveProvider } from './contexts/ResponsiveContext';

function App() {
  return (
    <ResponsiveProvider>
      <YourApp />
    </ResponsiveProvider>
  );
}
```

### 2. Use the Responsive Hook

Detect device type in your components:

```tsx
import { useResponsiveContext } from './contexts/ResponsiveContext';

function MyComponent() {
  const { isMobile, isTablet, isDesktop, deviceType } = useResponsiveContext();
  
  if (isMobile) {
    return <MobileView />;
  }
  return <DesktopView />;
}
```

---

## Component Migration Patterns

### Pattern 1: Responsive Layout

**Before:**
```tsx
function MyPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main>Content</main>
    </div>
  );
}
```

**After:**
```tsx
import { ResponsiveLayout } from './components/ResponsiveLayout';

function MyPage() {
  return (
    <ResponsiveLayout>
      <YourContent />
    </ResponsiveLayout>
  );
}
```

### Pattern 2: Responsive Table → Cards

**Before:**
```tsx
function PatientList() {
  return (
    <table>
      <thead>
        <tr><th>Name</th><th>Phone</th></tr>
      </thead>
      <tbody>
        {patients.map(p => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{p.phone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**After:**
```tsx
import { ResponsiveTable } from './components/ResponsiveTable';

function PatientList() {
  const columns = [
    { key: 'name', header: 'Name', mobileLabel: 'Patient' },
    { key: 'phone', header: 'Phone' },
  ];
  
  return (
    <ResponsiveTable
      data={patients}
      columns={columns}
      keyExtractor={p => p.id}
      cardTitle={p => p.name}
      cardSubtitle={p => p.phone}
    />
  );
}
```

### Pattern 3: Conditional Rendering

**Before:**
```tsx
function Header() {
  return (
    <div className="flex justify-between p-4">
      <div className="hidden md:block">Desktop Nav</div>
      <button className="md:hidden">Menu</button>
    </div>
  );
}
```

**After:**
```tsx
import { MobileHeader } from './components/MobileHeader';

function Header() {
  return (
    <>
      {/* Mobile-optimized header */}
      <MobileHeader 
        title="CuraSoft"
        showMenuButton
        onMenuClick={() => {}}
      />
      
      {/* Desktop header */}
      <DesktopHeader />
    </>
  );
}
```

---

## Breakpoints

| Breakpoint | Width | Device |
|------------|-------|--------|
| xs | < 480px | Mobile Small |
| sm | 480-639px | Mobile Large |
| md | 640-1023px | Tablet |
| lg | 1024-1279px | Desktop |
| xl | 1280-1535px | Desktop Large |
| 2xl | ≥ 1536px | Desktop XL |

### Using Breakpoints

```tsx
import { useResponsive } from './hooks/useResponsive';

function Component() {
  const { width, currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsive();
  
  // Direct comparison
  if (width <= 480) { /* mobile small */ }
  
  // Using flags
  if (isMobile) { /* mobile any size */ }
  if (isTablet) { /* tablet */ }
  if (isDesktop) { /* desktop */ }
}
```

---

## Mobile-Specific Features

### Touch-Friendly Targets

All interactive elements should have minimum 44px touch targets:

```tsx
// Use the built-in classes
<button className="touch-button">Tap Me</button>
<div className="touch-target">44x44px minimum</div>
```

### Bottom Navigation

The app uses a bottom navigation bar on mobile. To add items:

```tsx
// BottomNavBar already has primary items
// - Dashboard
// - Patients
// - Scheduler
// - Doctors
// - Treatments
```

### Floating Action Button (FAB)

```tsx
<button className="fab bg-primary text-white">
  +
</button>
```

### Safe Area Insets (iPhone X+)

```tsx
<div className="safe-area-bottom">
  {/* Content with proper bottom padding */}
</div>
```

---

## CSS Utilities

### Display Utilities

```css
.mobile-only { /* show on mobile only */ }
.tablet-only { /* show on tablet only */ }
.desktop-only { /* show on desktop only */ }

.hide-on-mobile { /* hide on mobile */ }
.hide-on-desktop { /* hide on desktop */ }
```

### Spacing Utilities

```css
.mobile-p-4 { padding: 1rem; }
.mobile-mt-3 { margin-top: 0.75rem; }
.mobile-gap-2 { gap: 0.5rem; }
```

### Typography

```css
.mobile-text-lg { font-size: 1.125rem; }
.mobile-font-bold { font-weight: 700; }
.mobile-text-center { text-align: center; }
```

---

## Animation Utilities

```css
.animate-slide-up { animation: slideUp 0.3s ease-out; }
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
.animate-scale-in { animation: scaleIn 0.2s ease-out; }

/* Staggered children */
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
/* etc. */
```

---

## Best Practices

### 1. Use the ResponsiveTable Component

Instead of building custom responsive tables, use the `ResponsiveTable` component:

- Automatically transforms to cards on mobile
- Supports sorting
- Custom card rendering
- Consistent styling

### 2. Keep Desktop Components Unchanged

The responsive system is designed to work alongside existing desktop components. Don't modify desktop components - just add mobile alternatives.

### 3. Use Consistent Breakpoints

Stick to these breakpoints for consistency:

- Mobile: < 768px
- Tablet: 768px - 1023px  
- Desktop: ≥ 1024px

### 4. Test on Real Devices

Responsive design requires testing on actual devices. Use browser dev tools but also test on real phones and tablets.

### 5. Consider Accessibility

- Minimum touch target: 44x44px
- Color contrast remains the same
- Focus states work on both mobile and desktop

---

## File Structure

```
src/
├── components/
│   ├── ResponsiveLayout.tsx    # Main responsive wrapper
│   ├── ResponsiveTable.tsx      # Adaptive table/card component
│   ├── MobileHeader.tsx         # Mobile-optimized header
│   └── MobileDrawer.tsx        # Already exists
├── contexts/
│   └── ResponsiveContext.tsx   # Device state provider
├── hooks/
│   └── useResponsive.ts        # Responsive detection hooks
├── styles/
│   └── responsive.css          # All responsive utilities
└── index.ts                    # Main export
```

---

## Migration Checklist

- [ ] Wrap app with `ResponsiveProvider`
- [ ] Replace tables with `ResponsiveTable`
- [ ] Add `MobileHeader` for mobile views
- [ ] Import responsive CSS: `import './styles/responsive.css';`
- [ ] Test on mobile devices
- [ ] Test on tablet devices
- [ ] Verify desktop still works unchanged

---

## Support

For questions or issues, contact the development team.
