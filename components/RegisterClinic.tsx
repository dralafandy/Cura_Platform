/**
 * Register New Clinic Page
 * Allows creating a new clinic with 14-day free trial
 */

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { tenantService } from '../auth/tenantService';

interface RegisterClinicProps {
  onSuccess?: () => void;
}

const RegisterClinic: React.FC<RegisterClinicProps> = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clinicName: 'كيورا',
    clinicSlug: 'kiura',
    email: '',
    phone: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const generateSlug = (name: string) => {
    const normalized = name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);

    const ascii = normalized.replace(/[^\x00-\x7F]/g, '').replace(/^-+|-+$/g, '');
    return ascii || 'kiura';
  };

  const handleClinicNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      clinicName: value,
      clinicSlug: generateSlug(value),
    }));
  };

  const validateStep1 = () => {
    if (!formData.clinicName.trim()) return setError('يرجى إدخال اسم العيادة'), false;
    if (!formData.clinicSlug.trim()) return setError('يرجى إدخال رابط العيادة'), false;
    if (!/^[a-z0-9-]+$/.test(formData.clinicSlug)) return setError('الرابط يقبل أحرف إنجليزية صغيرة وأرقام وشرطة فقط'), false;
    if (formData.clinicSlug.length < 3) return setError('الرابط يجب أن يكون 3 أحرف على الأقل'), false;
    if (!formData.email.trim()) return setError('يرجى إدخال بريد العيادة'), false;
    return true;
  };

  const validateStep2 = () => {
    if (!formData.ownerName.trim()) return setError('يرجى إدخال اسم المالك'), false;
    if (!formData.ownerEmail.trim()) return setError('يرجى إدخال بريد المالك'), false;
    if (!formData.password || formData.password.length < 8) return setError('كلمة المرور لا تقل عن 8 أحرف'), false;
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      return setError('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'), false;
    }
    if (formData.password !== formData.confirmPassword) return setError('كلمتا المرور غير متطابقتين'), false;
    if (!formData.agreeTerms) return setError('يجب الموافقة على الشروط والأحكام'), false;
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    if (!supabase) return setError('اتصال قاعدة البيانات غير متاح');

    setLoading(true);
    setError(null);

    try {
      const ownerEmail = formData.ownerEmail.trim().toLowerCase();
      const ownerUsername = ownerEmail.split('@')[0];
      const firstName = formData.ownerName.split(' ')[0] || '';
      const lastName = formData.ownerName.split(' ').slice(1).join(' ') || '';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: ownerEmail,
        password: formData.password,
        options: {
          data: {
            username: ownerUsername,
            first_name: firstName,
            last_name: lastName,
            full_name: formData.ownerName,
            clinic_name: formData.clinicName,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message || 'فشل إنشاء حساب المالك');
      }

      if (!authData.user || (Array.isArray((authData.user as any).identities) && (authData.user as any).identities.length === 0)) {
        throw new Error('فشل إنشاء حساب المالك. قد يكون البريد مستخدمًا مسبقًا.');
      }

      // Owner promotion RPC requires an authenticated session.
      if (!authData.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: ownerEmail,
          password: formData.password,
        });
        if (signInError || !signInData.session) {
          throw new Error('تم إنشاء الحساب، لكن تعذر تسجيل الدخول تلقائيًا. سجّل الدخول أولًا ثم أكمل إعداد العيادة.');
        }
      }

      const tenantResult = await tenantService.createTenant({
        name: formData.clinicName,
        slug: formData.clinicSlug,
        email: formData.email,
        phone: formData.phone,
        owner_email: ownerEmail,
      });

      if (!tenantResult.success || !tenantResult.data) {
        throw new Error(tenantResult.error || 'فشل إنشاء العيادة');
      }

      const { error: promoteError } = await supabase.rpc('promote_current_user_to_tenant_owner', {
        p_tenant_id: tenantResult.data.tenant_id,
      });

      if (promoteError) {
        throw new Error(promoteError.message || 'فشل ربط المالك بالعيادة');
      }

      // Ensure tenant context is persisted immediately for mixed legacy schemas.
      await supabase.rpc('link_current_user_tenant_context', {
        p_preferred_tenant_id: tenantResult.data.tenant_id,
      });

      if (onSuccess) onSuccess();
      else window.location.assign('/login');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">إنشاء عيادة جديدة</h1>
          <p className="text-white/90 mt-2">تجربة مجانية لمدة 14 يوم</p>
          <div className="flex justify-center mt-4 space-x-2">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-white' : 'bg-blue-300'}`}></div>
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-white' : 'bg-blue-300'}`}></div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-300/40 rounded-lg text-red-100 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">اسم العيادة</label>
                <input
                  type="text"
                  value={formData.clinicName}
                  onChange={e => handleClinicNameChange(e.target.value)}
                  placeholder="عيادة أسنان كيورا"
                  className="w-full px-4 py-2 border border-white/30 bg-white/10 text-white placeholder-white/60 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">رابط العيادة</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-white/15 border border-r-0 border-white/30 rounded-r-lg text-white/85 text-sm">curasoft.app/</span>
                  <input
                    type="text"
                    value={formData.clinicSlug}
                    onChange={e => setFormData(prev => ({ ...prev, clinicSlug: generateSlug(e.target.value) }))}
                    placeholder="kiura"
                    className="flex-1 px-4 py-2 border border-white/30 bg-white/10 text-white placeholder-white/60 rounded-l-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">بريد العيادة</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@kiura.com"
                  className="w-full px-4 py-2 border border-white/30 bg-white/10 text-white placeholder-white/60 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">رقم الهاتف (اختياري)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+20 100 000 0000"
                  className="w-full px-4 py-2 border border-white/30 bg-white/10 text-white placeholder-white/60 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => {
                  setError(null);
                  if (validateStep1()) setStep(2);
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                التالي
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">اسم المالك</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={e => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  placeholder="أحمد محمد"
                  className="w-full px-4 py-2 border border-white/30 bg-white/10 text-white placeholder-white/60 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">بريد المالك</label>
                <input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={e => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  placeholder="owner@kiura.com"
                  className="w-full px-4 py-2 border border-white/30 bg-white/10 text-white placeholder-white/60 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">كلمة المرور</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-white/30 bg-white/10 text-white placeholder-white/60 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-white/30 bg-white/10 text-white placeholder-white/60 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={e => setFormData(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                  className="mt-1 ml-2"
                />
                <label htmlFor="agreeTerms" className="text-sm text-white/90">
                  أوافق على <a href="#" className="text-cyan-300 hover:underline">الشروط والأحكام</a> و <a href="#" className="text-cyan-300 hover:underline">سياسة الخصوصية</a>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
                >
                  السابق
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'جارٍ الإنشاء...' : 'إنشاء مجاني'}
                </button>
              </div>
              <p className="text-center text-sm text-white/80">تجربة مجانية 14 يوم - بدون بطاقة ائتمان</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-white/90">
            لديك حساب بالفعل؟{' '}
            <a href="/login" className="text-cyan-300 font-semibold hover:underline">
              تسجيل الدخول
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterClinic;
