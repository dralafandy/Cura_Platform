# Trial Reports Page UI Design Plan

## Overview
Create a new trial reports page with modern UI design, improved layout, and better user experience while maintaining all existing functionality.

## Current UI Analysis
- Basic container with title and date selector
- KPI cards in simple grid
- Patient list in plain cards with basic styling
- Export buttons in simple layout
- No modern UI elements like shadows, animations, or advanced layouts

## New Design Principles
- Modern card-based layout with shadows and rounded corners
- Improved spacing and typography hierarchy
- Responsive design for mobile and desktop
- Better visual organization with sections
- Subtle animations and hover effects
- Consistent color scheme and styling

## Layout Structure

### Header Section
- Card container with title and date selector
- Centered title with better typography
- Date selector integrated into the header card

### KPI Dashboard Section
- Card container for KPI cards
- Improved grid layout (2x2 or responsive)
- Enhanced card styling with icons, gradients, or better colors
- Better spacing between cards

### Patient Reports Section
- Card container for the entire section
- Header with title and export buttons in a toolbar
- Patient list with modern card design
- Improved patient card layout with better information hierarchy
- Hover effects and better visual feedback

### Additional Features
- Loading states with skeleton screens
- Error states with better messaging
- Print preview improvements
- Export functionality with better UX

## Component Structure
```
TrialReportsPage/
├── HeaderCard (title + date selector)
├── KPIDashboardCard (grid of KPI cards)
├── PatientReportsCard
│   ├── Toolbar (title + export buttons)
│   └── PatientList (list of PatientCards)
└── PrintModal (for patient reports)
```

## Styling Improvements
- Use Tailwind CSS classes for consistency
- Add custom CSS for advanced effects if needed
- Implement dark mode support if applicable
- Ensure RTL support for Arabic text

## Responsive Design
- Mobile-first approach
- Collapsible sections on mobile
- Optimized layouts for different screen sizes
- Touch-friendly interactions

## Implementation Steps
1. Create TrialReportsPage.tsx with new structure
2. Implement HeaderCard component
3. Enhance KPI cards styling
4. Redesign PatientReportsCard and PatientCards
5. Add responsive breakpoints
6. Test across devices
7. Polish animations and interactions