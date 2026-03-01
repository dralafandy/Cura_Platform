# Preserving Existing Admin Data - Migration Guide

This guide explains how to safely migrate your existing ADMIN users to the new authentication system without losing any data.

## Overview

The new auth system is designed to work alongside your existing data. Here's what happens:

✅ **Preserved:**
- All existing users (ADMIN, DOCTOR, ASSISTANT, RECEPTIONIST)
- All patient records
- All appointments and treatments
- All financial records
- All permissions and roles

❌ **Changed:**
- User authentication mechanism (now uses password_hash with new schema)
- Permission storage (moved to dedicated tables)
- Session management (now centralized in auth context)

## Two-Step Migration Process

### Step 1: Create New Auth Tables

Run the main migration first:

```bash
# In Supabase SQL Editor, copy and paste:
auth/migrations/001_create_auth_tables.sql
```

**What this does:**
- Creates new auth tables (roles, role_permissions, user_permission_overrides, audit_logs)
- Migrates existing user_profiles table (adds new auth columns)
- Does NOT drop any existing data
- Sets up default system roles and permissions

### Step 2: Migrate Existing Admins

Run the admin migration:

```bash
# In Supabase SQL Editor, copy and paste:
auth/migrations/002_migrate_existing_admins.sql
```

**What this does:**
- Updates all existing ADMIN users with auth information
- Generates temporary passwords (admin123 - MUST CHANGE)
- Maps existing admins to new permission system
- Displays migration summary

## Automatic Preservation

The migration process automatically:

1. **Detects existing admins** - Checks if ADMIN users already exist
2. **Adds auth fields** - Adds password_hash, email, etc. without dropping data
3. **Generates temporary passwords** - All admins get default password
4. **Maps to new permission system** - Assigns full permissions to ADMIN role
5. **Preserves all data** - No patient, appointment, or financial data is lost

## What Happens to Existing Admins?

### Before Migration
```
user_profiles:
├── id: uuid
├── username: "admin"
├── role: "ADMIN"
├── permissions: ["USER_MANAGEMENT_VIEW", "PATIENT_VIEW", ...]
├── created_at: timestamp
└── updated_at: timestamp
```

### After Migration
```
user_profiles:
├── id: uuid (SAME)
├── username: "admin" (SAME)
├── email: "admin@curasoft.local" (NEW)
├── password_hash: "0a041b92..." (NEW)
├── first_name: "Admin" (NEW)
├── last_name: "User" (NEW)
├── role: "ADMIN" (SAME)
├── status: "ACTIVE" (NEW)
├── permissions: [...old values...] (KEPT for compatibility)
├── created_at: timestamp (SAME)
└── updated_at: timestamp (SAME)
```

### After App Integration
- Permissions now checked from `role_permissions` table
- Old `permissions` array kept for backward compatibility
- New permission system is resource:action based

## Default Credentials After Migration

All existing admins will be able to login with:

| Field | Value |
|-------|-------|
| Username | Their existing username |
| Password | `admin123` |
| Email | Their existing email (or auto-generated) |

⚠️ **CRITICAL**: Force password change on first login!

## Verifying Migration

### Check migrated admins:

```sql
SELECT username, email, role, status, password_hash 
FROM user_profiles 
WHERE role = 'ADMIN';
```

Should show:
- All existing admins are present
- All have password_hash values
- Status is 'ACTIVE'
- Email is populated

### Verify permissions are assigned:

```sql
SELECT rp.role_id, r.name, COUNT(*) as permission_count
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
WHERE r.name = 'ADMIN'
GROUP BY rp.role_id, r.name;
```

Should show:
- ADMIN role has 33 permissions
- All permission types covered (user:*, patient:*, treatment:*, etc.)

## Troubleshooting

### Problem: "Admin already exists"

**Solution:** The migration includes `ON CONFLICT` clauses, so it will skip duplicate users. If you want to reset:

```sql
-- Option 1: Reset password only
UPDATE user_profiles 
SET password_hash = '0a041b924b1b27b9ce51ac155d965f1be6d2d8151fa8ce4b0061e41f3fb067294'
WHERE username = 'admin';

-- Option 2: Delete and re-run (WARNING: loses all data for that user)
DELETE FROM user_profiles WHERE username = 'admin';
-- Then re-run migration
```

### Problem: "Column already exists"

**Solution:** If you're re-running the migration, it checks for existing columns and skips those:

```sql
-- The migration uses: IF NOT EXISTS
-- So running it multiple times is safe
psql -U postgres -f 001_create_auth_tables.sql
```

### Problem: "Existing admins can't login"

**Solution:** Make sure you ran both migrations in order:

```bash
# Run Step 1 first
001_create_auth_tables.sql

# Then run Step 2
002_migrate_existing_admins.sql
```

### Problem: "Email conflicts"

**Solution:** If multiple users have the same email:

