# Mobile Scheduler Redesign Options

## Current Issues on Mobile
- The calendar grid takes up significant space vertically when stacked.
- Time slots are narrow (h-16) and may be hard to tap on small screens.
- Appointment cards are small and text may be truncated.
- Overall layout is cramped on mobile devices.

## Redesign Options

### Option 1: Daily List View
**Description**: Replace the time grid with a vertical list of appointments for the selected day, showing time, patient, dentist, and reason in cards.

**Pros**:
- Simpler and more readable on mobile.
- Easier to scroll through appointments.
- Better use of horizontal space.

**Cons**:
- Loses the visual time slot representation.
- May require more scrolling for busy days.

**Implementation Steps**:
1. Conditionally render list view on mobile (screen width < 768px).
2. Create appointment list items with time, patient, reason, dentist.
3. Keep calendar for date selection.

### Option 2: Collapsible Calendar
**Description**: Make the calendar collapsible on mobile, showing only the selected week or a compact view.

**Pros**:
- Keeps the full functionality.
- Saves vertical space when collapsed.

**Cons**:
- Still needs space for the schedule grid.
- Complex to implement collapsible state.

**Implementation Steps**:
1. Add a toggle button to collapse/expand calendar.
2. Show only current week in collapsed state.
3. Adjust layout to use more space for schedule.

### Option 3: Tabbed Interface
**Description**: Use tabs: one for Calendar view, one for Daily Schedule view.

**Pros**:
- Dedicated space for each view.
- Cleaner separation.

**Cons**:
- Requires navigation between tabs.
- May feel less integrated.

**Implementation Steps**:
1. Implement tab component (or use existing).
2. Move calendar to one tab, schedule to another.
3. Ensure state syncs between tabs.

### Option 4: Swipeable Day Navigation
**Description**: Keep the grid but add swipe gestures to navigate days, and make slots larger on mobile.

**Pros**:
- Keeps the familiar grid layout.
- Enhances navigation.

**Cons**:
- Grid may still be cramped.
- Requires gesture handling.

**Implementation Steps**:
1. Add touch event handlers for swipe left/right to change selectedDate.
2. Increase slot height on mobile (e.g., h-20).
3. Make appointment cards wider and text larger.

### Option 5: Hybrid Approach
**Description**: Combine list view for appointments with a compact calendar.

**Pros**:
- Best of both worlds.
- Flexible for different screen sizes.

**Cons**:
- More complex implementation.

**Implementation Steps**:
1. Use list view for schedule on mobile.
2. Keep calendar but make it more compact.
3. Add quick day navigation buttons.

## Recommended Approach
Option 1 (Daily List View) is recommended for mobile as it prioritizes usability and readability over visual complexity, which is more important on small screens.

## Next Steps
Choose an option and proceed to implementation, keeping all existing logic (filtering, sorting, modals, etc.) intact.