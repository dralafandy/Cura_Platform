import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, UserRole, UserStatus, NotificationType, Permission } from '../types';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ToastContainer from './ToastContainer';
import { useNotification } from '../contexts/NotificationContext';
import { ROLE_PERMISSIONS, PERMISSION_CATEGORIES, getPermissionDisplayName } from '../utils/permissions';



interface UserFormData {
  username: string;
  email: string;
  password: string;
  newPassword: string;
  confirmPassword: string;
  role: UserRole;
  status: UserStatus;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotification();
  const { theme } = useTheme();
  
  // Check if supabase is available
  if (!supabase) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> Supabase client is not initialized. Please check your configuration.
        </div>
      </div>
    );
  }
  
  // State management
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showEditPermissionsModal, setShowEditPermissionsModal] = useState(false);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfile | null>(null);
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
  const [overridePermissions, setOverridePermissions] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  
  // Form state

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const usersPerPage = 10;

  // Fetch users from database
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase!
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification({ message: 'Failed to fetch users', type: NotificationType.ERROR });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Validate form data
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 50) {
      errors.username = 'Username must be less than 50 characters';
    }

    // Email validation (only for new users)
    if (!editingUser) {
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Email is invalid';
      }

      // Password validation (only for new users)
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      } else if (formData.password.length > 100) {
        errors.password = 'Password must be less than 100 characters';
      }
    }

    // Password reset validation (only for editing users)
    if (editingUser && isResettingPassword) {
      if (!formData.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      } else if (formData.newPassword.length > 100) {
        errors.newPassword = 'Password must be less than 100 characters';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, editingUser, isResettingPassword]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user
        await handleUpdateUser();
      } else {
        // Create new user
        await handleCreateUser();
      }

      // Close modal and refresh users
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      await fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      addNotification({ 
        message: error.message || 'Failed to save user', 
        type: NotificationType.ERROR 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create new user
  const handleCreateUser = async () => {
    // Check if username already exists
    const { data: existingUser } = await supabase!
      .from('user_profiles')
      .select('id')
      .eq('username', formData.username)
      .single();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase!.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // Hash password for direct login
    const { hashPassword } = await import('../utils/authUtils');
    const hashedPassword = await hashPassword(formData.password);

    // Create user profile
    const { error: profileError } = await supabase!
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        user_id: authData.user.id,
        username: formData.username,
        role: formData.role,
        status: formData.status,
        password_hash: hashedPassword,
      });

    if (profileError) throw profileError;

    addNotification({ message: 'User created successfully', type: NotificationType.SUCCESS });
  };

  // Update existing user
  const handleUpdateUser = async () => {
    // Check if username is taken by another user
    const { data: existingUser } = await supabase!
      .from('user_profiles')
      .select('id')
      .eq('username', formData.username)
      .neq('id', editingUser!.id)
      .single();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Prepare update data
    const updateData: any = {
      username: formData.username,
      role: formData.role,
      status: formData.status,
      updated_at: new Date().toISOString(),
    };

    // Update user profile
    const { error: profileError } = await supabase!
      .from('user_profiles')
      .update(updateData)
      .eq('id', editingUser!.id);

    if (profileError) throw profileError;

    // Update password if provided
    if (isResettingPassword && formData.newPassword) {
      // Update auth user password
      const { error: authError } = await supabase!.auth.updateUser({
        password: formData.newPassword,
      });

      if (authError) throw authError;

      // Update password hash in profile
      const { hashPassword } = await import('../utils/authUtils');
      const hashedPassword = await hashPassword(formData.newPassword);

      const { error: hashError } = await supabase!
        .from('user_profiles')
        .update({ password_hash: hashedPassword })
        .eq('id', editingUser!.id);

      if (hashError) throw hashError;
    }

    addNotification({ message: 'User updated successfully', type: NotificationType.SUCCESS });
  };

  // Handle OAuth unlinking
  const handleUnlinkOAuth = async (userId: string, provider: string) => {
    if (!confirm(`Are you sure you want to unlink this ${provider} account?`)) return;
    
    try {
      const { error } = await supabase!
        .from('user_profiles')
        .update({ 
          oauth_provider: null, 
          oauth_id: null, 
          oauth_email: null 
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      addNotification({ message: `${provider} account unlinked successfully`, type: NotificationType.SUCCESS });
      await fetchUsers();
    } catch (error: any) {
      console.error('Error unlinking OAuth account:', error);
      addNotification({ message: 'Failed to unlink OAuth account', type: NotificationType.ERROR });
    }
  };

  // Edit user
  const handleEdit = (userProfile: UserProfile) => {
    setEditingUser(userProfile);
    setFormData({
      username: userProfile.username,
      email: '', // Email is in auth.users, not in profile
      password: '',
      newPassword: '',
      confirmPassword: '',
      role: userProfile.role,
      status: userProfile.status || UserStatus.ACTIVE,
    });
    setIsResettingPassword(false);
    setFormErrors({});
    setShowModal(true);
  };

  // Delete user
  const handleDelete = async (userId: string) => {
    // Prevent deleting yourself
    if (userId === currentUser?.id) {
      addNotification({ message: 'You cannot delete your own account', type: NotificationType.ERROR });
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from user_profiles
      const { error: profileError } = await supabase!
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Note: Deleting from auth.users requires admin privileges
      // This should be handled by a database trigger or edge function
      
      addNotification({ message: 'User deleted successfully', type: NotificationType.SUCCESS });
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      addNotification({ message: 'Failed to delete user', type: NotificationType.ERROR });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      newPassword: '',
      confirmPassword: '',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    setIsResettingPassword(false);
    setFormErrors({});
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // Bulk selection handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    // Prevent deleting yourself
    if (selectedUsers.includes(currentUser?.id || '')) {
      addNotification({ message: 'You cannot delete your own account', type: NotificationType.ERROR });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase!
        .from('user_profiles')
        .delete()
        .in('id', selectedUsers);

      if (error) throw error;
      
      addNotification({ 
        message: `${selectedUsers.length} user(s) deleted successfully`, 
        type: NotificationType.SUCCESS 
      });
      setSelectedUsers([]);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting users:', error);
      addNotification({ message: 'Failed to delete users', type: NotificationType.ERROR });
    }
  };

  const handleBulkStatusChange = async (newStatus: UserStatus) => {
    try {
      const { error } = await supabase!
        .from('user_profiles')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .in('id', selectedUsers);

      if (error) throw error;
      
      addNotification({ 
        message: `${selectedUsers.length} user(s) updated successfully`, 
        type: NotificationType.SUCCESS 
      });
      setSelectedUsers([]);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating users:', error);
      addNotification({ message: 'Failed to update users', type: NotificationType.ERROR });
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case UserRole.RECEPTIONIST:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case UserRole.DOCTOR:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case UserRole.ASSISTANT:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case UserRole.RECEPTIONIST:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Handle quick role change from dropdown
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Prevent changing your own role
    if (userId === currentUser?.id) {
      addNotification({ message: 'You cannot change your own role', type: NotificationType.ERROR });
      return;
    }

    try {
      const { error } = await supabase!
        .from('user_profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      addNotification({ 
        message: `Role updated successfully`, 
        type: NotificationType.SUCCESS 
      });
      
      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      addNotification({ 
        message: 'Failed to update role', 
        type: NotificationType.ERROR 
      });
    }
  };


  // Get status badge color
  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case UserStatus.INACTIVE:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case UserStatus.SUSPENDED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Handle opening the edit permissions modal
  const handleEditPermissions = (userProfile: UserProfile) => {
    setEditingPermissionsUser(userProfile);
    setCustomPermissions(userProfile.custom_permissions || []);
    setOverridePermissions(userProfile.override_permissions || false);
    setShowEditPermissionsModal(true);
  };

  // Handle toggling a permission
  const handlePermissionToggle = (permission: Permission) => {
    setCustomPermissions(prev => {
      // For all users, allow toggling of all permissions
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  // Handle automatic permission assignment
  const handleAutoAssignPermissions = (userRole: UserRole) => {
    const autoPermissions = ROLE_PERMISSIONS[userRole];
    setCustomPermissions(autoPermissions);
    addNotification({
      message: `Automatically assigned permissions for ${userRole} role`,
      type: NotificationType.INFO
    });
  };

  // Handle saving custom permissions
  const handleSaveCustomPermissions = async () => {
    if (!editingPermissionsUser) return;
    
    setIsSavingPermissions(true);
    try {
      const { error } = await supabase!
        .from('user_profiles')
        .update({ 
          custom_permissions: customPermissions,
          override_permissions: overridePermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPermissionsUser.id);

      if (error) throw error;
      
      addNotification({ 
        message: `Custom permissions updated for ${editingPermissionsUser.username}`, 
        type: NotificationType.SUCCESS 
      });
      
      setShowEditPermissionsModal(false);
      setEditingPermissionsUser(null);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error saving custom permissions:', error);
      addNotification({ 
        message: 'Failed to save custom permissions', 
        type: NotificationType.ERROR 
      });
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Get auth method badge
  const getAuthMethodBadge = (user: UserProfile) => {

    if (user.oauth_provider) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {user.oauth_provider === 'google' && (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {user.oauth_provider === 'facebook' && (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          )}
          {user.oauth_provider.charAt(0).toUpperCase() + user.oauth_provider.slice(1)}
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
        Email/Password
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage clinic users, roles, and permissions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPermissionsModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Permissions
            </button>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New User
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Search Users</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role Filter</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="ALL">All Roles</option>
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.DOCTOR}>Doctor</option>
                <option value={UserRole.ASSISTANT}>Assistant</option>
                <option value={UserRole.RECEPTIONIST}>Receptionist</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'ALL')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="ALL">All Status</option>
                <option value={UserStatus.ACTIVE}>Active</option>
                <option value={UserStatus.INACTIVE}>Inactive</option>
                <option value={UserStatus.SUSPENDED}>Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-4 mb-6`}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium">{selectedUsers.length} user(s) selected</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusChange(UserStatus.ACTIVE)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatusChange(UserStatus.INACTIVE)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkStatusChange(UserStatus.SUSPENDED)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Suspend
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Auth Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-700`}>
                {paginatedUsers.map((userProfile) => (
                  <tr key={userProfile.id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(userProfile.id)}
                        onChange={() => handleSelectUser(userProfile.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          userProfile.role === UserRole.ADMIN ? 'bg-purple-500' :
                          userProfile.role === UserRole.DOCTOR ? 'bg-blue-500' :
                          userProfile.role === UserRole.ASSISTANT ? 'bg-green-500' : 'bg-orange-500'
                        }`}>
                          {userProfile.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {userProfile.username}
                          </div>
                          {userProfile.oauth_email && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {userProfile.oauth_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAuthMethodBadge(userProfile)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={userProfile.role}
                        onChange={(e) => handleRoleChange(userProfile.id, e.target.value as UserRole)}
                        disabled={userProfile.id === currentUser?.id}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${getRoleBadgeColor(userProfile.role)} ${userProfile.id === currentUser?.id ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80'}`}
                        title={userProfile.id === currentUser?.id ? 'Cannot change your own role' : 'Click to change role'}
                      >
                        <option value={UserRole.ADMIN}>ADMIN</option>
                        <option value={UserRole.DOCTOR}>DOCTOR</option>
                        <option value={UserRole.ASSISTANT}>ASSISTANT</option>
                        <option value={UserRole.RECEPTIONIST}>RECEPTIONIST</option>
                      </select>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(userProfile.status)}`}>
                        {userProfile.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {userProfile.last_login ? new Date(userProfile.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(userProfile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(userProfile)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Edit user"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditPermissions(userProfile)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                          title="Edit permissions"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleDelete(userProfile.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Delete user"
                          disabled={userProfile.id === currentUser?.id}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                        placeholder="Enter username"
                      />
                      {formErrors.username && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                      )}
                    </div>

                    {editingUser && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value={UserStatus.ACTIVE}>Active</option>
                          <option value={UserStatus.INACTIVE}>Inactive</option>
                          <option value={UserStatus.SUSPENDED}>Suspended</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {!editingUser && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          placeholder="Enter email address"
                        />
                        {formErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Password *
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          placeholder="Enter password"
                        />
                        {formErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        setFormData({
                          ...formData,
                          role: newRole,
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value={UserRole.ADMIN}>Admin</option>
                      <option value={UserRole.DOCTOR}>Doctor</option>
                      <option value={UserRole.ASSISTANT}>Assistant</option>
                      <option value={UserRole.RECEPTIONIST}>Receptionist</option>
                    </select>
                  </div>

                  {/* Password Reset Section for Existing Users */}
                  {editingUser && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsResettingPassword(!isResettingPassword);
                          if (!isResettingPassword) {
                            setFormData({ ...formData, newPassword: '', confirmPassword: '' });
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-2"
                      >
                        <svg className={`w-4 h-4 transition-transform ${isResettingPassword ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {isResettingPassword ? 'Cancel Password Reset' : 'Reset Password'}
                      </button>

                      {isResettingPassword && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={formData.newPassword}
                              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                formErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                              } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                              placeholder="Enter new password"
                            />
                            {formErrors.newPassword && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.newPassword}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                              } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                              placeholder="Confirm new password"
                            />
                            {formErrors.confirmPassword && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OAuth Account Linking Section */}
                  {editingUser && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-4">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-4">
                        OAuth Account Linking
                      </h4>
                      
                      {/* Linked OAuth Accounts */}
                      <div className="space-y-3 mb-4">
                        {editingUser.oauth_provider ? (
                          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-3">
                              {editingUser.oauth_provider === 'google' && (
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                              )}
                              {editingUser.oauth_provider === 'facebook' && (
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {editingUser.oauth_provider.charAt(0).toUpperCase() + editingUser.oauth_provider.slice(1)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {editingUser.oauth_email}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUnlinkOAuth(editingUser.id, editingUser.oauth_provider!)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                            >
                              Unlink
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No OAuth account linked. Users can link their accounts from their profile settings.
                          </p>
                        )}
                      </div>
                    </div>
                  )}



                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold">Role Permissions</h3>
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-8">
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]: [string, Permission[]]) => (
                    <div key={category} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                      <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{category}</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Permission
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Admin
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Doctor
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Assistant
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Receptionist
                              </th>
                            </tr>
                          </thead>
                          <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-700`}>
                            {permissions.map((permission: Permission) => (
                              <tr key={permission} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  {getPermissionDisplayName(permission)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {ROLE_PERMISSIONS[UserRole.DOCTOR].includes(permission) ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-900/30">
                                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {ROLE_PERMISSIONS[UserRole.ASSISTANT].includes(permission) ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-900/30">
                                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {ROLE_PERMISSIONS[UserRole.RECEPTIONIST].includes(permission) ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-900/30">
                                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPermissionsModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Permissions Modal */}
        {showEditPermissionsModal && editingPermissionsUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold">Edit User Permissions</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      User: <span className="font-medium">{editingPermissionsUser.username}</span> | 
                      Role: <span className="font-medium">{editingPermissionsUser.role}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEditPermissionsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> Custom permissions are added to the user's role-based permissions. 
                    Check the boxes below to grant additional permissions beyond what the role normally allows.
                  </p>
                </div>

                {/* Override Mode Toggle */}
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-300">
                        <input
                          type="checkbox"
                          checked={overridePermissions}
                          onChange={(e) => setOverridePermissions(e.target.checked)}
                          className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        Override Role Permissions
                      </label>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 ml-6">
                        When enabled, the user will only have the permissions you select below, ignoring their role's default permissions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]: [string, Permission[]]) => (
                    <div key={category} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                      <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissions.map((permission: Permission) => {
                          const isRolePermission = ROLE_PERMISSIONS[editingPermissionsUser.role]?.includes(permission) && editingPermissionsUser.role !== UserRole.ADMIN;
                          const isCustomPermission = customPermissions.includes(permission);
                          
                          // When override mode is enabled, only check custom permissions
                          // When override mode is disabled, check both role and custom permissions
                          const isChecked = overridePermissions ? isCustomPermission : (isRolePermission || isCustomPermission);
                          
                          // When override mode is enabled, all checkboxes are enabled
                          // When override mode is disabled, role permissions are disabled
                          const isDisabled = !overridePermissions && isRolePermission && !isCustomPermission;
                          
                          return (
                            <div 
                              key={permission} 
                              className={`flex items-center p-3 rounded-lg border ${
                                isRolePermission && !overridePermissions
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                id={`permission-${permission}`}
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => handlePermissionToggle(permission)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
                              />
                              <label 
                                htmlFor={`permission-${permission}`}
                                className={`ml-3 text-sm font-medium ${
                                  isRolePermission && !overridePermissions
                                    ? 'text-green-800 dark:text-green-300' 
                                    : 'text-gray-900 dark:text-white'
                                }`}
                              >
                                {getPermissionDisplayName(permission)}
                                {isRolePermission && (
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    (from role)
                                  </span>
                                )}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditPermissionsModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomPermissions}
                    disabled={isSavingPermissions}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingPermissions ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />

      </div>
    </div>
  );
};

export default UserManagement;
