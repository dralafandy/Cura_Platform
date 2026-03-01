/**
 * Auth System Integration Examples
 * 
 * This file demonstrates how to use the new clean authentication and
 * authorization system throughout your application.
 */

// ============================================================================
// 1. BASIC APP SETUP
// ============================================================================

/**
 * Wrap your application with AuthProvider
 * 
 * File: src/App.tsx
 */

import React from 'react';
import { AuthProvider } from './auth/AuthContext';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LoginPage from './components/LoginPage';
import UserManagement from './components/userManagement/UserManagement';
import { ProtectedRoute } from './auth/middleware';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredPermission="user:read">
              <UserManagement />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

// ============================================================================
// 2. LOGIN PAGE EXAMPLE
// ============================================================================

/**
 * File: src/components/LoginPage.tsx
 */

import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(credentials.username, credentials.password);
    
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">CuraSoft Login</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={credentials.username}
            onChange={(e) =>
              setCredentials({ ...credentials, username: e.target.value })
            }
            className="w-full px-4 py-2 border rounded mb-4"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials({ ...credentials, password: e.target.value })
            }
            className="w-full px-4 py-2 border rounded mb-6"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 3. USING PERMISSION GUARDS
// ============================================================================

/**
 * Example 1: Conditional Rendering with PermissionGuard
 * 
 * File: src/components/PatientPanel.tsx
 */

import { PermissionGuard, RoleGuard } from '../auth/middleware';

export default function PatientPanel() {
  return (
    <div>
      <div className="patient-info">
        {/* Everyone can see patient info */}
        <PatientInfo />
      </div>

      {/* Only users with 'patient:update' can see edit button */}
      <PermissionGuard permission="patient:update">
        <button>Edit Patient</button>
      </PermissionGuard>

      {/* Only users with 'patient:delete' can see delete button */}
      <PermissionGuard permission="patient:delete">
        <button className="text-red-600">Delete Patient</button>
      </PermissionGuard>

      {/* Admin-only section */}
      <RoleGuard role="ADMIN">
        <div className="admin-section">
          <h3>Admin Controls</h3>
          <button>Reset Database</button>
        </div>
      </RoleGuard>
    </div>
  );
}

// ============================================================================
// 4. USING USEAUTH HOOK
// ============================================================================

/**
 * Example: Direct Permission Checking
 * 
 * File: src/components/Header.tsx
 */

import { useAuth } from '../auth/AuthContext';

