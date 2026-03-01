import React, { useState, useEffect } from 'react';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterClinic from './components/RegisterClinic';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabaseClient';
import { useI18n } from './hooks/useI18n';

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
            <li>Create or connect your Supabase project.</li>
            <li>Copy your project URL and anon key.</li>
            <li>Set `SUPABASE_URL` and `SUPABASE_ANON_KEY`.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const AuthApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [showClinicRegistration, setShowClinicRegistration] = useState(false);

  useEffect(() => {
    const checkExistingUsers = async () => {
      if (!supabase) {
        setHasUsers(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);

        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('permission denied') || error.message.includes('does not exist')) {
            setHasUsers(false);
            return;
          }
          throw error;
        }

        setHasUsers((data?.length || 0) > 0);
      } catch {
        setHasUsers(false);
      }
    };

    checkExistingUsers();
  }, []);

  if (loading) {
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
    return <BackendConfigMessage />;
  }

  if (user) {
    return <App />;
  }

  if (hasUsers === null) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Checking system setup...</p>
        </div>
      </div>
    );
  }

  if (!hasUsers) {
    return <RegisterClinic onSuccess={() => setHasUsers(true)} />;
  }

  if (showClinicRegistration) {
    return (
      <RegisterClinic
        onSuccess={() => {
          setHasUsers(true);
          setShowClinicRegistration(false);
        }}
      />
    );
  }

  return <LoginPage onRequestClinicRegistration={() => setShowClinicRegistration(true)} />;
};

export default AuthApp;
