/**
 * EditUserPermissionsModal Component - Clean implementation for editing user permissions
 * 
 * Features:
 * - View and modify user permissions by category
 * - Override mode to use only custom permissions
 * - Role-based default permissions display
 * - Visual indicators for permission sources
 * - Auto-save support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Permission } from '../../types';
import {
  PERMISSION_CATEGORIES,
  getPermissionDisplayName,
  getRolePermissions,
  getEffectivePermissions,
  ROLE_PERMISSIONS,
} from '../../utils/permissions';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../contexts/ThemeContext';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface EditUserPermissionsModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onSave: (permissions: Permission[], overrideMode: boolean) => Promise<void>;
}

// ============================================================================
// Main Component
// ============================================================================

export const EditUserPermissionsModal: React.FC<EditUserPermissionsModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const { isDark } = useTheme();
  
  // State
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
  const [overrideMode, setOverrideMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize state when user changes
  useEffect(() => {
    if (user) {
      setCustomPermissions(user.custom_permissions || []);
      setOverrideMode(user.override_permissions || false);
      setHasChanges(false);
    }
  }, [user, isOpen]);

  // Get role permissions
  const rolePermissions = useMemo(() => {
    if (!user) return [];
    return getRolePermissions(user.role);
  }, [user]);

  // Get effective permissions
  const effectivePermissions = useMemo(() => {
    if (!user) return [];
    return getEffectivePermissions(user.role, customPermissions, overrideMode);
  }, [user, customPermissions, overrideMode]);

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

  // Handle permission toggle
  const handleTogglePermission = useCallback((permission: Permission) => {
    setCustomPermissions(prev => {
      const newPermissions = prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission];
      
      return newPermissions;
    });
    setHasChanges(true);
  }, []);

  // Handle override mode toggle
  const handleOverrideModeToggle = useCallback((checked: boolean) => {
    setOverrideMode(checked);
    setHasChanges(true);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await onSave(customPermissions, overrideMode);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, customPermissions, overrideMode, onSave]);

  // Handle close
  const handleClose = useCallback(() => {
    // Reset to original if there are changes and user doesn't save
    if (hasChanges && !window.confirm(t('common.confirmDiscard'))) {
      return;
    }
    
    if (user) {
      setCustomPermissions(user.custom_permissions || []);
      setOverrideMode(user.override_permissions || false);
      setHasChanges(false);
    }
    
    onClose();
  }, [user, hasChanges, t, onClose]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Edit User Permissions
              </h2>
              <div className={`mt-2 space-y-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                <p>
                  <span className="font-medium">User:</span> {user.username}
                </p>
                <p>
                  <span className="font-medium">Role:</span> {user.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Override Mode Toggle */}
          <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-blue-50 border-blue-200'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={overrideMode}
                onChange={(e) => handleOverrideModeToggle(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div>
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Override Role Permissions
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  When enabled, only selected custom permissions will be used. Role-based permissions will be ignored.
                </p>
              </div>
            </label>
          </div>

          {/* Legend */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Permission Sources:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                  Role-based permission
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                  Custom permission
                </span>
              </div>
            </div>
          </div>

          {/* Permissions by Category */}
          <div className="space-y-4">
            {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
              <div key={category} className={`p-4 rounded-lg border ${isDark ? 'border-slate-600 bg-slate-700/30' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className={`flex items-center gap-2 font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <span>{category}</span>
                  <span className={`text-xs font-normal px-2 py-1 rounded ${isDark ? 'bg-slate-600 text-slate-200' : 'bg-gray-200 text-gray-700'}`}>
                    {permissions.filter(p => effectivePermissions.includes(p)).length} / {permissions.length}
                  </span>
                </h3>

                <div className="space-y-2">
                  {permissions.map(permission => {
                    const granted = Boolean(hasPermission(permission));
                    const isRole = isRolePermission(permission);
                    const isCustom = isCustomPermission(permission);
                    
                    const indicatorBg = isCustom ? 'bg-green-500' : isRole ? 'bg-blue-500' : 'bg-gray-300';
                    const checkboxDisabled = isRole && !overrideMode;
                    
                    return (
                      <label
                        key={permission}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          checkboxDisabled
                            ? isDark ? 'bg-slate-600/50 cursor-not-allowed' : 'bg-gray-200 cursor-not-allowed'
                            : isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={granted}
                          onChange={() => handleTogglePermission(permission)}
                          disabled={checkboxDisabled}
                          className="w-5 h-5 rounded"
                        />
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${indicatorBg}`}></div>
                        <span className={isDark ? 'text-slate-200' : 'text-gray-700'}>
                          {getPermissionDisplayName(permission)}
                        </span>
                        {checkboxDisabled && (
                          <span className={`ml-auto text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            (from role)
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              <span className="font-medium">Total Permissions:</span> {effectivePermissions.length}
            </p>
            {overrideMode && (
              <p className={`text-sm mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                ⚠️ Override mode is active. Only selected custom permissions will be used.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isSaving || !hasChanges
                ? isDark ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserPermissionsModal;
