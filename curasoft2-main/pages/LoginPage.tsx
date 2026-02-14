import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { verifyPassword } from '../services/userService';

// Reusable Input Field Component
interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  showPasswordToggle = false,
  onTogglePassword,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-slate-700 transition-colors"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-4 py-3 bg-white border rounded-lg text-sm
            placeholder-slate-400 transition-all duration-200
            ${isFocused 
              ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' 
              : 'border-slate-200 hover:border-slate-300'
            }
            ${error ? 'border-red-300 ring-2 ring-red-100' : ''}
            ${showPasswordToggle ? 'pr-12' : ''}
          `}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
        <p id={`${id}-error`} className="text-sm text-red-600 flex items-center gap-1" role="alert">
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
      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
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

// Feature Card Component with Animation
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'cyan' | 'violet' | 'teal' | 'amber' | 'rose' | 'emerald';
  delay: number;
  mounted: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, delay, mounted }) => {
  const colorClasses = {
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-200',
    violet: 'from-violet-500 to-violet-600 shadow-violet-200',
    teal: 'from-teal-500 to-teal-600 shadow-teal-200',
    amber: 'from-amber-500 to-amber-600 shadow-amber-200',
    rose: 'from-rose-500 to-rose-600 shadow-rose-200',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
  };

  return (
    <div 
      className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-100 
        shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Animated Icon Container */}
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} 
        flex items-center justify-center text-white shadow-lg
        mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
        <div className="animate-pulse-slow">
          {icon}
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-transparent 
        group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 
        transition-all duration-300">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-sm text-slate-500 leading-relaxed">
        {description}
      </p>

      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colorClasses[color].split(' ')[0].replace('500', '400')}/10 
        opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
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
        border border-slate-200 rounded-lg bg-white text-sm font-medium
        transition-all duration-200
        ${disabled || isLoading 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      aria-label={`Sign in with ${provider}`}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [mounted, setMounted] = useState(false);
  const { loginWithGoogle, loginWithFacebook } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!username.trim()) {
        throw new Error('Username is required');
      }
      if (!password) {
        throw new Error('Password is required');
      }

      const { data, error } = await supabase!
        .from('user_profiles')
        .select('*')
        .eq('username', username);

      if (error || !data || data.length === 0) {
        throw new Error('Invalid username or password');
      }

      const userData = data[0];

      if (!userData.password_hash) {
        throw new Error('Account not properly configured. Please contact administrator.');
      }

      const isValidPassword = await verifyPassword(password, userData.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid username or password');
      }

      sessionStorage.setItem('clinic_session', JSON.stringify({
        user: userData,
        loginTime: new Date().toISOString(),
      }));

      setError(null);
      window.location.reload();

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your username and password.');
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

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50 to-violet-50">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-300/30 to-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-violet-300/30 to-violet-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-gradient-to-br from-teal-300/30 to-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Left Side - Illustration (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative items-center justify-center p-12">
        <div className={`relative z-10 max-w-2xl transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Brand Title */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-slate-800 mb-2">
              <span className="bg-gradient-to-r from-cyan-600 to-violet-600 bg-clip-text text-transparent">CuraSoft</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium">Clinic Management System</p>
          </div>

          {/* Dental Illustration with Logo */}
          <div className="relative">
            <div className="w-72 h-72 mx-auto relative">
              {/* Main Circle with gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 via-violet-400/20 to-teal-400/30 rounded-full animate-pulse-slow shadow-2xl shadow-cyan-300/20" />
              
              {/* Inner rotating ring */}
              <div className="absolute inset-4 border-2 border-dashed border-cyan-300/40 rounded-full animate-spin" style={{ animationDuration: '30s' }} />
              
              {/* Logo in Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 bg-white/95 backdrop-blur-sm rounded-full p-6 shadow-2xl shadow-cyan-200/50 border-4 border-white/80 animate-float">
                  <img 
                    src="/logo.svg" 
                    alt="CuraSoft Logo" 
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              </div>

              {/* Orbiting Elements */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-6 h-6 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full shadow-lg shadow-cyan-400/50 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 w-5 h-5 bg-gradient-to-br from-violet-400 to-violet-500 rounded-full shadow-lg shadow-violet-400/50 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '25s' }}>
                <div className="absolute top-1/2 right-0 translate-x-3 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-teal-400 to-teal-500 rounded-full shadow-lg shadow-teal-400/50 flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="mt-10 text-center">
              <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
                Modern dental clinic management system designed for efficiency and patient care excellence.
              </p>
              
              {/* Feature Cards Grid */}
              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                <FeatureCard
                  icon={
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                  title="Patient Management"
                  description="Complete patient records, history & treatment tracking"
                  color="cyan"
                  delay={100}
                  mounted={mounted}
                />
                <FeatureCard
                  icon={
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  title="Appointments"
                  description="Smart scheduling with reminders & calendar sync"
                  color="violet"
                  delay={200}
                  mounted={mounted}
                />
                <FeatureCard
                  icon={
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  title="Financial Reports"
                  description="Detailed analytics, invoicing & revenue tracking"
                  color="teal"
                  delay={300}
                  mounted={mounted}
                />
                <FeatureCard
                  icon={
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  title="Treatment Plans"
                  description="Digital prescriptions & procedure documentation"
                  color="amber"
                  delay={400}
                  mounted={mounted}
                />
                <FeatureCard
                  icon={
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  }
                  title="Dental Chart"
                  description="Interactive 3D tooth charting & annotations"
                  color="rose"
                  delay={500}
                  mounted={mounted}
                />
                <FeatureCard
                  icon={
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                  title="Staff Management"
                  description="Doctor schedules, roles & permissions"
                  color="emerald"
                  delay={600}
                  mounted={mounted}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className={`w-full max-w-md transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Login Card with Glass Morphism */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 p-8 sm:p-10 space-y-6">
            
            {/* Header Section with Logo */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200/50 animate-float p-3">
                <img 
                  src="/logo.svg" 
                  alt="CuraSoft Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Welcome Back
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Sign in to your clinic account
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <ErrorAlert 
                message={error} 
                onDismiss={() => setError(null)} 
              />
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className={`transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <InputField
                  id="username"
                  label={t('auth.login.username') || 'Username'}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.login.usernamePlaceholder') || 'Enter your username'}
                  required
                />
              </div>
              
              <div className={`transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <InputField
                  id="password"
                  label={t('auth.login.password') || 'Password'}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.login.passwordPlaceholder') || 'Enter your password'}
                  required
                  showPasswordToggle
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className={`flex items-center justify-between transition-all duration-500 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 transition-colors cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                    {t('auth.login.rememberMe') || 'Remember me'}
                  </span>
                </label>
                <a 
                  href="#" 
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors hover:underline"
                >
                  {t('auth.login.forgotPassword') || 'Forgot password?'}
                </a>
              </div>

              <div className={`transition-all duration-500 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg shadow-cyan-200/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('auth.login.signingIn') || 'Signing in...'}</span>
                    </div>
                  ) : (
                    t('auth.login.signIn') || 'Sign In'
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/90 text-slate-500 font-medium">
                  {t('auth.oauth.or') || 'or continue with'}
                </span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <OAuthButton
                provider="google"
                onClick={handleGoogleLogin}
                disabled={!!oauthLoading}
                isLoading={oauthLoading === 'google'}
                label={t('auth.oauth.google') || 'Google'}
              />
              <OAuthButton
                provider="facebook"
                onClick={handleFacebookLogin}
                disabled={!!oauthLoading}
                isLoading={oauthLoading === 'facebook'}
                label={t('auth.oauth.facebook') || 'Facebook'}
              />
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-slate-500 text-xs">
                {t('auth.login.agreement') || 'By signing in, you agree to our'}{' '}
                <a href="#" className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors hover:underline">
                  {t('auth.login.terms') || 'Terms of Service'}
                </a>
                {' '}{t('common.and') || 'and'}{' '}
                <a href="#" className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors hover:underline">
                  {t('auth.login.privacy') || 'Privacy Policy'}
                </a>
              </p>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              {t('auth.login.needHelp') || 'Need help?'}{' '}
              <a href="#" className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors hover:underline">
                {t('auth.login.contactSupport') || 'Contact Support'}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
