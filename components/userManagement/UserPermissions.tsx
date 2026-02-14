/**
 * UserPermissions Component - Manage user permissions and role overrides
 * 
 * Features:
 * - View role-based permissions
 * - Add custom permissions
 * - Override mode toggle
 * - Permission categories
 */

import React, { useState, useCallback, useMemo } from 'react';
import { UserProfile, Permission } from '../../types';
import { 
  PERMISSION_CATEGORIES, 
  getPermissionDisplayName,
  getRolePermissions,
  getEffectivePermissions
} from '../../utils/permissions';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface UserPermissionsProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissions: Permission[], overrideMode: boolean) => Promise<void>;
}

// ============================================================================
// Main Component
// ============================================================================

export const UserPermissions: React.FC<UserPermissionsProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [customPermissions, setCustomPermissions] = useState<Permission[]>(
    user.custom_permissions || []
  );
  const [overrideMode, setOverrideMode] = useState(user.override_permissions || false);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['User Management'])
  );

  // Get role-based permissions
  const rolePermissions = useMemo(() => 
    getRolePermissions(user.role), 
    [user.role]
  );

  // Get effective permissions based on current state
  const effectivePermissions = useMemo(() => 
    getEffectivePermissions(user.role, customPermissions, overrideMode),
    [user.role, customPermissions, overrideMode]
  );

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Toggle permission
  const togglePermission = useCallback((permission: Permission) => {
    setCustomPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      }
      return [...prev, permission];
    });
  }, []);

  // Check if permission is granted
  const hasPermission = useCallback((permission: Permission): boolean => {
    return effectivePermissions.includes(permission);
  }, [effectivePermissions]);

  // Check if permission is from role
  const isRolePermission = useCallback((permission: Permission): boolean => {
    return rolePermissions.includes(permission);
  }, [rolePermissions]);

  // Check if permission is custom
  const isCustomPermission = useCallback((permission: Permission): boolean => {
    return customPermissions.includes(permission);
  }, [customPermissions]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(customPermissions, overrideMode);
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  // Reset on close
  const handleClose = () => {
    setCustomPermissions(user.custom_permissions || []);
    setOverrideMode(user.override_permissions || false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Permissions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Editing permissions for: <span className="font-medium">{user.username}</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Role: {user.role}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Override Mode Toggle */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={overrideMode}
                onChange={(e) => setOverrideMode(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Override Role Permissions
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When enabled, only the selected permissions below will apply (ignoring role defaults)
                </p>
              </div>
            </label>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Role-based</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Custom added</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-300"></div>
              <span className="text-gray-600 dark:text-gray-400">Not granted</span>
            </div>
          </div>

          {/* Permission Categories */}
          <div className="space-y-4">
            {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {permissions.filter(p => hasPermission(p)).length} / {permissions.length}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedCategories.has(category) ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedCategories.has(category) && (
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {permissions.map(permission => {
                        const granted = Boolean(hasPermission(permission));
                        const fromRole = isRolePermission(permission);
                        const isCustom = isCustomPermission(permission);
                        
                        // Determine styling based on permission source
                        let bgClass = 'bg-gray-50 dark:bg-gray-900/50';
                        let textClass = 'text-gray-600 dark:text-gray-400';
                        let indicatorClass = 'bg-gray-300';
                        
                        if (granted) {
                          if (overrideMode) {
                            // In override mode, all granted permissions are custom
                            bgClass = 'bg-green-50 dark:bg-green-900/20';
                            textClass = 'text-green-700 dark:text-green-300';
                            indicatorClass = 'bg-green-500';
                          } else {
                            // Normal mode - distinguish role vs custom
                            if (fromRole) {
                              bgClass = 'bg-blue-50 dark:bg-blue-900/20';
                              textClass = 'text-blue-700 dark:text-blue-300';
                              indicatorClass = 'bg-blue-500';
                            } else {
                              bgClass = 'bg-green-50 dark:bg-green-900/20';
                              textClass = 'text-green-700 dark:text-green-300';
                              indicatorClass = 'bg-green-500';
                            }
                          }
                        }

                        return (
                          <label
                            key={permission}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${bgClass}`}
                          >
                            <input
                              type="checkbox"
                              checked={granted}
                              onChange={() => togglePermission(permission)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className={`w-2 h-2 rounded-full ${indicatorClass}`}></div>
                            <span className={`text-sm ${textClass}`}>
                              {getPermissionDisplayName(permission)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPermissions;
