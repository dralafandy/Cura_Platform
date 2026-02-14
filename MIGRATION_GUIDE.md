# Quick Migration Guide - From Old Auth to New Auth System

## Current Status

The new clean authentication system is now available with **full backward compatibility**. Your old code will continue working while you migrate.

## What Changed

### Old System (Still Works - Deprecated)
```typescript
// ❌ Deprecated
import { Permission, usePermissions } from './hooks/usePermissions';
import { ROLE_PERMISSIONS } from './utils/permissions';

const { checkPermission } = usePermissions(userProfile);
if (checkPermission(Permission.PATIENT_VIEW)) { ... }
```

### New System (Recommended)
```typescript
// ✅ New
import { useAuth } from './auth/AuthContext';

const { hasPermission } = useAuth();
if (hasPermission('patient:read')) { ... }
```

## Migration Steps

### Step 1: Install Database Migrations

Run in Supabase SQL Editor:

```bash
# Copy and run: auth/migrations/001_create_auth_tables.sql
# Then run:    auth/migrations/002_migrate_existing_admins.sql
```

### Step 2: Update App.tsx

```typescript
// Add AuthProvider wrapper
import { AuthProvider } from './auth/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      {/* Your routes */}
    </AuthProvider>
  );
}
```

### Step 3: Update Components (File by File)

**File: components/Sidebar.tsx**
```typescript
// OLD:
import { Permission, usePermissions } from '../hooks/usePermissions';
const { checkPermission } = usePermissions(userProfile);
if (checkPermission(Permission.PATIENT_VIEW)) { ... }

// NEW:
import { useAuth } from '../auth/AuthContext';
const { hasPermission } = useAuth();
if (hasPermission('patient:read')) { ... }
```

**File: components/Header.tsx**
```typescript
// OLD:
import { usePermissions } from '../hooks/usePermissions';

// NEW:
import { useAuth } from '../auth/AuthContext';
const { user, hasPermission, logout } = useAuth();
```

**File: components/MobileDrawer.tsx**
```typescript
// OLD:
import { usePermissions } from '../hooks/usePermissions';

// NEW:
import { useAuth } from '../auth/AuthContext';
const { hasPermission } = useAuth();
```

**Files: components/patient/PatientDetailsModal.tsx & PatientDetailsPanel.tsx**
```typescript
// OLD:
import { usePermissions } from '../../hooks/usePermissions';

// NEW:
import { useAuth } from '../../auth/AuthContext';
const { hasPermission } = useAuth();
```

**Files: components/userManagement/UserForm.tsx, UserList.tsx, etc.**
```typescript
// OLD:
import { Permission } from '../../types';
import { ROLE_PERMISSIONS } from '../../utils/permissions';

// NEW:
import { Permission, UserRole } from '../../auth/types';
import { roleService } from '../../auth/authService';

// To get role permissions:
const permissions = await roleService.getRolePermissions(roleId);
```

### Step 4: Update LoginPage.tsx

```typescript
// OLD:
import { useAuth } from '../hooks/useAuth'; // custom hook

// NEW:
import { useAuth } from '../auth/AuthContext';

const { login, error, loading } = useAuth();
const result = await login(username, password);
if (result.success) {
  navigate('/dashboard');
}
```

### Step 5: Protected Routes

```typescript
// OLD:
<Route path="/patients" element={<PatientList />} />

// NEW:
import { ProtectedRoute } from './auth/middleware';

<Route
  path="/patients"
  element={
    <ProtectedRoute requiredPermission="patient:read">
      <PatientList />
    </ProtectedRoute>
  }
/>
```

### Step 6: Conditional Rendering

```typescript
// OLD:
import { Permission } from '../types';
const { checkPermission } = usePermissions(userProfile);

{checkPermission(Permission.PATIENT_DELETE) && <DeleteButton />}

// NEW:
import { PermissionGuard } from '../auth/middleware';

<PermissionGuard permission="patient:delete">
  <DeleteButton />
</PermissionGuard>
```

### Step 7: Admin-Only Components

```typescript
// OLD:
import { usePermissions } from '../hooks/usePermissions';
const { isAdmin } = usePermissions(userProfile);
{isAdmin && <AdminPanel />}

// NEW:
import { RoleGuard } from '../auth/middleware';
<RoleGuard role="ADMIN">
  <AdminPanel />
</RoleGuard>
```

## Files to Delete (After Testing)

