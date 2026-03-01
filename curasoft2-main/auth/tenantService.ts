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

      // Check if slug is available
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', input.slug)
        .single();

      if (existingTenant) {
        return { success: false, error: 'This clinic URL is already taken. Please choose another name.' };
      }

      // Calculate trial end date (14 days from now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: input.name,
          slug: input.slug,
          email: input.email,
          phone: input.phone || '',
          subscription_status: 'TRIAL',
          subscription_plan: 'trial',
          trial_start_date: new Date().toISOString().split('T')[0],
          trial_end_date: trialEndDate.toISOString().split('T')[0],
          max_users: 2,
          max_patients: 100,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Note: User creation should be handled by Supabase Auth
      // The frontend will handle creating the auth user and we'll link it here
      
      return { 
        success: true, 
        data: { 
          tenant_id: tenant.id, 
          user_id: '' // Will be filled after user creation
        } 
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

      const { data, error } = await supabase
        .from('tenants')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as Tenant };
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

      // Generate invitation token
      const token = crypto.randomUUID();
      
      // Set expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('tenant_invitations')
        .insert({
          tenant_id: tenantId,
          email: email,
          role: role,
          invited_by: invitedBy,
          token: token,
          expires_at: expiresAt.toISOString(),
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: { token: data.token } };
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

      // Get invitation
      const { data: invitation, error: getError } = await supabase
        .from('tenant_invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (getError || !invitation) {
        return { success: false, error: 'Invalid invitation' };
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        return { success: false, error: 'Invitation has expired' };
      }

      // Check if already accepted
      if (invitation.status !== 'PENDING') {
        return { success: false, error: 'Invitation already used or cancelled' };
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('tenant_invitations')
        .update({ status: 'ACCEPTED' })
        .eq('token', token);

      if (updateError) throw updateError;

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
