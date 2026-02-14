# TODO: Delete All User Permissions Fully

## Files to Edit:
- [ ] types.ts - Remove permissions field from UserProfile
- [ ] utils/authUtils.ts - Remove hasPermission function and permission assignments
- [ ] utils/permissions.ts - Delete entire file
- [ ] components/UserManagement.tsx - Remove permission management UI and logic
- [ ] pages/LoginPage.tsx - Remove permissions from user data
- [ ] contexts/AuthContext.tsx - Remove permissions handling
- [ ] components/Sidebar.tsx - Remove permission checks
- [ ] components/Header.tsx - Remove permission checks
- [ ] components/BottomNavBar.tsx - Remove permission checks
- [ ] components/MobileDrawer.tsx - Remove permission checks

## Followup Steps:
- [ ] Test the app to ensure all permission checks are removed
- [ ] Update database schema if needed