Once you've migrated all components, delete these old files:

```bash
rm -f:
- hooks/usePermissions.ts
- utils/permissions.ts
- utils/authUtils.ts
- contexts/AuthContext.tsx (old version)
- services/userService.ts (old version)
```

## Permission Name Changes

The new system uses cleaner permission names:

| Old | New |
|-----|-----|
| `Permission.PATIENT_VIEW` | `'patient:read'` |
| `Permission.PATIENT_CREATE` | `'patient:create'` |
| `Permission.PATIENT_EDIT` | `'patient:update'` |
| `Permission.PATIENT_DELETE` | `'patient:delete'` |
| `Permission.USER_MANAGEMENT_VIEW` | `'user:read'` |
| `Permission.TREATMENT_VIEW` | `'treatment:read'` |
| etc. | (resource:action pattern) |

See [auth/README.md](./auth/README.md) for complete list.

## Testing Checklist

- [ ] App starts without errors
- [ ] Can login with admin credentials
- [ ] Protected routes work
- [ ] Permission checks show/hide UI correctly
- [ ] Audit logs showing new actions
- [ ] Old auth files can be deleted
- [ ] No console errors

## Troubleshooting

### "useAuth must be used within AuthProvider"
**Solution:** Make sure AuthProvider wraps your entire app in main.tsx/index.tsx

### "Cannot find module permission"
**Solution:** Replace `import { Permission } from './types'` with `import { Permission } from './auth/types'`

### Permission checks not working
**Solution:** Make sure you wrapped app with `<AuthProvider>` and are using `useAuth()` hook

### Old code still works but shows warnings
**Solution:** This is expected during migration. Fix warnings by updating imports

## Getting Help

- Check [auth/INTEGRATION_GUIDE.tsx](./auth/INTEGRATION_GUIDE.tsx) for code examples
- Review [auth/README.md](./auth/README.md) for complete API reference
- See [auth/PRESERVE_ADMIN_DATA.md](./auth/PRESERVE_ADMIN_DATA.md) for data preservation details

## Timeline

Recommended migration timeline:

| Phase | Timeline | Tasks |
|-------|----------|-------|
| Phase 1 | Day 1 | Setup AuthProvider, update App.tsx |
| Phase 2 | Days 2-3 | Update navigation components (Header, Sidebar, etc.) |
| Phase 3 | Days 4-5 | Update feature components (Patient, Treatment, Finance) |
| Phase 4 | Day 6 | Update LoginPage and auth flows |
| Phase 5 | Day 7 | Delete old auth files, final testing |

## File Update Priority

1. **High** (Critical):
   - App.tsx - Add AuthProvider
   - components/Header.tsx - User display + logout
   - components/LoginPage.tsx - Auth flow

2. **Medium** (Important):
   - components/Sidebar.tsx - Navigation permissions
   - components/patient/* - Patient features
   - components/userManagement/* - User management

3. **Low** (Can wait):
   - Old test files
   - Unused components
   - Documentation

## Backward Compatibility

**Good News:** Your old code will keep working because:
- `Permission` enum re-exported in `types.ts`
- `UserRole` enum preserved in `types.ts`
- Old imports still resolve to new implementation
- `usePermissions` hook still available (with deprecation warning)

This allows you to migrate gradually without breaking everything at once.

## What's Improved in New System

✅ **Cleaner permission names** - 'patient:read' vs 'PATIENT_VIEW'
✅ **Simpler permission checks** - `hasPermission()` vs `checkPermission()`
✅ **Better organization** - All auth in one place
✅ **Full audit trail** - Every action logged
✅ **Session management** - Built-in session handling
✅ **Type safety** - Better TypeScript support
✅ **Middleware** - Route protection, permission guards, HOCs
✅ **Scalable** - Permission overrides, temporary access grants

## Next Steps

1. ✅ Run database migrations
2. ✅ Wrap app with AuthProvider
3. ✅ Update components to use new hooks
4. ✅ Test everything works
5. ✅ Delete old auth files
6. ✅ Deploy to production
7. ✅ Force password change for all admins (security)

---

**Questions?** Check the [auth/README.md](./auth/README.md) or review [auth/INTEGRATION_GUIDE.tsx](./auth/INTEGRATION_GUIDE.tsx) for examples.

**Time to complete:** ~1 week for full migration
**Difficulty:** Easy to Medium
**Risk:** Low (backward compatible throughout)
