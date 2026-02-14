import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import bcrypt from 'bcryptjs';

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

/**
 * Validates password strength
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }

  // Check for at least one number and one letter
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  if (!hasNumber || !hasLetter) {
    return { isValid: false, error: 'Password must contain at least one letter and one number' };
  }

  return { isValid: true };
};

/**
 * Authenticates internal clinic user
 */
export const authenticateInternalUser = async (
  username: string,
  password: string
): Promise<AuthResult> => {
  try {
    console.log('AuthUtils: Authenticating internal user:', username);

    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    // Check if user exists (case-insensitive)
    console.log('AuthUtils: Checking for existing user with case-insensitive match');
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('username', username.toLowerCase())
      .single();

    if (checkError) {
      console.log('AuthUtils: Check error:', checkError);
      if (checkError.code === 'PGRST116') {
        console.log('AuthUtils: No user found, checking if any users exist for demo fallback');
        // Check if any users exist
        const { data: allUsers, error: countError } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);

        if (countError) {
          console.error('AuthUtils: Error checking user count:', countError);
          throw countError;
        }

        if (!allUsers || allUsers.length === 0) {
          console.log('AuthUtils: No users exist, creating demo user');
          const demoResult = await createInternalUser('demo', '123', 'ADMIN');
          if (demoResult.success && demoResult.user) {
            console.log('AuthUtils: Demo user created successfully');
            if (username.toLowerCase() === 'demo') {
              const isValidPassword = password === '123';
              console.log('AuthUtils: Demo login attempt, password valid:', isValidPassword);
              if (isValidPassword) {
                return { success: true, user: demoResult.user };
              } else {
                return { success: false, error: 'Invalid password for demo user' };
              }
            } else {
              return { success: false, error: 'Username not found. Demo user created with username "demo" and password "123"' };
            }
          } else {
            console.error('AuthUtils: Failed to create demo user:', demoResult.error);
            return { success: false, error: 'Failed to create demo user' };
          }
        } else {
          return { success: false, error: 'Username not found' };
        }
      }
      throw checkError;
    }

    if (!existingUser) {
      console.log('AuthUtils: No existing user found');
      return { success: false, error: 'Username not found' };
    }

    console.log('AuthUtils: User found:', existingUser.username);

    // For internal users, we verify password against hashed password
    // Users must have password_hash field set during registration
    if (!existingUser.password_hash) {
      console.log('AuthUtils: User has no password_hash set');
      return { success: false, error: 'Account not properly configured. Please contact administrator.' };
    }

    const isValidPassword = await verifyPassword(password, existingUser.password_hash);
    console.log('AuthUtils: Password verification result:', isValidPassword);

    if (!isValidPassword) {
      return { success: false, error: 'Invalid username or password' };
    }

    return { success: true, user: existingUser };
  } catch (error: any) {
    console.error('AuthUtils: Authentication error:', error);
    return { success: false, error: error.message || 'Authentication failed' };
  }
};

/**
 * Creates a new internal user
 */
export const createInternalUser = async (
  username: string,
  password: string,
  role: string = 'ADMIN'
): Promise<AuthResult> => {
  try {
    console.log('AuthUtils: Creating internal user:', username);

    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      console.log('AuthUtils: Password validation failed:', passwordValidation.error);
      return { success: false, error: passwordValidation.error };
    }

    // Check if username already exists (case-insensitive)
    console.log('AuthUtils: Checking if username already exists (case-insensitive)');
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('username', username.toLowerCase())
      .single();

    if (existingUser) {
      console.log('AuthUtils: Username already exists');
      return { success: false, error: 'Username already exists' };
    }

    console.log('AuthUtils: Creating new user with role:', role);

    // Hash the password before storing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('AuthUtils: Password hashed successfully');

    // Create new user with hashed password
    const { data: newUser, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        username,
        role,
        password_hash: passwordHash
      })
      .select()
      .single();

    if (insertError) {
      console.error('AuthUtils: Insert error:', insertError);
      throw insertError;
    }

    console.log('AuthUtils: User created successfully:', newUser.username);
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('AuthUtils: User creation error:', error);
    return { success: false, error: error.message || 'Failed to create user' };
  }
};

/**
 * Sets or updates password for an existing user
 */
