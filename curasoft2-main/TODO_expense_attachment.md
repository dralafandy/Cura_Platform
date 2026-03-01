# Expense Attachment Viewing Feature - Implementation TODO

## Tasks:
- [x] Analyze existing code structure
- [x] Create implementation plan
- [ ] Add Image Viewer Modal component
- [ ] Update Grid View - Make cards clickable with attachments
- [ ] Update List View - Add view button for attachments
- [ ] Add visual indicators (paperclip icon, cursor pointer)
- [ ] Test the implementation

## Implementation Details:

### 1. Image Viewer Modal
- Create a modal to display the receipt image
- Support closing by clicking outside or X button
- Show image in full size with proper scaling

### 2. Grid View Updates
- Add onClick handler to expense cards with attachments
- Add paperclip icon indicator
- Change cursor to pointer on hover
- Ensure edit/delete buttons still work

### 3. List View Updates  
- Add view button in actions column
- Make receipt indicator clickable

### 4. Visual Feedback
- Tooltip or hint indicating "Click to view receipt"
- Hover effects on cards with attachments