export default function Header() {
  const { user, logout, hasPermission, hasAnyPermissions } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">CuraSoft</h1>

        {user && (
          <div className="flex items-center space-x-6">
            <span className="text-gray-700">
              Welcome, {user.firstName || user.username}
            </span>

            {/* Show user management link only if user has permission */}
            {hasPermission('user:read') && (
              <a href="/users" className="text-blue-600 hover:underline">
                User Management
              </a>
            )}

            {/* Show finance link if user has ANY finance permission */}
            {hasAnyPermissions(['finance:view_reports', 'finance:manage_payments']) && (
              <a href="/finance" className="text-blue-600 hover:underline">
                Finance
              </a>
            )}

            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================================
// 5. USING SERVICE LAYER
// ============================================================================

/**
 * Example: User Management with Services
 * 
 * File: src/components/userManagement/UserManagement.tsx
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { userService } from '../../auth/authService';
import type { User } from '../../auth/types';

export default function UserManagement() {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await userService.listUsers();

    if (result.success && result.data) {
      setUsers(result.data.users);
      setError(null);
    } else {
      setError(result.error || 'Failed to load users');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!hasPermission('user:delete')) {
      alert('You do not have permission to delete users');
      return;
    }

    if (!confirm('Are you sure?')) return;

    const result = await userService.deleteUser(userId);
    if (result.success) {
      await loadUsers();
    } else {
      alert(result.error);
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {hasPermission('user:create') && (
        <button className="mb-4 px-4 py-2 bg-green-600 text-white rounded">
          Create User
        </button>
      )}

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Username</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="border p-2">{u.username}</td>
              <td className="border p-2">{u.email}</td>
              <td className="border p-2">{u.role}</td>
              <td className="border p-2">{u.status}</td>
              <td className="border p-2">
                {hasPermission('user:update') && (
                  <button className="text-blue-600 hover:underline mr-2">
                    Edit
                  </button>
                )}
                {hasPermission('user:delete') && (
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// 6. USING HOC FOR COMPONENT PROTECTION
// ============================================================================

/**
 * Example: Protect Components with withAuth HOC
 * 
 * File: src/components/AdminDashboard.tsx
 */

import { withAuth, withRole } from '../auth/middleware';

function AdminDashboard() {
  return (
    <div className="p-6">
      <h1>Admin Dashboard</h1>
      {/* Admin-only content */}
    </div>
  );
}

// Protect with both authentication and role check
export default withRole(withAuth(AdminDashboard), 'ADMIN');

/**
 * Alternative: Protect with specific permission
 */

function PatientDelete() {
  return <button>Delete Patient</button>;
}

export const ProtectedPatientDelete = withAuth(
  PatientDelete,
  'patient:delete'
);

// ============================================================================
// 7. AUDIT LOGGING EXAMPLE
// ============================================================================

/**
 * Example: Log user actions
 * 
 * File: src/components/TreatmentManagement.tsx
 */

import { auditService } from '../auth/authService';
import { useAuth } from '../auth/AuthContext';

export default function TreatmentManagement() {
  const { user } = useAuth();

  const handleCreateTreatment = async (treatmentData: any) => {
    const treatment = await api.createTreatment(treatmentData);

    // Log the action
    if (user) {
      await auditService.logEvent(
        user.id,
        'CREATE',
        'TREATMENT',
        treatment.id,
        { plan: treatmentData.plan }
      );
    }

    return treatment;
  };

  return (
    <div>
      {/* Your treatment management UI */}
    </div>
  );
}

// ============================================================================
// 8. CHECKING MULTIPLE PERMISSIONS
// ============================================================================

/**
 * Example: Multiple Permission Checks
 */

import { useAuth } from '../auth/AuthContext';
import { PermissionGuard } from '../auth/middleware';

export default function FinancePanel() {
  const { hasAllPermissions, hasAnyPermissions } = useAuth();

  // Example 1: Require ALL permissions
  const canManagePayments = hasAllPermissions([
    'finance:manage_payments',
    'finance:manage_accounts',
  ]);

  // Example 2: Require ANY permission
  const canAccessFinance = hasAnyPermissions([
    'finance:view_reports',
    'finance:manage_payments',
  ]);

  return (
    <div>
      {/* All finance permissions required */}
      <PermissionGuard
        permission={['finance:manage_payments', 'finance:manage_accounts']}
        requireAll={true}
      >
        <section>
          <h2>Payment Management</h2>
          {/* Payment controls */}
        </section>
      </PermissionGuard>

      {/* Any finance permission required */}
      <PermissionGuard
        permission={['finance:view_reports', 'finance:manage_payments']}
        requireAll={false}
      >
        <section>
          <h2>Finance Dashboard</h2>
          {/* Dashboard */}
        </section>
      </PermissionGuard>
    </div>
  );
}

// ============================================================================
// 9. PERMISSION UTILITIES
// ============================================================================

/**
 * Example: Using Permission Utilities
 */

import {
  getResourcePermissions,
  getPermissionsByPrefix,
  getPermissionDisplayName,
  groupPermissionsByResource,
} from '../auth/middleware';

// Get all permissions for a resource
const patientPermissions = getResourcePermissions('patient');
// Result: ['patient:create', 'patient:read', 'patient:update', 'patient:delete']

// Get all permissions with a prefix
const userPermissions = getPermissionsByPrefix(allPermissions, 'user:');

// Get display name for permission
const displayName = getPermissionDisplayName('patient:delete');
// Result: 'Delete Patients'

// Group permissions by resource
const grouped = groupPermissionsByResource(userPermissions);
// Result: { patient: [...], user: [...], appointment: [...] }

// ============================================================================
// 10. ADVANCED PATTERN - CUSTOM PERMISSION HOOK
// ============================================================================

/**
 * Example: Create custom hooks for specific features
 */

import { useHasPermission, useCurrentUser } from '../auth/middleware';

// Custom hook for patient operations
export function usePatientPermissions() {
  const canCreate = useHasPermission('patient:create');
  const canRead = useHasPermission('patient:read');
  const canUpdate = useHasPermission('patient:update');
  const canDelete = useHasPermission('patient:delete');
  const canManageAttachments = useHasPermission('patient:manage_attachments');

  return {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManageAttachments,
    canEdit: canUpdate,
    canView: canRead,
  };
}

// Use the custom hook
export default function PatientList() {
  const { canCreate, canDelete, canEdit } = usePatientPermissions();
  const { user } = useCurrentUser();

  return (
    <div>
      {canCreate && <CreatePatientButton />}
      {user && (
        <PatientTable
          onEdit={() => {}}
          onDelete={() => {}}
          showEdit={canEdit}
          showDelete={canDelete}
        />
      )}
    </div>
  );
}

// ============================================================================
// 11. ERROR HANDLING PATTERN
// ============================================================================

/**
 * Example: Proper error handling in services
 */

export async function safeUserOperation(
  operation: () => Promise<any>,
  context: string
) {
  try {
    return await operation();
  } catch (error) {
    console.error(`${context} failed:`, error);

    if (error instanceof PermissionDeniedError) {
      return {
        success: false,
        error: 'You do not have permission for this action',
        code: 'PERMISSION_DENIED',
      };
    }

    if (error instanceof AuthenticationError) {
      return {
        success: false,
        error: 'Please log in to continue',
        code: 'NOT_AUTHENTICATED',
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }
}

// ============================================================================
// 12. TESTING WITH AUTH SYSTEM
// ============================================================================

/**
 * Example: Testing components with auth
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../auth/AuthContext';

describe('ProtectedComponent', () => {
  it('should show content when user has permission', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(
      <AuthProvider initialUser={mockUser}>
        <PermissionGuard permission="patient:delete">
          <div>Delete Button</div>
        </PermissionGuard>
      </AuthProvider>
    );

    expect(screen.getByText('Delete Button')).toBeInTheDocument();
  });
});

export default {};
