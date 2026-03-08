import { supabase } from '../supabaseClient';

let cachedBranchId: string | null = null;
let branchSessionRpcState: 'unknown' | 'available' | 'missing' = 'unknown';
let warnedMissingRpc = false;

const normalizeBranchId = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isMissingRpcError = (error: any, functionName: string): boolean => {
  if (!error) return false;
  const code = String(error.code || '').toUpperCase();
  const message = String(error.message || '').toLowerCase();
  const target = functionName.toLowerCase();
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    message.includes('could not find the function') ||
    (message.includes('function') && message.includes(target) && message.includes('does not exist'))
  );
};

export const applyBranchSession = async (branchId?: string | null, force = false): Promise<void> => {
  if (!supabase) return;

  const normalized = normalizeBranchId(branchId);
  if (!force && normalized === cachedBranchId) {
    return;
  }

  // Graceful fallback for environments where branch RPC migrations are not applied yet.
  if (branchSessionRpcState === 'missing') {
    cachedBranchId = normalized;
    return;
  }

  if (!normalized) {
    const { error } = await supabase.rpc('clear_current_branch');
    if (error) {
      if (isMissingRpcError(error, 'clear_current_branch')) {
        branchSessionRpcState = 'missing';
        cachedBranchId = null;
        if (!warnedMissingRpc) {
          warnedMissingRpc = true;
          console.warn('Branch session RPC is missing. Apply DB migration 029_branch_level_rls_session_scope.sql.');
        }
        return;
      }
      throw new Error(`Failed to clear branch session: ${error.message}`);
    }
    branchSessionRpcState = 'available';
    cachedBranchId = null;
    return;
  }

  // Preferred unambiguous RPC (avoids overloaded function ambiguity in PostgREST).
  const preferred = await supabase.rpc('set_current_branch_uuid', { bid: normalized });
  if (!preferred.error) {
    branchSessionRpcState = 'available';
    cachedBranchId = normalized;
    return;
  }

  const preferredMissing = isMissingRpcError(preferred.error, 'set_current_branch_uuid');
  if (!preferredMissing) {
    throw new Error(`Failed to set branch session: ${preferred.error.message}`);
  }

  // Backward-compatible fallback for environments without migration 040.
  const fallback = await supabase.rpc('set_current_branch', { bid: normalized });
  if (fallback.error) {
    const message = String(fallback.error.message || '').toLowerCase();
    if (isMissingRpcError(fallback.error, 'set_current_branch') || message.includes('could not choose the best candidate function between')) {
      branchSessionRpcState = 'missing';
      cachedBranchId = normalized;
      if (!warnedMissingRpc) {
        warnedMissingRpc = true;
        console.warn(
          'Branch session RPC is missing/ambiguous. Apply DB migration 040_add_unambiguous_set_current_branch_rpc.sql.',
        );
      }
      return;
    }
    throw new Error(`Failed to set branch session: ${fallback.error.message}`);
  }

  branchSessionRpcState = 'available';
  cachedBranchId = normalized;
};

export const getCachedBranchSessionId = (): string | null => cachedBranchId;

export const resetBranchSessionCache = (): void => {
  cachedBranchId = null;
};
