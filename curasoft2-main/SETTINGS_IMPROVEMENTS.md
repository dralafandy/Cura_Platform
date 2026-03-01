# Settings Page Improvements - Documentation

## Overview
This document describes the enhanced Settings page with additional control features for the CuraSoft dental clinic management system.

## New Features Added

### 1. Display Settings Tab
**Purpose**: Control how data is displayed across different pages

#### Page View Preferences
Choose default view mode (Grid, List, or Table) for each page:
- Inventory
- Patients
- Doctors
- Suppliers
- Purchase Orders
- Expenses
- Appointments
- Treatments
- Prescriptions
- Lab Cases
- Financial Accounts
- Reports

#### Regional Settings
- **Date Format**: DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD
- **Time Format**: 12-hour (AM/PM) or 24-hour
- **Currency Symbol**: Customizable (default: EGP)
- **Currency Position**: Before or after amount
- **Decimal Places**: 0-4 decimal places
- **Show Currency Symbol**: Toggle visibility

### 2. Notifications Settings Tab
**Purpose**: Customize notification behavior

#### Notification Channels
- Sound Notifications
- Desktop Notifications
- Email Notifications

#### Alert Types
- Appointment Reminders
- Low Stock Alerts
- Payment Reminders
- Treatment Reminders
- Lab Case Updates

#### Quiet Hours
- Enable/Disable quiet hours
- Set start and end times
- Suppress all notifications during quiet hours

### 3. Print/Export Settings Tab
**Purpose**: Control print and export defaults

#### Print Settings
- Default Paper Size: A4, Letter, or Legal
- Default Orientation: Portrait or Landscape
- Include Logo: Toggle
- Include Clinic Info: Toggle
- Include Date: Toggle
- Include Page Numbers: Toggle

#### Export Settings
- Default Export Format: PDF, Excel, or CSV
- Image Quality: Low, Medium, or High
- Compress Images: Toggle

### 4. Dashboard Settings Tab
**Purpose**: Customize dashboard appearance and behavior

#### Dashboard Widgets
Toggle visibility for:
- Quick Stats Cards
- Revenue Chart
- Today's Appointments
- Low Stock Alerts
- Recent Patients
- Pending Payments

#### Dashboard Display
- Default Date Range: Today, This Week, This Month, This Year, or Custom
- Refresh Interval: Disabled, 30 seconds, 1 minute, 5 minutes, or 10 minutes
- Layout Style: Default, Compact, or Expanded

### 5. Tables Settings Tab
**Purpose**: Control table behavior across the application

#### Table Display
- Default Page Size: 10, 25, 50, or 100 rows
- Sticky Header: Toggle
- Enable Pagination: Toggle
- Enable Sorting: Toggle
- Enable Filtering: Toggle
- Striped Rows: Toggle
- Highlight on Hover: Toggle

### 6. Accessibility Settings Tab
**Purpose**: Improve accessibility for all users

#### Visual Accessibility
- Font Size: Small, Medium, Large, or Extra Large
- High Contrast Mode: Toggle
- Reduce Motion: Toggle (disables animations)

### 7. Privacy Settings Tab
**Purpose**: Enhance data security

#### Security & Privacy
- Auto Lock Timeout: Disabled, 5 minutes, 15 minutes, 30 minutes, or 1 hour
- Clear Clipboard After: Disabled, 30 seconds, 1 minute, 2 minutes, or 5 minutes
- Mask Sensitive Data: Toggle (shows asterisks for sensitive fields)

### 8. General Settings Enhancements
**Purpose**: Manage preferences globally

- Export Preferences: Save all preferences to JSON file
- Import Preferences: Load preferences from JSON file
- Reset All: Restore all settings to defaults

## UserPreferencesContext API

### Hook Usage
```tsx
import { useUserPreferences } from './contexts/UserPreferencesContext';

const MyComponent = () => {
  const { preferences, updatePreferences, updatePageView } = useUserPreferences();
  
  // Access preferences
  const viewMode = preferences.pageViews.patients;
  
  // Update a category
  updatePreferences('notifications', { enableSound: false });
  
  // Update specific page view
  updatePageView('inventory', 'grid');
};
```

### usePageView Hook
```tsx
import { usePageView } from './contexts/UserPreferencesContext';

const InventoryPage = () => {
  const [viewMode, setViewMode] = usePageView('inventory');
  
  return (
    <div>
      <button onClick={() => setViewMode('list')}>List</button>
      <button onClick={() => setViewMode('grid')}>Grid</button>
    </div>
  );
};
```

### Types
```typescript
type ViewMode = 'grid' | 'list' | 'table';
type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
type TimeFormat = '12h' | '24h';
type CurrencyPosition = 'before' | 'after';
type PageSize = 10 | 25 | 50 | 100;
```

## Storage
All preferences are stored in localStorage with the key `curasoft_user_preferences`. This allows:
- Automatic persistence across sessions
- Export/Import functionality
- Easy backup and restore

## Suggested Additional Features

### 1. Multi-Language Support for UI Labels
Add translations for all UI labels to support more languages.

### 2. Role-Based Settings
Allow administrators to set default preferences for different user roles.

### 3. Cloud Sync
Sync preferences across devices using the Supabase backend.

### 4. Audit Log
Track when preferences are changed and by whom.

### 5. Quick Settings Widget
Add a floating widget for quick access to common settings.

### 6. Keyboard Shortcuts
Add customizable keyboard shortcuts for common actions.

### 7. Theme Customization
Allow users to create custom themes beyond light/dark.

### 8. Data Caching Settings
Configure how data is cached for better performance.

### 9. Audit Trail
Log all changes to settings for compliance.

### 10. Default Templates
Allow creating and saving custom templates for reports and documents.

## Migration Notes
When upgrading from previous versions:
1. First load will use default preferences
2. Existing localStorage data will be preserved
3. New settings will be added with defaults
