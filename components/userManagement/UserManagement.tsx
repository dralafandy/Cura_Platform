/**
 * UserManagement Component - Main user management page
 * 
 * Features:
 * - User listing with search and filters
 * - Create, edit, delete users
 * - Manage user permissions
 * - Bulk operations
 * - Activity logging
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserStatus, Permission, NotificationType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  updateUserPermissions,
  bulkDeleteUsers,
  bulkUpdateUserStatus,
  CreateUserRequest,
  UpdateUserRequest
} from '../../services/userService';
import { UserList } from './UserList';
import { UserForm, UserFormData } from './UserForm';
import { UserPermissions } from './UserPermissions';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

// ============================================================================
// Utility Components
// ============================================================================

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info'
}) => {
  if (!isOpen) return null;

  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300">{message}</p>
        </div>
        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors ${buttonColors[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const UserManagement: React.FC = () => {
  const { user: currentUser, checkPermission } = useAuth();
  const { addNotification } = useNotification();

  // State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<UserProfile | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);

  // Check permissions
  const canCreate = checkPermission(Permission.USER_MANAGEMENT_CREATE);
  const canView = checkPermission(Permission.USER_MANAGEMENT_VIEW);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        addNotification({
          type: NotificationType.ERROR,
          title: 'Error',
          message: result.error || 'Failed to fetch users',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: 'Failed to fetch users',
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Initial load
  useEffect(() => {
    if (canView) {
      fetchUsers();
    }
  }, [canView, fetchUsers]);

  // Handle create user
  const handleCreateUser = useCallback(async (formData: UserFormData) => {
    const request: CreateUserRequest = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      status: formData.status,
      clinicId: formData.clinicId,
      branchId: formData.branchId || null,
    };

    const result = await createUser(request);
    
    if (result.success) {
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: `User ${formData.username} created successfully`,
      });
      await fetchUsers();
    } else {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: result.error || 'Failed to create user',
      });
      throw new Error(result.error);
    }
  }, [addNotification, fetchUsers]);

  // Handle update user
  const handleUpdateUser = useCallback(async (formData: UserFormData) => {
    if (!editingUser) return;

    const request: UpdateUserRequest = {
      id: editingUser.id,
      username: formData.username,
      role: formData.role,
      status: formData.status,
    };

    const result = await updateUser(request);
    
    if (result.success) {
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: `User ${formData.username} updated successfully`,
      });
      await fetchUsers();
    } else {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: result.error || 'Failed to update user',
      });
      throw new Error(result.error);
    }
  }, [editingUser, addNotification, fetchUsers]);

  // Handle delete user
  const handleDeleteUser = useCallback(async (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: 'You cannot delete your own account',
      });
      return;
    }

    const result = await deleteUser(user.id);
    
    if (result.success) {
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: `User ${user.username} deleted successfully`,
      });
      await fetchUsers();
    } else {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: result.error || 'Failed to delete user',
      });
    }
    setDeleteConfirmUser(null);
  }, [currentUser?.id, addNotification, fetchUsers]);

  // Handle save permissions
  const handleSavePermissions = useCallback(async (
    permissions: Permission[], 
    overrideMode: boolean
  ) => {
    if (!permissionsUser) return;

    const result = await updateUserPermissions(
      permissionsUser.id,
      permissions,
      overrideMode
    );
    
    if (result.success) {
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: `Permissions for ${permissionsUser.username} updated successfully`,
      });
      await fetchUsers();
    } else {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: result.error || 'Failed to update permissions',
      });
      throw new Error(result.error);
    }
  }, [permissionsUser, addNotification, fetchUsers]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async (ids: string[]) => {
    // Filter out current user
    const idsToDelete = ids.filter(id => id !== currentUser?.id);
    
    if (idsToDelete.length === 0) {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: 'Cannot delete your own account',
      });
      return;
    }

    const result = await bulkDeleteUsers(idsToDelete);
    
    if (result.success) {
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: `${result.data} user(s) deleted successfully`,
      });
      await fetchUsers();
    } else {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: result.error || 'Failed to delete users',
      });
    }
  }, [currentUser?.id, addNotification, fetchUsers]);

  // Handle bulk status change
  const handleBulkStatusChange = useCallback(async (ids: string[], status: UserStatus) => {
    const result = await bulkUpdateUserStatus(ids, status);
    
    if (result.success) {
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: `${result.data} user(s) status updated to ${status}`,
      });
      await fetchUsers();
    } else {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: result.error || 'Failed to update user status',
      });
    }
  }, [addNotification, fetchUsers]);

  // Modal handlers
  const openCreateModal = useCallback(() => {
    setEditingUser(null);
    setShowFormModal(true);
  }, []);

  const openEditModal = useCallback((user: UserProfile) => {
    setEditingUser(user);
    setShowFormModal(true);
  }, []);

  const openPermissionsModal = useCallback((user: UserProfile) => {
    setPermissionsUser(user);
    setShowPermissionsModal(true);
  }, []);

  const openDeleteConfirm = useCallback((user: UserProfile) => {
    setDeleteConfirmUser(user);
  }, []);

  // If user doesn't have view permission
  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Access Denied:</strong> You do not have permission to view user management.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        )}
      </div>

      {/* User List */}
      <UserList
        users={users}
        loading={loading}
        currentUserId={currentUser?.id || ''}
        onEdit={openEditModal}
        onDelete={openDeleteConfirm}
        onManagePermissions={openPermissionsModal}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
        onRefresh={fetchUsers}
      />

      {/* Create/Edit Modal */}
      <UserForm
        user={editingUser}
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
      />

      {/* Permissions Modal */}
      {permissionsUser && (
        <UserPermissions
          user={permissionsUser}
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setPermissionsUser(null);
          }}
          onSave={handleSavePermissions}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteConfirmUser}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteConfirmUser?.username}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteConfirmUser && handleDeleteUser(deleteConfirmUser)}
        onCancel={() => setDeleteConfirmUser(null)}
      />
    </div>
  );
};

export default UserManagement;
