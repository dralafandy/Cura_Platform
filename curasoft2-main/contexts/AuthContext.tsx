/**
 * AuthContext - Re-exports from auth/AuthContext for backward compatibility
 * 
 * This file re-exports all auth functionality from auth/AuthContext.tsx
 * to maintain backward compatibility with existing imports.
 * 
 * The auth/AuthContext.tsx includes:
 * - Multi-clinic/branch support
 * - Enhanced session management
 * - Permission checking
 * - Clinic switching features
 */

export { AuthProvider, useAuth } from '../auth/AuthContext';