```sql
-- Find conflicts
SELECT email, COUNT(*) as count FROM user_profiles 
WHERE role = 'ADMIN' GROUP BY email HAVING COUNT(*) > 1;

-- Fix manually
UPDATE user_profiles 
SET email = username || '@clinic.local'
WHERE role = 'ADMIN' AND email IS NULL;
```

## Integration Steps

After migration, integrate the new auth system:

### 1. Update App Wrapper

```typescript
// src/App.tsx
import { AuthProvider } from './auth/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      {/* Your routes */}
    </AuthProvider>
  );
}
```

### 2. Update Login Component

```typescript
// src/components/LoginPage.tsx
import { useAuth } from './auth/AuthContext';

export default function LoginPage() {
  const { login, error, loading } = useAuth();
  
  const handleLogin = async (username: string, password: string) => {
    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };
  
  // Old admins can now login with their username + 'admin123'
  // (until they change password)
}
```

### 3. Replace Permission Checks

Old way:
```typescript
import { Permission, usePermissions } from './hooks/usePermissions';

if (checkPermission(Permission.USER_MANAGEMENT_VIEW)) {
  // show UI
}
```

New way:
```typescript
import { useAuth } from './auth/AuthContext';

const { hasPermission } = useAuth();
if (hasPermission('user:read')) {
  // show UI
}
```

### 4. Protect Routes

```typescript
import { ProtectedRoute } from './auth/middleware';

<ProtectedRoute requiredPermission="user:read">
  <UserManagement />
</ProtectedRoute>
```

## Data Compatibility

The system maintains backward compatibility:

### Old Data Still Works
- Existing `permissions` column in user_profiles
- Old role values (ADMIN, DOCTOR, etc.)
- All joined data (patients, appointments, etc.)

### New Data Alongside
- New `password_hash` column
- New `roles`, `role_permissions` tables
- New `audit_logs` table

### Migration Path
```
Old System                    New System
─────────────────────────────────────────────
permissions array             role_permissions table
role column                   role column (+ role_permissions)
NO password_hash              password_hash column
NO audit logs                 audit_logs table
✅ Existing data intact       ✅ Enhanced with new features
```

## Security Considerations

### Before Going Live

1. **Force password change** on all admin first login
2. **Update default passwords**:
   ```sql
   UPDATE user_profiles 
   SET password_hash = 'NEW_SECURE_HASH'
   WHERE role = 'ADMIN';
   ```
3. **Remove test accounts**:
   ```sql
   DELETE FROM user_profiles 
   WHERE username IN ('admin', 'doctor1') 
   AND email LIKE '%@curasoft.local';
   ```
4. **Enable email verification** for new admins
5. **Implement 2FA** for admin accounts
6. **Set session timeout** appropriately (default: 24 hours)

### Password Hashing

Current implementation uses SHA-256. For production:

```typescript
// Use bcrypt instead
import bcrypt from 'bcrypt';

const passwordHash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, passwordHash);
```

## Rollback (If Needed)

If you need to rollback:

```sql
-- Keep existing user_profiles data
-- Just remove new columns (optional)
ALTER TABLE user_profiles DROP COLUMN password_hash;
ALTER TABLE user_profiles DROP COLUMN email;
-- ... etc

-- Drop new tables
DROP TABLE audit_logs;
DROP TABLE user_permission_overrides;
DROP TABLE role_permissions;
DROP TABLE roles;

-- Your existing user data remains intact
```

## Success Checklist

After migration, verify:

- [ ] All existing ADMIN users can login
- [ ] Existing patients/appointments/data visible
- [ ] New permission system working
- [ ] Audit logs recording actions
- [ ] Old permissions still functional (backward compat)
- [ ] New auth hooks working in components
- [ ] Protected routes functioning
- [ ] Permission guards and HOCs working
- [ ] Session timeout working (24 hours)
- [ ] Default test credentials (admin123) can be changed

## Support

If you encounter issues:

1. Check migration output for errors
2. Run verification queries (see "Verifying Migration" section)
3. Review [auth/README.md](./README.md) for detailed API reference
4. Check [auth/INTEGRATION_GUIDE.tsx](./INTEGRATION_GUIDE.tsx) for code examples

## Next Steps

1. ✅ Run migrations (both files in order)
2. ✅ Verify admin data migrated
3. ✅ Integrate AuthProvider in App.tsx
4. ✅ Update LoginPage to use new auth hook
5. ✅ Replace permission checks in components (20+ files)
6. ✅ Add ProtectedRoute wrappers to sensitive routes
7. ✅ Delete old auth files (usePermissions, old AuthContext, etc.)
8. ✅ Force password change for all admins
9. ✅ Test complete auth flow
10. ✅ Deploy to production

---

**Last Updated:** February 2026
**Version:** 1.0.0
**Status:** Safe to use with existing data
