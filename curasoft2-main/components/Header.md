# Header Component Documentation

## Overview
The Header component is a reusable, modern, and interactive top navigation bar for the CuraSoft dental clinic management system. It provides a consistent interface across all application pages with customizable sections and interactive features.

## Features

### 1. Reusable Design
- Standalone component that can be imported and used across all pages
- Customizable sections (left, center, right) for different views
- Responsive layout that adapts to desktop and mobile devices

### 2. Modern Aesthetics
- Clean, professional design with modern color scheme
- Smooth transitions and hover effects
- Gradient text and icons
- Shadow effects for depth

### 3. Interactive Features
- **Search Bar**: Full-text search with autocomplete
- **Notifications**: Bell icon with dropdown showing pending reminders
- **User Menu**: Profile dropdown with settings and logout
- **Responsive Menu**: Collapses to hamburger menu on mobile

### 4. Key Components

#### NotificationBell
Displays pending reminders with priority levels:
- Appointment reminders
- Low stock alerts
- Lab case due notifications
- Overdue payment alerts

#### UserMenu
User profile dropdown with:
- User avatar with status indicator
- Username and role display
- Settings link
- Logout button

## Usage

### Basic Implementation

```tsx
import Header from './components/Header';

function App() {
  return (
    <div className="app">
      <Header 
        currentView="dashboard"
        setCurrentView={(view) => console.log('View changed:', view)}
        clinicData={clinicData}
        title="Dashboard"
        subtitle="Comprehensive clinic overview"
        showSearch={true}
        showBreadcrumb={false}
      />
      {/* Main content */}
    </div>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentView` | `View` | Required | Current view identifier |
| `setCurrentView` | `(view: View) => void` | Required | Function to update current view |
| `clinicData` | `ClinicData` | Required | Clinic data context |
| `title` | `string` | Auto-generated | Page title |
| `subtitle` | `string` | - | Page subtitle |
| `showSearch` | `boolean` | `true` | Show/hide search bar |
| `showBreadcrumb` | `boolean` | `false` | Show/hide breadcrumb navigation |

### View Titles
The component automatically generates page titles based on the current view using translation keys. You can override this by providing a custom `title` prop.

### Translation Keys

The Header component uses the following translation keys:

```typescript
// Common
"common.search": "Search..."
"common.userMenu": "User Menu"
"common.items": "items"

// Application
"appName": "CuraSoft"

// Sidebar (for view titles)
"sidebar.dashboard": "Dashboard"
"sidebar.patients": "Patients"
"sidebar.scheduler": "Scheduler"
"sidebar.doctors": "Doctors"
"sidebar.reports": "Reports"
"sidebar.settings": "Settings"
// ... additional view titles

// Notifications
"reminders.toggleNotifications": "Toggle Notifications"
"reminders.pendingReminders": "Pending Reminders"
"reminders.noPendingReminders": "No pending reminders."

// Authentication
"auth.logout.button": "Log Out"
```

## Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Logo] [App Name]  [Search]  [Notifications]  [User Menu] │
│                                                             │
│  [Page Title] [Breadcrumb]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sections

1. **Left Section**: Logo and app name
2. **Center Section**: Search bar (desktop) or menu toggle (mobile)
3. **Right Section**: Notifications bell and user menu

## Responsive Design

- **Desktop**: Full header with all sections visible
- **Tablet**: Search bar collapses to icon
- **Mobile**: Header collapses to minimal version with hamburger menu

## Styling

The Header component uses Tailwind CSS with the following key styles:

- **Background**: White with subtle shadow
- **Border**: Light gray bottom border
- **Colors**: Blue/purple gradients for accents
- **Spacing**: Generous padding with logical groupings
- **Effects**: Subtle shadows, hover states, and transitions

## Integration

### 1. Update App.tsx
```tsx
// Import the Header component
import Header from './components/Header';

// Replace the old header with the new one
function App() {
  // ... existing code
  
  return (
    <div className="app">
      <div className="md:flex">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <div className="flex-1 flex flex-col w-full print:block">
          <Header 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            clinicData={clinicData}
          />
          {/* Main content */}
        </div>
      </div>
      {/* Bottom navigation for mobile */}
    </div>
  );
}
```

### 2. Add Translations
Ensure the necessary translation keys are added to both English and Arabic translation files.

## Customization

### Adding Custom Sections
The Header component can be extended to include additional sections by modifying the `Header.tsx` file.

### Overriding Styles
Custom styles can be applied using Tailwind CSS classes or by modifying the component's CSS.

## Performance

- The Header component uses React.memo for optimization
- Notifications are cached using useMemo
- Search functionality is debounced for performance
- Responsive design ensures smooth performance on all devices

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## Future Enhancements

1. **Theme Support**: Dark/light mode toggle
2. **Quick Actions**: Add frequently used actions to the header
3. **Language Switcher**: Multi-language support
4. **Customization**: Allow users to customize the header layout
5. **Analytics**: Track header interactions for UX improvements

## Conclusion
The Header component provides a modern, reusable, and interactive top navigation bar for the CuraSoft application. It enhances the user experience with consistent design, responsive layout, and interactive features.