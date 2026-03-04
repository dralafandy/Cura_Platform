import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

type AuthView = 'login' | 'register' | 'forgot' | 'reset';

interface LoginPageProps {
  onRequestClinicRegistration?: () => void;
  forceRecoveryMode?: boolean;
}

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}

const getRecoveryModeFromUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.toLowerCase();
  const query = window.location.search.toLowerCase();
  return hash.includes('type=recovery') || query.includes('type=recovery');
};

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isStrongPassword = (value: string): boolean => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  icon,
  showPasswordToggle = false,
  onTogglePassword,
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-cyan-900/40 ${
            icon ? 'pl-10' : ''
          } ${showPasswordToggle ? 'pr-12' : ''}`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label={type === 'password' ? 'Show password' : 'Hide password'}
          >
            {type === 'password' ? 'Show' : 'Hide'}
          </button>
        )}
      </div>
    </div>
  );
};

const Alert: React.FC<{ tone: 'error' | 'success'; message: string }> = ({ tone, message }) => {
  const classes =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300';

  return <div className={`rounded-xl border px-4 py-3 text-sm ${classes}`}>{message}</div>;
};

const LoginPage: React.FC<LoginPageProps> = ({ onRequestClinicRegistration, forceRecoveryMode = false }) => {
  const defaultView = useMemo<AuthView>(() => {
    if (forceRecoveryMode || getRecoveryModeFromUrl()) return 'reset';
    return 'login';
  }, [forceRecoveryMode]);

  const [view, setView] = useState<AuthView>(defaultView);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [loginIdentity, setLoginIdentity] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    if (forceRecoveryMode || getRecoveryModeFromUrl()) {
      setView('reset');
      setError(null);
      setSuccess('Recovery link verified. Set your new password.');
    }
  }, [forceRecoveryMode]);

  const switchView = (nextView: AuthView): void => {
    setView(nextView);
    setError(null);
    setSuccess(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoginLoading(true);
    try {
      if (!loginIdentity.trim()) throw new Error('Email or username is required');
      if (!loginPassword) throw new Error('Password is required');

      await login({
        username: loginIdentity.trim(),
        password: loginPassword,
      });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setRegisterLoading(true);
    try {
      if (!regEmail.trim()) throw new Error('Email is required');
      if (!isValidEmail(regEmail.trim())) throw new Error('Please enter a valid email address');
      if (!isStrongPassword(regPassword)) {
        throw new Error('Password must be at least 8 characters and include uppercase, lowercase, and number');
      }
      if (regPassword !== regConfirmPassword) throw new Error('Passwords do not match');
      if (!supabase) throw new Error('Database not configured');

      const normalizedEmail = regEmail.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: regPassword,
        options: {
          data: {
            username: normalizedEmail.split('@')[0],
          },
        },
      });

      if (signUpError) throw new Error(signUpError.message || 'Registration failed');
      if (!data.user) throw new Error('Registration failed. Please try again.');

      setSuccess('Account created. Check your email to verify your account, then sign in.');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setTimeout(() => {
        switchView('login');
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setForgotLoading(true);
    try {
      if (!supabase) throw new Error('Database not configured');
      if (!forgotEmail.trim()) throw new Error('Email is required');
      if (!isValidEmail(forgotEmail.trim())) throw new Error('Please enter a valid email address');

      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
        redirectTo,
      });
      if (resetError) throw new Error(resetError.message || 'Unable to send reset link');

      setSuccess('Password reset link sent. Check your email inbox and spam folder.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset link');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setResetLoading(true);
    try {
      if (!supabase) throw new Error('Database not configured');
      if (!isStrongPassword(newPassword)) {
        throw new Error('Password must be at least 8 characters and include uppercase, lowercase, and number');
      }
      if (newPassword !== confirmNewPassword) throw new Error('Passwords do not match');

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw new Error(updateError.message || 'Failed to update password');

      await supabase.auth.signOut();
      window.history.replaceState({}, document.title, window.location.pathname);

      setNewPassword('');
      setConfirmNewPassword('');
      setSuccess('Password updated successfully. You can sign in with your new password.');
      setView('login');
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const titleByView: Record<AuthView, string> = {
    login: 'Welcome back',
    register: 'Create your account',
    forgot: 'Forgot your password?',
    reset: 'Set a new password',
  };

  const subtitleByView: Record<AuthView, string> = {
    login: 'Secure access for your clinic workspace',
    register: 'Start your clinic workflow in a few steps',
    forgot: 'Enter your email and we will send a reset link',
    reset: 'Choose a strong password for your account',
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-emerald-50 to-cyan-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-800/20" />
        <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-cyan-300/40 blur-3xl dark:bg-cyan-800/20" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-700/10" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-2">
          <section className="hidden rounded-[2rem] border border-white/40 bg-slate-900 p-10 text-slate-100 shadow-2xl lg:block">
            <div className="mb-10 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              CuraSoft Dental Platform
            </div>
            <h1 className="max-w-md text-4xl font-bold leading-tight">Professional dental operations, one secure workspace.</h1>
            <p className="mt-4 max-w-md text-slate-300">
              Appointments, treatment tracking, billing, and team coordination with enterprise-grade account security.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-slate-300">Secure account access</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
                <p className="text-2xl font-bold">Multi-Branch</p>
                <p className="text-sm text-slate-300">Centralized clinic control</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/85 sm:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{titleByView[view]}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitleByView[view]}</p>
            </div>

            <div className="space-y-4">
              {error && <Alert tone="error" message={error} />}
              {success && <Alert tone="success" message={success} />}
            </div>

            {view === 'login' && (
              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-5">
                <InputField
                  id="login-identity"
                  label="Email or username"
                  type="text"
                  value={loginIdentity}
                  onChange={e => setLoginIdentity(e.target.value)}
                  placeholder="name@clinic.com or username"
                  autoComplete="username"
                  required
                />
                <InputField
                  id="login-password"
                  label="Password"
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  showPasswordToggle
                  onTogglePassword={() => setShowLoginPassword(prev => !prev)}
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => switchView('forgot')}
                    className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-300/40 transition hover:from-emerald-600 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-emerald-950/30"
                >
                  {loginLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            )}

            {view === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-5">
                <InputField
                  id="register-email"
                  label="Email"
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="name@clinic.com"
                  autoComplete="email"
                  required
                />
                <InputField
                  id="register-password"
                  label="Password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="At least 8 chars, upper/lower/number"
                  autoComplete="new-password"
                  required
                  showPasswordToggle
                  onTogglePassword={() => setShowRegPassword(prev => !prev)}
                />
                <InputField
                  id="register-confirm-password"
                  label="Confirm password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-teal-300/40 transition hover:from-teal-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-teal-950/30"
                >
                  {registerLoading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgotPasswordSubmit} className="mt-6 space-y-5">
                <InputField
                  id="forgot-email"
                  label="Account email"
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="name@clinic.com"
                  autoComplete="email"
                  required
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-300/40 transition hover:from-cyan-600 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-cyan-950/30"
                >
                  {forgotLoading ? 'Sending reset link...' : 'Send reset link'}
                </button>
              </form>
            )}

            {view === 'reset' && (
              <form onSubmit={handleResetPasswordSubmit} className="mt-6 space-y-5">
                <InputField
                  id="new-password"
                  label="New password"
                  type={showResetPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 chars, upper/lower/number"
                  autoComplete="new-password"
                  required
                  showPasswordToggle
                  onTogglePassword={() => setShowResetPassword(prev => !prev)}
                />
                <InputField
                  id="confirm-new-password"
                  label="Confirm new password"
                  type={showResetPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 font-semibold text-white shadow-lg shadow-amber-300/40 transition hover:from-amber-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-amber-950/30"
                >
                  {resetLoading ? 'Updating password...' : 'Update password'}
                </button>
              </form>
            )}

            <div className="mt-7 border-t border-slate-200 pt-5 text-center text-sm dark:border-slate-700">
              {view === 'login' && (
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                >
                  New here? Create an account
                </button>
              )}
              {view === 'register' && (
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                >
                  Already have an account? Sign in
                </button>
              )}
              {view === 'forgot' && (
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                >
                  Back to sign in
                </button>
              )}
              {view === 'reset' && (
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                >
                  Back to sign in
                </button>
              )}

              {onRequestClinicRegistration && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={onRequestClinicRegistration}
                    className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                  >
                    Create a new clinic (14-day trial)
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
