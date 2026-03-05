/**
 * Tenant & Subscription Service
 * Handles multi-tenancy operations for the clinic management system
 * 
 * Features:
 * - Tenant CRUD operations
 * - Subscription management
 * - Trial period handling
 * - Resource limits checking
 */

import { supabase } from '../supabaseClient';
import type { Tenant, SubscriptionPlan, TenantInfo, CreateTenantInput, ServiceResponse } from './types';

// ============================================================================
// TENANT OPERATIONS
// ============================================================================

export const tenantService = {
  /**
   * Create a new tenant with trial period
   */
  async createTenant(input: CreateTenantInput): Promise<ServiceResponse<{ tenant_id: string; user_id: string }>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(input.slug)) {
        return { success: false, error: 'Clinic URL can only contain lowercase letters, numbers, and dashes' };
      }

      const { data, error } = await supabase.rpc('create_tenant_for_current_user', {
        p_name: input.name,
        p_slug: input.slug,
        p_email: input.email || null,
        p_phone: input.phone || null,
      });

      if (error) {
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.tenant_id) {
        return { success: false, error: 'No tenant id returned from create_tenant_for_current_user' };
      }

      await supabase.rpc('link_current_user_tenant_context', {
        p_preferred_tenant_id: String(row.tenant_id),
      });

      return {
        success: true,
        data: {
          tenant_id: String(row.tenant_id),
          user_id: row.user_id ? String(row.user_id) : '',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create clinic',
      };
    }
  },

  /**
   * Get current tenant info
   */
  async getTenantInfo(tenantId: string): Promise<ServiceResponse<TenantInfo>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .rpc('get_tenant_info', { p_tenant_id: tenantId });

      if (error) throw error;

      return { success: true, data: data[0] as TenantInfo };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get tenant info',
      };
    }
  },

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<ServiceResponse<Tenant>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      return { success: true, data: data as Tenant };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get tenant',
      };
    }
  },

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<ServiceResponse<Tenant>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      return { success: true, data: data as Tenant };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Clinic not found',
      };
    }
  },

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<ServiceResponse<Tenant>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase.rpc('update_tenant_secure', {
        p_tenant_id: tenantId,
        p_name: updates.name ?? null,
        p_email: updates.email ?? null,
        p_phone: updates.phone ?? null,
        p_address: updates.address ?? null,
        p_description: updates.description ?? null,
        p_logo_url: updates.logo_url ?? null,
        p_primary_color: updates.primary_color ?? null,
        p_secondary_color: updates.secondary_color ?? null,
        p_brand_name: updates.brand_name ?? null,
        p_settings: updates.settings ?? null,
        p_features: updates.features ?? null,
        p_payment_method: updates.payment_method ?? null,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      return { success: true, data: row as Tenant };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update tenant',
      };
    }
  },

  /**
   * Check if trial is valid
   */
  async isTrialValid(tenantId: string): Promise<boolean> {
    try {
      if (!supabase) return false;

      const { data, error } = await supabase
        .rpc('is_trial_valid', { p_tenant_id: tenantId });

      if (error) return false;
      return data || false;
    } catch {
      return false;
    }
  },

  /**
   * Get remaining trial days
   */
  async getTrialDaysRemaining(tenantId: string): Promise<number> {
    try {
      if (!supabase) return 0;

      const { data, error } = await supabase
        .rpc('get_trial_days_remaining', { p_tenant_id: tenantId });

      if (error) return 0;
      return data || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Check resource limits
   */
  async checkLimits(tenantId: string, resource: 'users' | 'patients'): Promise<{
    allowed: boolean;
    current: number;
    max: number;
    message?: string;
  }> {
    try {
      if (!supabase) {
        return { allowed: false, current: 0, max: 0, message: 'Database not configured' };
      }

      const { data, error } = await supabase
        .rpc('check_limits', { p_tenant_id: tenantId, p_resource: resource });

      if (error) {
        return { allowed: false, current: 0, max: 0, message: error.message };
      }

      if (data && data.length > 0) {
        return {
          allowed: data[0].allowed,
          current: data[0].current_count,
          max: data[0].max_limit,
          message: data[0].message,
        };
      }

      return { allowed: true, current: 0, max: 0 };
    } catch (error: any) {
      return { allowed: false, current: 0, max: 0, message: error.message };
    }
  },
};

// ============================================================================
// SUBSCRIPTION PLAN OPERATIONS
// ============================================================================

export const subscriptionService = {
  /**
   * Get all subscription plans
   */
  async getPlans(): Promise<ServiceResponse<SubscriptionPlan[]>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return { success: true, data: data as SubscriptionPlan[] };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get subscription plans',
      };
    }
  },

  /**
   * Get plan by slug
   */
  async getPlanBySlug(slug: string): Promise<ServiceResponse<SubscriptionPlan>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      return { success: true, data: data as SubscriptionPlan };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Plan not found',
      };
    }
  },

  /**
   * Activate subscription
   */
  async activateSubscription(tenantId: string, planSlug: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .rpc('activate_subscription', {
          p_tenant_id: tenantId,
          p_plan_slug: planSlug,
        });

      if (error) throw error;

      return { success: true, data: data };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to activate subscription',
      };
    }
  },
};

// ============================================================================
// INVITATION OPERATIONS
// ============================================================================

export const invitationService = {
  /**
   * Create invitation to join clinic
   */
  async createInvitation(
    tenantId: string, 
    email: string, 
    role: string = 'DOCTOR',
    invitedBy: string
  ): Promise<ServiceResponse<{ token: string }>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .rpc('create_tenant_invitation_secure', {
          p_tenant_id: tenantId,
          p_email: email,
          p_role: role,
          p_expires_in_days: 7,
        })
      ;

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.token) {
        return { success: false, error: 'No token returned from create_tenant_invitation_secure' };
      }

      return { success: true, data: { token: String(row.token) } };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create invitation',
      };
    }
  },

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase.rpc('accept_tenant_invitation_secure', {
        p_token: token,
      });

      if (error) {
        return { success: false, error: error.message || 'Invalid invitation' };
      }

      const rows = Array.isArray(data) ? data : (data ? [data] : []);
      if (rows.length === 0) {
        return { success: false, error: 'Invalid invitation' };
      }

      // Note: User linking to tenant should be done by updating the user record
      // The frontend should handle this after successful login

      return { success: true, data: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to accept invitation',
      };
    }
  },

  /**
   * Get pending invitations for current user
   */
  async getPendingInvitations(email: string): Promise<ServiceResponse<any[]>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('tenant_invitations')
        .select(`
          *,
          tenants!inner(name, slug, logo_url)
        `)
        .eq('email', email)
        .eq('status', 'PENDING')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get invitations',
      };
    }
  },
};
