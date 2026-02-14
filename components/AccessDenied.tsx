import React from 'react';
import { useI18n } from '../hooks/useI18n';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showGoBack?: boolean;
  onGoBack?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title,
  message,
  showGoBack = true,
  onGoBack
}) => {
  const { t, direction } = useI18n();
  
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 p-4">
      <div className="w-full max-w-md">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
            <div className="relative bg-red-100 dark:bg-red-900/30 p-6 rounded-full">
              <svg 
                className="w-16 h-16 text-red-600 dark:text-red-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-8 space-y-6 text-center">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {title || (direction === 'rtl' ? 'الوصول مرفوض' : 'Access Denied')}
            </h1>
            <div className="h-1 w-12 bg-red-500 mx-auto rounded-full"></div>
          </div>

          {/* Status Code */}
          <div className="text-6xl font-black text-neutral-200 dark:text-neutral-700">
            403
          </div>

          {/* Message */}
          <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
            {message || (direction === 'rtl' 
              ? 'ليس لديك الإذن للوصول إلى هذه الصفحة. يرجى التواصل مع المسؤول.' 
              : "You don't have permission to access this resource. Please contact your administrator if you believe this is an error."
            )}
          </p>

          {/* Additional Info */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300">
              {direction === 'rtl' 
                ? '🔐 يتطلب هذا القسم صلاحيات خاصة للوصول'
                : '🔐 This section requires special permissions to access'
              }
            </p>
          </div>

          {/* Action Buttons */}
          {showGoBack && (
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleGoBack}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                {direction === 'rtl' ? '← العودة' : 'Go Back →'}
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-3 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg transition-all duration-200"
              >
                {direction === 'rtl' ? 'إلى الصفحة الرئيسية' : 'Go to Home'}
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm mt-6">
          {direction === 'rtl'
            ? 'إذا كان لديك أسئلة، يرجى التواصل مع فريق الدعم'
            : 'If you have questions, please contact support'
          }
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
