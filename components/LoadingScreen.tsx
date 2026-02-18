import React from 'react';
import { useI18n } from '../hooks/useI18n';

const LoadingScreen: React.FC = () => {
  const { t, locale, direction } = useI18n();

  const loadingDataText =
    t('loadingScreen.loadingData') !== 'loadingScreen.loadingData'
      ? t('loadingScreen.loadingData')
      : locale === 'ar'
        ? 'جاري تحميل البيانات'
        : 'Loading data';

  const pleaseWaitText =
    t('loadingScreen.pleaseWait') !== 'loadingScreen.pleaseWait'
      ? t('loadingScreen.pleaseWait')
      : locale === 'ar'
        ? 'يرجى الانتظار، يتم تحميل بيانات العيادة'
        : 'Please wait, clinic data is loading';

  const thanksText =
    locale === 'ar'
      ? 'شكر خاص للدكتور شريف جمال و الآنسة أسماء طوسون لتجربة البرنامج و العمل على تطويره'
      : 'Special thanks to Dr. Sherif Gamal and Ms. Asmaa Toson for testing the program and helping improve it.';

  return (
    <div
      dir={direction}
      className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-cyan-300/30 dark:bg-cyan-800/20 blur-3xl animate-blob motion-reduce:animate-none" />
        <div className="absolute top-10 right-1/4 h-80 w-80 rounded-full bg-blue-300/30 dark:bg-blue-800/20 blur-3xl animate-blob animation-delay-2000 motion-reduce:animate-none" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-teal-300/30 dark:bg-teal-800/20 blur-3xl animate-blob animation-delay-4000 motion-reduce:animate-none" />
      </div>
      <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative w-full max-w-xl rounded-3xl border border-white/60 dark:border-slate-700/60 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-slate-300/30 dark:shadow-black/40 p-7 sm:p-10 text-center">
        <div className="mb-7">
          <div className="relative mx-auto mb-5 h-24 w-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 shadow-lg shadow-cyan-300/40 dark:shadow-cyan-950/50 animate-float motion-reduce:animate-none">
            <img src="/logo.svg" alt="CuraSoft Logo" className="h-full w-full object-contain" />
          </div>
          <svg
            className="w-14 h-14 text-cyan-600 dark:text-cyan-400 animate-spin motion-reduce:animate-none mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
          {loadingDataText}
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-8 text-base leading-relaxed">{pleaseWaitText}</p>

        <div className="flex justify-center">
          <div className="w-full max-w-xs h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-pulse motion-reduce:animate-none"></div>
          </div>
        </div>

        <div className="mt-8 text-sm text-slate-500 dark:text-slate-400">
          <p>{thanksText}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
