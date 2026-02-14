import React, { useState, useEffect } from 'react';
import App from './App';
import LoginPage from './pages/LoginPage';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabaseClient';
import { useI18n } from './hooks/useI18n';
import { UserRole } from './types';
import bcrypt from 'bcryptjs';

const BackendConfigMessage: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">{t('auth.config.title')}</h1>
            <p className="text-slate-600 mt-2">{t('auth.config.message')}</p>
        </div>
        <div className="text-sm text-slate-700 bg-slate-100 p-4 rounded-lg">
          <p className="font-semibold">{t('auth.config.instructions')}</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Open the `backend_setup.md` file.</li>
            <li>Follow the steps to create a free Supabase project.</li>
            <li>Copy your project's URL and anon key.</li>
            <li>Add them as secrets named `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your environment.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};


const AuthApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);

  console.log('=== AuthApp RENDER ===');
  console.log('AuthApp: user exists:', !!user);
  console.log('AuthApp: auth loading:', loading);
  console.log('AuthApp: hasUsers in db:', hasUsers);
  console.log('AuthApp: supabase configured:', !!supabase);

  useEffect(() => {
    const checkExistingUsers = async () => {
      console.log('AuthApp: Checking for existing users in database...');
      if (!supabase) {
        console.log('AuthApp: No supabase configured, forcing setup page');
        setHasUsers(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);

        if (error) {
          console.error('AuthApp: Error checking existing users:', error);
          console.log('AuthApp: Error details:', error.details, error.hint, error.code);
          // If it's a permission error or table doesn't exist, assume no users
          if (error.code === 'PGRST116' || error.message.includes('permission denied') || error.message.includes('does not exist')) {
            console.log('AuthApp: Table issue detected, assuming no users exist');
            setHasUsers(false);
          } else {
            throw error;
          }
        } else {
          const usersExist = data && data.length > 0;
          console.log('AuthApp: Users exist in database:', usersExist, 'count:', data?.length || 0);
          setHasUsers(usersExist);
        }
      } catch (error) {
        console.error('AuthApp: Unexpected error checking users:', error);
        // Default to showing setup if check fails
        setHasUsers(false);
      }
    };

    checkExistingUsers();
  }, []);

  const FirstUserSetup: React.FC = () => {
    const { t } = useI18n();
    const [formData, setFormData] = useState({
      username: 'admin',
      password: '123',
      confirmPassword: '123',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setMessage(null);

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 3) {
        setError('Password must be at least 3 characters long');
        return;
      }

      setLoading(true);

      try {
        // Hash the password before storing
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(formData.password, saltRounds);
        
        // Create internal user profile directly
        // Generate a proper UUID for the admin user
        const adminId = crypto.randomUUID();
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: adminId,
            user_id: null, // No external auth user
            username: formData.username,
            role: UserRole.ADMIN,
            password_hash: passwordHash,
          });

        if (profileError) throw profileError;

        setMessage('Admin user created successfully! You can now log in.');

        // Auto-login after successful creation
        setTimeout(() => {
          // Simulate login by setting session storage
          sessionStorage.setItem('clinic_user', JSON.stringify({
            id: adminId, // Use the same UUID generated above
            username: formData.username,
            role: UserRole.ADMIN,
            loginTime: new Date().toISOString(),
          }));
          window.location.reload(); // Reload to trigger auth state change
        }, 2000);

      } catch (err: any) {
        setError(err.message || 'Failed to create admin user');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mt-4">Setup First Admin</h1>
              <p className="text-slate-500 text-center">Create the first administrator account for your clinic management system</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-sm text-blue-800">
                <p className="font-semibold">Setup Admin Account:</p>
                <p>Username: admin (or any username you choose)</p>
                <p>Password: at least 6 characters with letter and number</p>
                <p className="text-xs mt-1">You can change these later in User Management</p>
              </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative" role="alert">
                <span className="block sm:inline">{message}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Enter admin username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:bg-primary/50"
            >
              {loading ? 'Creating Admin User...' : 'Create Admin User'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  console.log('AuthApp: Evaluating render conditions...');

  if (loading) {
    console.log('AuthApp: → Showing AUTH loading state');
    return (
        <div className="min-h-screen bg-neutral-light flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-slate-600">Authenticating...</p>
            </div>
        </div>
    );
  }

  if (!supabase) {
    console.log('AuthApp: → No Supabase configured, showing config message');
    return <BackendConfigMessage />;
  }

  if (user) {
    console.log('AuthApp: → User authenticated, rendering main App');
    return <App />;
  }

  // If we haven't checked for existing users yet, show loading
  if (hasUsers === null) {
    console.log('AuthApp: → Checking for existing users in database...');
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Checking system setup...</p>
        </div>
      </div>
    );
  }

  // If no users exist, show setup page for creating the first admin user
  if (!hasUsers) {
    console.log('AuthApp: → No users in database, showing first user setup');
    return <FirstUserSetup />;
  }

  // If users exist, show login page
  console.log('AuthApp: → Users exist in database, showing login page');
  return <LoginPage />;
};

export default AuthApp;
