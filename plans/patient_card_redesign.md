# Patient Card Redesign Plan

## Current Design Analysis
The current patient card design (PatientListItem component) includes:
- Patient avatar with initials and colored background
- Patient name and phone number
- Grid layout with 4 information boxes (last visit, next appointment, last payment, treating doctor)
- Outstanding balance display (if any)
- Action buttons (delete, WhatsApp, expand)

## New Design Requirements
- Add patient image support (using the `images` field from Patient interface)
- Modern, clean design with better visual hierarchy
- Responsive layout that works well on different screen sizes
- Maintain all current functionality

## Proposed New Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│  [Image]  Name & Phone          [Actions]                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [Info Box 1]  [Info Box 2]  [Info Box 3]  [Info Box 4]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  [Outstanding Balance Banner] (if applicable)                  │
└─────────────────────────────────────────────────────────────────┘
```

### Design Elements

1. **Patient Image/Avatar Section**
   - Use actual patient image if available (from `patient.images[0]`)
   - Fallback to initials avatar if no image available
   - Circular image container with subtle shadow
   - Size: 64x64px

2. **Patient Info Section**
   - Patient name (bold, larger font)
   - Phone number (secondary text)
   - Clean typography with proper spacing

3. **Information Grid**
   - 4 information boxes in a 2x2 grid
   - Each box with icon, title, and value
   - Consistent styling with subtle colors
   - Better spacing and visual separation

4. **Outstanding Balance**
   - Prominent banner if balance > 0
   - Animated pulse effect to draw attention
   - Clear currency formatting

5. **Action Buttons**
   - Delete button (red)
   - WhatsApp button (green)
   - Expand chevron
   - Consistent icon styling

### Color Scheme
- Primary: Use clinic's primary color
- Background: White with subtle shadows
- Text: Dark gray for primary, medium gray for secondary
- Info boxes: Light pastel colors with borders
- Balance banner: Red gradient for urgency

### Typography
- Name: 18px bold
- Phone: 14px regular
- Info box titles: 12px medium
- Info box values: 14px bold
- Balance text: 16px bold

### Responsive Considerations
- Mobile: Stack elements vertically
- Tablet/Desktop: Maintain horizontal layout
- Ensure touch targets are large enough for mobile

## Implementation Plan

1. Create new PatientCard component with image support
2. Implement fallback logic for patients without images
3. Update styling to match new design
4. Ensure all existing functionality is preserved
5. Test with various patient data scenarios