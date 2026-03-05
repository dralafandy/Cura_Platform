/**
 * Subscription Status Component
 * Shows current subscription status and trial countdown
 */

import React, { useState, useEffect } from 'react';
import { tenantService, subscriptionService } from '../auth/tenantService';
import type { TenantInfo, SubscriptionPlan } from '../auth/types';

interface SubscriptionStatusProps {
  tenantId: string;
  onUpgrade?: () => void;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ tenantId, onUpgrade }) => {
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [infoResult, plansResult] = await Promise.all([
        tenantService.getTenantInfo(tenantId),
        subscriptionService.getPlans(),
      ]);

      if (infoResult.success && infoResult.data) {
        setTenantInfo(infoResult.data);
      }
      if (plansResult.success && plansResult.data) {
        setPlans(plansResult.data);
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'نشط';
      case 'TRIAL':
        return 'فترة تجريبية';
      case 'EXPIRED':
        return 'منتهي';
      case 'SUSPENDED':
        return 'معلق';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
    );
  }

  if (!tenantInfo) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300">
        فشل تحميل معلومات الاشتراك
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`p-6 rounded-lg border-2 ${getStatusColor(tenantInfo.subscription_status)}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {tenantInfo.subscription_plan === 'trial' ? 'الخطة التجريبية' : 
               tenantInfo.subscription_plan === 'basic' ? 'الخطة الأساسية' :
               tenantInfo.subscription_plan === 'professional' ? 'الخطة الاحترافية' :
               tenantInfo.subscription_plan === 'enterprise' ? 'خطة المؤسسات' : tenantInfo.subscription_plan}
            </h3>
            <p className={`text-2xl font-bold mt-2`}>
              {getStatusText(tenantInfo.subscription_status)}
            </p>
          </div>
          
          {tenantInfo.subscription_status === 'TRIAL' && (
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-300">
                {tenantInfo.trial_days_remaining}
              </div>
              <div className="text-sm">يوم متبقي</div>
            </div>
          )}
        </div>

        {/* Trial Info */}
        {tenantInfo.subscription_status === 'TRIAL' && (
          <div className="mt-4 pt-4 border-t border-current opacity-75">
            <p className="text-sm">
              الفترة التجريبية تنتهي في: {formatDate(tenantInfo.subscription_plan)}
            </p>
            <p className="text-sm mt-1">
              لا تفوت! قم بالترقية الآن للحفاظ على جميع بياناتك
            </p>
          </div>
        )}

        {/* Active Subscription Info */}
        {tenantInfo.subscription_status === 'ACTIVE' && (
          <div className="mt-4 pt-4 border-t border-current opacity-75">
            <p className="text-sm">
              الاشتراك نشط حتى: {formatDate(tenantInfo.subscription_plan)}
            </p>
          </div>
        )}

        {/* Expired/Warning */}
        {(tenantInfo.subscription_status === 'EXPIRED' || 
          (tenantInfo.subscription_status === 'TRIAL' && tenantInfo.trial_days_remaining <= 7)) && (
          <div className="mt-4 pt-4 border-t border-current">
            <button
              onClick={onUpgrade || (() => setShowPlans(true))}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              ترقية الآن
            </button>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <div className="text-sm text-gray-500">المستخدمون</div>
          <div className="text-xl font-semibold">
            {tenantInfo.current_users} / {tenantInfo.max_users}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (tenantInfo.current_users / tenantInfo.max_users) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <div className="text-sm text-gray-500">المرضى</div>
          <div className="text-xl font-semibold">
            {tenantInfo.current_patients} / {tenantInfo.max_patients}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (tenantInfo.current_patients / tenantInfo.max_patients) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Show Plans Modal */}
      {showPlans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">اختر خطتك</h2>
                <button
                  onClick={() => setShowPlans(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.filter(p => !p.is_trial).map((plan) => (
                <div 
                  key={plan.id}
                  className={`p-4 rounded-lg border-2 ${
                    plan.slug === tenantInfo.subscription_plan 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h3 className="font-semibold text-lg">{plan.name_ar}</h3>
                  <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                  
                  <div className="mt-4">
                    <span className="text-2xl font-bold">{plan.price_monthly}</span>
                    <span className="text-gray-500"> جم/شهر</span>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm">
                    <li>✓ حتى {plan.max_users} مستخدم</li>
                    <li>✓ حتى {plan.max_patients} مريض</li>
                    <li>✓ {plan.max_storage_mb} MB تخزين</li>
                  </ul>

                  <button
                    onClick={async () => {
                      try {
                        const result = await subscriptionService.activateSubscription(tenantId, plan.slug);
                        if (result.success) {
                          setShowPlans(false);
                          loadData();
                        }
                      } catch (error) {
                        console.error('Failed to activate subscription:', error);
                      }
                    }}
                    className={`w-full mt-4 py-2 rounded-lg font-semibold ${
                      plan.slug === tenantInfo.subscription_plan
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    disabled={plan.slug === tenantInfo.subscription_plan}
                  >
                    {plan.slug === tenantInfo.subscription_plan ? 'خطتك الحالية' : 'اختيار'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
