# Custom User Permissions Implementation

## Steps to Complete:

### 1. Database Migration
- [ ] Create SQL migration to add `custom_permissions` column to `user_profiles` table

### 2. Type Updates
- [ ] Add `customPermissions?: Permission[]` to `UserProfile` interface in `types.ts`

### 3. Permission Logic Updates
- [ ] Modify `hasPermission()` function in `utils/permissions.ts` to check custom permissions
- [ ] Add helper function to get effective permissions (role + custom)

### 4. UserManagement Component Updates
- [ ] Add "Edit Permissions" button for each user in the table
- [ ] Create `showEditPermissionsModal` state and `editingPermissionsUser` state
- [ ] Create `EditPermissionsModal` component with checkboxes for all permissions
- [ ] Add `handleSaveCustomPermissions()` function to save to database
- [ ] Add permission editing UI with categories

### 5. AuthContext Updates
- [ ] Update user profile fetching to include `custom_permissions` column
- [ ] Ensure custom permissions are available in auth context

### 6. Testing
- [ ] Test permission editing flow
- [ ] Verify custom permissions override role permissions correctly
- [ ] Test edge cases (empty permissions, invalid permissions)