export const setUserPassword = async (
  username: string,
  newPassword: string
): Promise<AuthResult> => {
  try {
    console.log('AuthUtils: Setting password for user:', username);

    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      console.log('AuthUtils: Password validation failed:', passwordValidation.error);
      return { success: false, error: passwordValidation.error };
    }

    // Find user by username
    const { data: existingUser, error: findError } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('username', username.toLowerCase())
      .single();

    if (findError) {
      console.error('AuthUtils: User not found:', findError);
      return { success: false, error: 'User not found' };
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    console.log('AuthUtils: Password hashed successfully');

    // Update user's password_hash
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ password_hash: passwordHash })
      .eq('id', existingUser.id);

    if (updateError) {
      console.error('AuthUtils: Update error:', updateError);
      throw updateError;
    }

    console.log('AuthUtils: Password updated successfully for user:', username);
    return { success: true };
  } catch (error: any) {
    console.error('AuthUtils: Password update error:', error);
    return { success: false, error: error.message || 'Failed to update password' };
  }
};

/**
 * Verifies a password against a bcrypt hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

/**
 * Hashes a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Checks if user has permission
 */
export const hasPermission = (userProfile: UserProfile | null, permission: string): boolean => {
  if (!userProfile) return false;
  // All users now have full access
  return true;
};

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  INTERNAL_EXPIRY_HOURS: 24,
  SUPABASE_REFRESH_INTERVAL_MINUTES: 30,
  WARNING_BEFORE_EXPIRY_MINUTES: 5,
  PERSISTENCE_KEY: 'session_persist',
  STORAGE_KEY: 'user',
};

/**
 * Gets user session expiry time
 */
export const getSessionExpiry = (hours: number = SESSION_CONFIG.INTERNAL_EXPIRY_HOURS): number => {
  return Date.now() + (hours * 60 * 60 * 1000);
};

/**
 * Checks if session is expired
 */
export const isSessionExpired = (loginTime: string, hours: number = SESSION_CONFIG.INTERNAL_EXPIRY_HOURS): boolean => {
  const sessionExpiry = new Date(loginTime).getTime() + (hours * 60 * 60 * 1000);
  return Date.now() > sessionExpiry;
};

/**
 * Gets time until session expiry in milliseconds
 */
export const getTimeUntilExpiry = (loginTime: string, hours: number = SESSION_CONFIG.INTERNAL_EXPIRY_HOURS): number => {
  const sessionExpiry = new Date(loginTime).getTime() + (hours * 60 * 60 * 1000);
  return Math.max(0, sessionExpiry - Date.now());
};

/**
 * Checks if session expiry warning should be shown
 */
export const shouldShowExpiryWarning = (loginTime: string, hours: number = SESSION_CONFIG.INTERNAL_EXPIRY_HOURS): boolean => {
  const timeUntilExpiry = getTimeUntilExpiry(loginTime, hours);
  const warningTime = SESSION_CONFIG.WARNING_BEFORE_EXPIRY_MINUTES * 60 * 1000;
  return timeUntilExpiry <= warningTime && timeUntilExpiry > 0;
};

/**
 * Refreshes internal user session by updating login time
 */
export const refreshInternalSession = (): boolean => {
  try {
    const storedUser = sessionStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
    if (!storedUser) return false;

    const userData = JSON.parse(storedUser);
    userData.loginTime = new Date().toISOString();

    sessionStorage.setItem(SESSION_CONFIG.STORAGE_KEY, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Failed to refresh internal session:', error);
    return false;
  }
};

/**
 * Persists session to localStorage for longer retention
 */
export const persistSession = (): void => {
  console.log('authUtils: persistSession called');
  try {
    const sessionData = sessionStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
    console.log('authUtils: sessionData to persist:', sessionData);
    if (sessionData) {
      localStorage.setItem(SESSION_CONFIG.PERSISTENCE_KEY, sessionData);
      console.log('authUtils: session persisted to localStorage');
    } else {
      console.log('authUtils: no sessionData in sessionStorage');
    }
  } catch (error) {
    console.error('Failed to persist session:', error);
  }
};

/**
 * Restores persisted session from localStorage
 */
export const restorePersistedSession = (): boolean => {
  try {
    const persistedData = localStorage.getItem(SESSION_CONFIG.PERSISTENCE_KEY);
    if (persistedData) {
      const userData = JSON.parse(persistedData);

      // Check if persisted session is still valid
      if (!isSessionExpired(userData.loginTime)) {
        sessionStorage.setItem(SESSION_CONFIG.STORAGE_KEY, persistedData);
        return true;
      } else {
        // Clear expired persisted session
        localStorage.removeItem(SESSION_CONFIG.PERSISTENCE_KEY);
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to restore persisted session:', error);
    return false;
  }
};

/**
 * Clears persisted session
 */
export const clearPersistedSession = (): void => {
  try {
    localStorage.removeItem(SESSION_CONFIG.PERSISTENCE_KEY);
  } catch (error) {
    console.error('Failed to clear persisted session:', error);
  }
};
