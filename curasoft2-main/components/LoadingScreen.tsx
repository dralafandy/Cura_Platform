import React from 'react';
import { useI18n } from '../hooks/useI18n';

const LoadingScreen: React.FC = () => {
    const { t } = useI18n();

    return (
        <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
                <div className="mb-6">
                    <img src="/logo.svg" alt="CuraSoft Logo" className="w-20 h-20 mx-auto mb-4 animate-pulse" />
                    <svg className="w-16 h-16 text-primary animate-spin mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {t('loadingScreen.loadingData') || 'جاري تحميل البيانات'}
                </h2>
                <p className="text-slate-600 mb-8">
                    {t('loadingScreen.pleaseWait') || 'يرجى الانتظار، يتم تحميل بيانات العيادة'}
                </p>
                <div className="flex justify-center">
                    <div className="w-64 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-pulse"></div>
                    </div>
                </div>
                <div className="mt-8 text-sm text-slate-500">
                    <p>شكر خاص للدكتور شريف جمال و الآنسة أسماء طوسون لتجربة البرنامج و العمل على تطويره</p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;