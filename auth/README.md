# Clean Auth System - Documentation

A production-ready authentication and authorization system for CuraSoft dental clinic management application. Built with React, TypeScript, and Supabase, following clean architecture and SOLID principles.

**Table of Contents:**
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Core Concepts](#core-concepts)
6. [API Reference](#api-reference)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)
9. [Migration Guide](#migration-guide)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What's Included

The auth system provides:

- **User Management**: Create, read, update, delete users with role-based access
- **Role Management**: Pre-configured roles (ADMIN, DOCTOR, ASSISTANT, RECEPTIONIST)
- **Permission System**: 33 granular permissions using resource:action pattern
- **Session Management**: Secure session handling with automatic expiry
- **Audit Logging**: Complete audit trail of all actions for compliance
- **Access Control**: Route protection, permission guards, and role-based rendering
- **TypeScript Support**: Full type safety across the system
- **Supabase Integration**: Ready-to-use with Supabase PostgreSQL backend

### Key Features

✅ **Clean Architecture** - Separated concerns with dedicated auth module
✅ **SOLID Principles** - Single responsibility, dependency injection patterns
✅ **Type Safe** - Complete TypeScript definitions
✅ **Production Ready** - Audit logging, error handling, retry logic
✅ **Scalable** - Role-based permissions support complex hierarchies
✅ **Secure** - Password hashing, session expiry, permission overrides
✅ **Easy Integration** - Multiple ways to use (hooks, components, HOCs)
✅ **Well Documented** - Comprehensive examples and API docs

---

## Architecture

### Folder Structure

```
auth/
├── types.ts               # TypeScript interfaces and enums
├── AuthContext.tsx        # Authentication provider
├── authService.ts         # Business logic (User, Role, Permission, Audit services)
├── middleware.tsx         # Route protection and access control
├── INTEGRATION_GUIDE.tsx  # Usage examples
├── README.md             # This file
└── migrations/
    └── 001_create_auth_tables.sql  # Database schema
```

### Component Hierarchy

```
AuthProvider (AuthContext.tsx)
├── useAuth() hook
│   ├── user (current user)
│   ├── loading (auth state)
│   ├── error (error message)
│   ├── login()
│   ├── logout()
│   ├── hasPermission()
│   ├── hasAnyPermissions()
│   └── hasAllPermissions()
│
├── ProtectedRoute (middleware.tsx)
│   └── Wraps routes requiring auth
│
├── PermissionGuard (middleware.tsx)
│   └── Conditional rendering based on permissions
│
└── RoleGuard (middleware.tsx)
    └── Conditional rendering based on roles
```

### Permission Naming Convention

Permissions use a **resource:action** pattern for clarity:

```
'user:create'           # Create users
'patient:read'          # Read patient records
'treatment:delete'      # Delete treatments
'finance:manage_payments' # Manage payments
```

### Role Hierarchy

```
┌─────────────────────────────────────────────┐
│ ADMIN                                       │
│ - Full system access                        │
│ - All 33 permissions                        │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ DOCTOR                                      │
│ - Patient and treatment management          │
│ - Finance and inventory read                │
│ - 14 permissions                            │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ ASSISTANT & RECEPTIONIST                    │
│ - Limited read/write access                 │
│ - 6-9 permissions each                      │
└─────────────────────────────────────────────┘
```

---

## Installation

### Prerequisites

- React 18+
- TypeScript 4.5+
- Supabase project (free tier works)
- Node.js 16+

### Step 1: Copy Auth Module

Copy the entire `auth/` folder to your project:

```bash
cp -r auth/ src/
```

### Step 2: Setup Supabase

1. Create new Supabase project at https://supabase.com
2. Connect database (use provided connection string)
3. Run migration:

```bash
# Method 1: Using Supabase SQL Editor
# Copy and paste auth/migrations/001_create_auth_tables.sql
# into Supabase SQL Editor and execute

# Method 2: Using supabase-cli
supabase db push
```

### Step 3: Configure Client

Update `supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Step 4: Environment Variables

Create `.env`:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Step 5: Wrap App with Provider

In `src/App.tsx`:

```typescript
import { AuthProvider } from './auth/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your app routes */}
    </AuthProvider>
  );
}
```

---

## Quick Start

### Login

```typescript
import { useAuth } from './auth/AuthContext';

function LoginPage() {
  const { login, loading, error } = useAuth();

  const handleLogin = async (username: string, password: string) => {
    const result = await login(username, password);
    if (result.success) {
      // Navigate to dashboard
    }
  };
}
```

### Check Permissions

```typescript
import { useAuth } from './auth/AuthContext';

function UserPanel() {
  const { user, hasPermission, hasAnyPermissions } = useAuth();

  return (
    <>
      {hasPermission('user:delete') && <DeleteButton />}
      {hasAnyPermissions(['patient:create', 'patient:update']) && <EditButton />}
    </>
  );
}
```

### Protect Routes

```typescript
import { ProtectedRoute } from './auth/middleware';

function App() {
  return (
    <Routes>
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredPermission="user:read">
            <UserManagement />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

---

## Core Concepts

### Authentication vs Authorization

| Aspect | Auth | AuthZ |
|--------|------|-------|
| **Definition** | Verifying user identity | Granting access to resources |
| **Question** | "Who are you?" | "What can you do?" |
| **Implementation** | Login with credentials | Permission checks |
| **In System** | `login()`, `logout()` | `hasPermission()`, guards |

### Permissions

**Types of Permissions:**

1. **Role Permissions**: Default permissions for a role
   - Every role (ADMIN, DOCTOR, etc.) has default permissions
   - Defined in database during setup
   - Immutable unless role is modified

2. **Permission Overrides**: Individual user grants/revokes
   - Can grant additional permissions temporarily
   - Can revoke role permissions for specific user
   - Support expiry dates for time-limited access

**Example:**

```
User: jane@clinic.com
Role: DOCTOR (permissions: patient:read, patient:update, ...)
Overrides:
  + grant: patient:delete (expires: 2024-12-31)
  - revoke: patient:create

Effective Permissions: patient:read, patient:update, ..., patient:delete
```

### Session Management

- Sessions stored in `sessionStorage`
- 24-hour expiry by default
- Automatic refresh on app load
- Secure logout with session cleanup

### Audit Logging

Every important action is logged:

```typescript
await auditService.logEvent(
  userId,
  'DELETE',  // Action: CREATE, READ, UPDATE, DELETE
  'PATIENT', // Resource type
  patientId, // Resource ID
  { plan: 'Full mouth restoration' } // Changes
);
```

---

## API Reference

### AuthContext API

#### `useAuth()`

Main hook for accessing auth functionality.

```typescript
const {
  // State
  user,           // Current user or null
  loading,        // Auth state loading
  error,          // Error message if any
  
  // Methods
  login,          // (username, password) => Promise<Result>
  logout,         // () => Promise<void>
  
  // Permission checks
  hasPermission,            // (permission) => boolean
  hasAnyPermissions,        // (permissions[]) => boolean
  hasAllPermissions,        // (permissions[]) => boolean
} = useAuth();
```

#### User Service

```typescript
import { userService } from './auth/authService';

// Create user
await userService.createUser({
  username: 'john',
  email: 'john@clinic.com',
  firstName: 'John',
  lastName: 'Dentist',
  password: 'secure123',
  role: 'DOCTOR'
});

// Get user
await userService.getUser(userId);

// Update user
await userService.updateUser(userId, { firstName: 'Jane' });

// Delete user
await userService.deleteUser(userId);

// List users
await userService.listUsers(limit, offset);

// Change password
await userService.changePassword(userId, oldPassword, newPassword);
```

#### Role Service

```typescript
import { roleService } from './auth/authService';

// Get all roles
await roleService.getAllRoles();

// Get role permissions
await roleService.getRolePermissions(roleId);

// Update role permissions
await roleService.updateRolePermissions(roleId, [
  'patient:create',
  'patient:read'
]);
```

#### Permission Service

```typescript
import { permissionService } from './auth/authService';

// Check permission
await permissionService.hasPermission(userId, 'patient:delete');

// Grant override
await permissionService.grantPermissionOverride(
  userId,
  'patient:delete',
  'Temporary for vacation coverage',
  new Date('2024-01-31')
);

// Revoke override
await permissionService.revokePermissionOverride(userId, 'patient:delete');
```

#### Audit Service

```typescript
import { auditService } from './auth/authService';

// Log event
await auditService.logEvent(
  userId,
  'UPDATE',
  'PATIENT',
  patientId,
  { status: 'INACTIVE' }
);

// Get audit logs
await auditService.getAuditLogs({
  userId,
  action: 'DELETE',
  resourceType: 'PATIENT',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
}, limit);
```

### Middleware Components

#### ProtectedRoute

Wraps routes requiring authentication.

```typescript
<ProtectedRoute
  requiredPermission="user:read"  // Optional
  fallback={<AccessDenied />}      // Optional (default: 403 page)
>
  <UserManagement />
</ProtectedRoute>
```

#### PermissionGuard

Conditionally renders based on permissions.

```typescript
<PermissionGuard
  permission={['patient:create', 'patient:update']}
  requireAll={false}  // true = all, false = any
  fallback={null}     // What to show if denied
>
  <EditButton />
</PermissionGuard>
```

#### RoleGuard

Conditionally renders based on roles.

```typescript
<RoleGuard
  role={['ADMIN', 'DOCTOR']}
  requireAll={false}
>
  <AdminPanel />
</RoleGuard>
```

### Utility Hooks

```typescript
import {
  useHasPermission,
  useHasAnyPermission,
  useHasRole,
  useCurrentUser
} from './auth/middleware';

// Single permission
const canEdit = useHasPermission('patient:update');

// Multiple permissions
const canManage = useHasAnyPermission(['patient:create', 'patient:delete']);

// Role check
const isAdmin = useHasRole('ADMIN');

// Current user
const { user, loading } = useCurrentUser();
```

### Higher-Order Components

```typescript
import { withAuth, withPermission, withRole } from './auth/middleware';

// Protect component with auth
export default withAuth(Dashboard);

// Require permission
export default withPermission(DeleteButton, 'patient:delete');

// Require role
export default withRole(AdminPanel, 'ADMIN');
```

---

## Usage Examples

### Example 1: Simple Permission Check

```typescript
function PatientCard({ patient }) {
  const { hasPermission } = useAuth();

  return (
    <div>
      <h3>{patient.name}</h3>
      {hasPermission('patient:update') && (
        <button>Edit</button>
      )}
    </div>
  );
}
```

### Example 2: Multiple Permission Check

```typescript
function FinancePanel() {
  const { hasAllPermissions } = useAuth();

  const canManagePayments = hasAllPermissions([
    'finance:manage_payments',
    'finance:manage_accounts'
  ]);

  if (!canManagePayments) {
    return <div>Insufficient permissions</div>;
  }

  return <PaymentManager />;
}
```

### Example 3: Role-Based Access

```typescript
function DoctorOnlyPanel() {
  const { user } = useAuth();

  return (
    <RoleGuard role="DOCTOR">
      <div className="bg-blue-100 p-4">
        <h2>Doctor Controls</h2>
        {/* Doctor-specific features */}
      </div>
    </RoleGuard>
  );
}
```

### Example 4: Auto-Logout on Permission Denial

```typescript
function SensitiveOperation() {
  const { hasPermission, logout } = useAuth();

  const handleDelete = async () => {
    if (!hasPermission('patient:delete')) {
      alert('Permission denied');
      // Optional: force logout for security
      await logout();
      return;
    }

    // Perform deletion
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### Example 5: Audit Logging

```typescript
async function handleUpdate(userId, changes) {
  const { user } = useAuth();

  // Perform update...

  // Log action
  if (user) {
    await auditService.logEvent(
      user.id,
      'UPDATE',
      'USER',
      userId,
      { changes }
    );
  }
}
```

---

## Best Practices

### 1. Always Use Protected Routes

```typescript
// ✅ Good
<ProtectedRoute requiredPermission="user:read">
  <UserManagement />
</ProtectedRoute>

// ❌ Bad - No protection
<UserManagement />
```

### 2. Check Permissions Before Sensitive Operations

```typescript
// ✅ Good
if (hasPermission('patient:delete')) {
  await deletePatient(patientId);
}

// ❌ Bad - No check
await deletePatient(patientId);
```

### 3. Log All Important Actions

```typescript
// ✅ Good
await auditService.logEvent(user.id, 'DELETE', 'PATIENT', patientId);

// ❌ Bad - No audit trail
await deletePatient(patientId);
```

### 4. Use Specific Permissions

```typescript
// ✅ Good - Specific
hasPermission('patient:delete')

// ❌ Bad - Too generic
hasPermission('user:admin')
```

### 5. Combine Multiple Checks

```typescript
// ✅ Good
const canDeletePatient = 
  hasAllPermissions(['patient:read', 'patient:delete']);

// ❌ Bad - Only checks one
hasPermission('patient:delete')
```

### 6. Handle Errors Gracefully

```typescript
// ✅ Good
try {
  const result = await login(username, password);
  if (!result.success) {
    setError(result.error);
  }
} catch (error) {
  setError('Unexpected error');
}

// ❌ Bad - No error handling
await login(username, password);
```

### 7. Use Custom Hooks for Domain Logic

```typescript
// ✅ Good
export function usePatientPermissions() {
  return {
    canCreate: useHasPermission('patient:create'),
    canDelete: useHasPermission('patient:delete'),
    canView: useHasPermission('patient:read'),
  };
}

// ❌ Bad - Repeated logic
const canDelete = useHasPermission('patient:delete');
```

### 8. Session Timeout Warning

```typescript
// ✅ Good - Warn before logout
useEffect(() => {
  const timer = setTimeout(() => {
    alert('Session expires in 5 minutes');
  }, 19 * 60 * 1000); // 19 minutes (24 min - 5 min)
  
  return () => clearTimeout(timer);
}, []);
```

---

## Migration Guide

### From Old System to New

#### Step 1: Identify Old Permission Usage

Old code:
```typescript
import { Permission, UserRole } from './types';
const { checkPermission } = usePermissions();
if (checkPermission(Permission.USER_MANAGEMENT_VIEW)) { ... }
```

#### Step 2: Replace with New System

New code:
```typescript
import { useAuth } from './auth/AuthContext';
const { hasPermission } = useAuth();
if (hasPermission('user:read')) { ... }
```

#### Step 3: Update Components

Old:
```typescript
import { usePermissions } from './hooks/usePermissions';
function MyComponent() {
  const { checkPermission } = usePermissions();
}
```

New:
```typescript
import { useAuth } from './auth/AuthContext';
function MyComponent() {
  const { hasPermission } = useAuth();
}
```

#### Step 4: Update Routes

Old:
```typescript
<Route path="/users" element={<UserManagement />} />
```

New:
```typescript
<Route
  path="/users"
  element={
    <ProtectedRoute requiredPermission="user:read">
      <UserManagement />
    </ProtectedRoute>
  }
/>
```

#### Step 5: Delete Old Files

After migration is complete, delete:
- `hooks/usePermissions.ts`
- `utils/permissions.ts`
- `contexts/AuthContext.tsx` (old version)
- `services/userService.ts` (old version)

---

## Troubleshooting

### Auth Provider Not Found Error

**Error:** "useAuth must be used within an AuthProvider"

**Solution:** Ensure AuthProvider wraps your App:

```typescript
<AuthProvider>
  <App />
</AuthProvider>
```

### Permissions Not Working

**Check List:**
1. Is user logged in? (`user !== null`)
2. Does role have permission in database?
3. Are permission overrides applied?
4. Has session expired? (24h limit)

```typescript
debug() {
  const { user, loading } = useAuth();
  const { permissionService } = useAuth();
  
  if (!user) console.log('Not logged in');
  if (loading) console.log('Still loading');
  
  // Check database
  const result = await permissionService.hasPermission(
    user.id,
    'patient:read'
  );
  console.log('Result:', result);
}
```

### Session Expired

**Behavior:** User is logged out after 24 hours

**Solution:** Implement refresh logic:

```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const { refreshSession } = useAuth();
    await refreshSession();
  }, 12 * 60 * 60 * 1000); // Every 12 hours

  return () => clearInterval(interval);
}, []);
```

### Supabase Connection Error

**Error:** "Database not configured"

**Solution:** Check environment variables and client setup:

```typescript
console.log(process.env.REACT_APP_SUPABASE_URL);
console.log(process.env.REACT_APP_SUPABASE_ANON_KEY);
```

### Slow Permission Checks

**Cause:** Querying database on every check

**Solution:** Implement caching:

```typescript
const permissionCache = new Map();

async function hasPermissionCached(userId, perm) {
  const key = `${userId}:${perm}`;
  if (permissionCache.has(key)) {
    return permissionCache.get(key);
  }
  
  const result = await hasPermission(userId, perm);
  permissionCache.set(key, result);
  
  // Clear cache after 5 minutes
  setTimeout(() => permissionCache.delete(key), 5 * 60 * 1000);
  
  return result;
}
```

---

## Default Test Credentials

For local development:

| User | Username | Password | Role |
|------|----------|----------|------|
| Admin | `admin` | `admin123` | ADMIN |
| Doctor | `doctor1` | `doctor123` | DOCTOR |

⚠️ **IMPORTANT:** Change these credentials in production!

---

## Support & Contributing

For issues, questions, or contributions:

1. Check the [Integration Guide](./INTEGRATION_GUIDE.tsx) for examples
2. Review [Database Schema](./migrations/001_create_auth_tables.sql)
3. Check existing GitHub issues
4. Create detailed bug reports with reproduction steps

---

## License

Part of CuraSoft project. All rights reserved.

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready
