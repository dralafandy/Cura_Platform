import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { UserRole, UserStatus } from '../types';

// Reusable Input Field Component
interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  error,
  showPasswordToggle = false,
  onTogglePassword,
  icon,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label 
        htmlFor={id} 
        className="block text-[13px] font-semibold tracking-wide text-slate-700 dark:text-slate-200 transition-colors"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full py-3 bg-white dark:bg-slate-900/70 border rounded-xl text-sm text-slate-800 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200
            ${icon ? 'pl-10' : 'px-4'}
            ${isFocused 
              ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-cyan-900/50 shadow-sm' 
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }
            ${error ? 'border-red-300 ring-2 ring-red-100 dark:border-red-500/70 dark:ring-red-900/40' : ''}
            ${showPasswordToggle ? 'pr-12' : ''}
          `}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label={type === 'password' ? 'Show password' : 'Hide password'}
          >
            {type === 'password' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

// Error Alert Component
interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  return (
    <div 
      className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none"
      role="alert"
    >
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <span className="flex-1 text-sm">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors"
          aria-label="Dismiss error"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

// OAuth Button Component
interface OAuthButtonProps {
  provider: 'google' | 'facebook';
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  label: string;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({ 
  provider, 
  onClick, 
  disabled, 
  isLoading, 
  label 
}) => {
  const icons = {
    google: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    facebook: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        w-full inline-flex justify-center items-center px-4 py-3 
        border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/70 text-sm font-medium text-slate-700 dark:text-slate-200
        transition-all duration-200
        ${disabled || isLoading 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-cyan-500 dark:focus:ring-offset-slate-900
      `}
      aria-label={`Sign in with ${provider}`}
    >
      {isLoading ? (
        <svg className="animate-spin motion-reduce:animate-none h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {icons[provider]}
          <span className="ml-2">{label}</span>
        </>
      )}
    </button>
  );
};

// Admin Setup Key
const ADMIN_SETUP_KEY = 'curasoft-admin-2024';

const isTenantSubscriptionValid = async (tenantId?: string | null): Promise<boolean> => {
  if (!tenantId || !supabase) return true;

  try {
    const { data, error } = await supabase
      .rpc('get_tenant_info', { p_tenant_id: tenantId });

    if (!error && data && data[0]) {
      return data[0].is_subscription_valid === true;
    }
  } catch (err) {
    console.error('Tenant RPC validation error:', err);
  }

  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('subscription_status, trial_end_date, subscription_end_date')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) return true;

    const today = new Date().toISOString().split('T')[0];
    if (tenant.subscription_status === 'TRIAL') {
      return !!tenant.trial_end_date && tenant.trial_end_date >= today;
    }
    if (tenant.subscription_status === 'ACTIVE') {
      return !tenant.subscription_end_date || tenant.subscription_end_date >= today;
    }
    return false;
  } catch (err) {
    console.error('Tenant fallback validation error:', err);
    return true;
  }
};

interface LoginPageProps {
  onRequestClinicRegistration?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onRequestClinicRegistration }) => {
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Registration state
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [adminSetupKey, setAdminSetupKey] = useState('');
  const [showAdminKeyField, setShowAdminKeyField] = useState(false);
  
  const { loginWithGoogle, loginWithFacebook } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Supabase Auth session changes
  useEffect(() => {
    if (!supabase) return;
    
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Create or update user profile
        await handleAuthSession(session);
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  // Handle auth session - create/update user profile
  const handleAuthSession = async (session: any) => {
    try {
      const user = session.user;
      
      // Check if user profile exists
      const { data: existingProfile } = await supabase!
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create new user profile
        const { error: profileError } = await supabase!
          .from('user_profiles')
          .insert({
            id: user.id,
            auth_id: user.id,
            email: user.email,
            username: user.email?.split('@')[0] || 'user',
            role: 'DOCTOR',
            status: 'ACTIVE',
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      // Set session in storage
      const { data: profile } = await supabase!
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        const subscriptionValid = await isTenantSubscriptionValid(profile.tenant_id);
        if (!subscriptionValid) {
          await supabase.auth.signOut();
          sessionStorage.removeItem('clinic_session');
          setError('انتهت الفترة التجريبية او الاشتراك. يرجى ترقية الخطة للمتابعة.');
          return;
        }

        sessionStorage.setItem('clinic_session', JSON.stringify({
          user: profile,
          loginTime: new Date().toISOString(),
        }));
        window.location.reload();
      }
    } catch (err) {
      console.error('Error handling auth session:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Email is required');
      }
      if (!password) {
        throw new Error('Password is required');
      }

      if (!supabase) {
        throw new Error('Database not configured');
      }

      // Use Supabase Auth for login
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Invalid email or password');
      }

      if (!data.user) {
        throw new Error('Login failed. Please try again.');
      }

      setError(null);
      // Session will be handled by onAuthStateChange

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setOauthLoading('google');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      const errorMessage = err.message || '';
      if (errorMessage.includes('provider is not enabled') || 
          errorMessage.includes('Unsupported provider') ||
          errorMessage.includes('not configured')) {
        setError('Google login is not configured. Please contact your administrator to enable Google OAuth in Supabase dashboard.');
      } else if (errorMessage.includes('cancelled')) {
        setError('Google login was cancelled.');
      } else {
        setError(`Google login failed: ${errorMessage}`);
      }
      setOauthLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    setError(null);
    setOauthLoading('facebook');
    try {
      await loginWithFacebook();
    } catch (err: any) {
      console.error('Facebook login error:', err);
      const errorMessage = err.message || '';
      if (errorMessage.includes('provider is not enabled') || 
          errorMessage.includes('Unsupported provider') ||
          errorMessage.includes('not configured')) {
        setError('Facebook login is not configured. Please contact your administrator to enable Facebook OAuth in Supabase dashboard.');
      } else if (errorMessage.includes('cancelled')) {
        setError('Facebook login was cancelled.');
      } else {
        setError(`Facebook login failed: ${errorMessage}`);
      }
      setOauthLoading(null);
    }
  };

  // Handle registration with Supabase Auth
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRegSuccess(null);
    setRegLoading(true);

    try {
      // Validation
      if (!regEmail.trim()) {
        throw new Error('Email is required');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
        throw new Error('Please enter a valid email address');
      }
      if (!regPassword) {
        throw new Error('Password is required');
      }
      if (regPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (regPassword !== regConfirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (!supabase) {
        throw new Error('Database not configured');
      }

      // Check if admin key is valid
      let isAdmin = false;
      if (adminSetupKey.trim() === ADMIN_SETUP_KEY) {
        isAdmin = true;
      } else if (adminSetupKey.trim()) {
        throw new Error('Invalid admin setup key');
      }

      // Check if email already exists in profiles (client-safe)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', regEmail.toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        throw new Error('Email already registered. Please login instead.');
      }

      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: regEmail.toLowerCase(),
        password: regPassword,
        options: {
          data: {
            username: regEmail.split('@')[0],
            role: isAdmin ? 'ADMIN' : 'DOCTOR',
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message || 'Registration failed');
      }

      if (!data.user) {
        throw new Error('Registration failed. Please try again.');
      }

      // Update user role in user_profiles after creation
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          role: isAdmin ? 'ADMIN' : 'DOCTOR',
          username: regEmail.split('@')[0],
        })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Error updating user role:', profileError);
      }

      // Registration successful
      setRegSuccess('Account created! Please check your email to verify your account, then login.');
      
      // Clear form
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setAdminSetupKey('');
      
      // Switch to login mode after 3 seconds
      setTimeout(() => {
        setIsRegisterMode(false);
        setRegSuccess(null);
      }, 3000);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  // Toggle between login and register modes
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError(null);
    setRegSuccess(null);
  };

  // JSX omitted for brevity - use the original LoginPage.tsx for the UI
  // This is just the logic part for Supabase Auth migration
  
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Simplified UI for demonstration */}
      <div className="w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {isRegisterMode ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {isRegisterMode ? 'Register for a new account' : 'Sign in to your account'}
            </p>
          </div>

          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
          {regSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-lg mb-4">
              {regSuccess}
            </div>
          )}

          {!isRegisterMode ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <InputField
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                showPasswordToggle
                onTogglePassword={() => setShowPassword(!showPassword)}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 10-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                }
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <InputField
                id="reg-email"
                label="Email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
              <InputField
                id="reg-password"
                label="Password"
                type={regShowPassword ? 'text' : 'password'}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create a password (min 6 characters)"
                autoComplete="new-password"
                required
                showPasswordToggle
                onTogglePassword={() => setRegShowPassword(!regShowPassword)}
              />
              <InputField
                id="reg-confirm-password"
                label="Confirm Password"
                type={regShowPassword ? 'text' : 'password'}
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAdminKeyField(!showAdminKeyField)}
                  className="text-sm text-cyan-600 dark:text-cyan-400"
                >
                  {showAdminKeyField ? 'Hide' : 'Register as Admin'}
                </button>
              </div>
              {showAdminKeyField && (
                <InputField
                  id="admin-key"
                  label="Admin Setup Key"
                  type="text"
                  value={adminSetupKey}
                  onChange={(e) => setAdminSetupKey(e.target.value)}
                  placeholder="Enter admin key"
                />
              )}
              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {regLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              {isRegisterMode ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
            {onRequestClinicRegistration && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={onRequestClinicRegistration}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Create a new clinic (14-day trial)
                </button>
              </div>
            )}
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-900 text-slate-500">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <OAuthButton
              provider="google"
              onClick={handleGoogleLogin}
              disabled={!!oauthLoading}
              isLoading={oauthLoading === 'google'}
              label="Google"
            />
            <OAuthButton
              provider="facebook"
              onClick={handleFacebookLogin}
              disabled={!!oauthLoading}
              isLoading={oauthLoading === 'facebook'}
              label="Facebook"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
