/**
 * Register New Clinic Page
 * Allows creating a new clinic with 14-day free trial
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { tenantService, subscriptionService } from '../auth/tenantService';

interface RegisterClinicProps {
  onSuccess?: () => void;
}

const RegisterClinic: React.FC<RegisterClinicProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // Clinic info
    clinicName: '',
    clinicSlug: '',
    email: '',
    phone: '',
    // Owner info
    ownerName: '',
    ownerEmail: '',
    password: '',
    confirmPassword: '',
    // Agreement
    agreeTerms: false,
  });

  // Generate slug from clinic name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]/g, '') // Keep Arabic and English letters
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  };

  const handleClinicNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      clinicName: value,
      clinicSlug: generateSlug(value)
    }));
  };

  const validateStep1 = () => {
    if (!formData.clinicName.trim()) {
      setError('Please enter clinic name');
      return false;
    }
    if (!formData.clinicSlug.trim()) {
      setError('Please enter clinic URL');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(formData.clinicSlug)) {
      setError('URL can only contain lowercase letters, numbers, and dashes');
      return false;
    }
    if (formData.clinicSlug.length < 3) {
      setError('URL must be at least 3 characters');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.ownerName.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.ownerEmail.trim()) {
      setError('Please enter owner email');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter clinic email');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.agreeTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    if (!supabase) {
      setError('Database connection not available');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create tenant/clinic
      const tenantResult = await tenantService.createTenant({
        name: formData.clinicName,
        slug: formData.clinicSlug,
        email: formData.email,
        phone: formData.phone,
        owner_email: formData.ownerEmail,
        owner_password: formData.password,
      });

      if (!tenantResult.success || !tenantResult.data) {
        throw new Error(tenantResult.error || 'Failed to create clinic');
      }

      // Step 2: Create auth user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.ownerEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.ownerName,
            clinic_name: formData.clinicName,
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Step 3: Link user to tenant
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          tenant_id: tenantResult.data.tenant_id,
          is_owner: true,
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Failed to link user to tenant:', updateError);
        // Continue anyway - can be fixed manually
      }

      // Step 4: Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          username: formData.ownerEmail.split('@')[0],
          email: formData.ownerEmail,
          first_name: formData.ownerName.split(' ')[0],
          last_name: formData.ownerName.split(' ').slice(1).join(' ') || '',
          role: 'ADMIN',
          status: 'ACTIVE',
          tenant_id: tenantResult.data.tenant_id,
        });

      if (profileError) {
        console.error('Failed to create user profile:', profileError);
      }

      // Success!
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to login with success message
        navigate('/login', { 
          state: { 
            message: 'Clinic created successfully! Please check your email to verify your account.' 
          } 
        });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">إنشاء عيادة جديدة</h1>
          <p className="text-blue-100 mt-2">جرب مجاناً لمدة 14 يوم</p>
          
          {/* Progress Steps */}
          <div className="flex justify-center mt-4 space-x-2">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-white' : 'bg-blue-400'}`}></div>
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-white' : 'bg-blue-400'}`}></div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم العيادة
                </label>
                <input
                  type="text"
                  value={formData.clinicName}
                  onChange={(e) => handleClinicNameChange(e.target.value)}
                  placeholder="عيادة أسنان العمران"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رابط العيادة
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-r-lg text-gray-500 text-sm">
                    curasoft.app/
                  </span>
                  <input
                    type="text"
                    value={formData.clinicSlug}
                    onChange={(e) => setFormData(prev => ({ ...prev, clinicSlug: generateSlug(e.target.value) }))}
                    placeholder="clinic-name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  هذا الرابط سيُستخدم للوصول لبرنامجك
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني للعيادة
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@clinic.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف (اختياري)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+20 100 000 0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                التالي
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسمك الكامل
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  placeholder="أحمد محمد"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني للمالك
                </label>
                <input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  placeholder="ahmed@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تأكيد كلمة المرور
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                  className="mt-1 ml-2"
                />
                <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                  أوافق على <a href="#" className="text-blue-600 hover:underline">الشروط والأحكام</a> و <a href="#" className="text-blue-600 hover:underline">سياسة الخصوصية</a>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  السابق
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'جاري الإنشاء...' : 'إنشاء مجاناً'}
                </button>
              </div>

              <p className="text-center text-sm text-gray-500">
                🎁 فترة تجريبية 14 يوم - بدون بطاقة ائتمان
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-gray-600">
            لديك حساب بالفعل؟{' '}
            <a href="/login" className="text-blue-600 font-semibold hover:underline">
              تسجيل الدخول
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterClinic;
